import { randomUUID } from "crypto";
import { generateNFeXml, FORBIDDEN_CNF } from "@/lib/nfe-generator";
import { getNFeEnvironment, getNFeServiceUrls, getNFeTpAmb } from "@/lib/nfe-config";
import { getActiveNFeTechnicalResponsible } from "@/lib/nfe-technical-responsible";
import { getOrder } from "@/lib/orders";
import { getSupabase, requireSupabase } from "@/lib/supabase";
import { validateNFeSignature } from "@/lib/nfe-signer";
import { extractBlock, extractReturnXml, readTag, SefazNfeClient, type SefazResponse } from "@/lib/sefaz-nfe-client";

export type EmitNFeResult = {
  status: "authorized" | "rejected" | "denied" | "processing" | "communication_error" | "configuration_error";
  message: string;
  environment: "homologation" | "production";
  cStat?: string;
  reason?: string;
  protocol?: string;
  receipt?: string;
};

const UNCERTAIN_STATUSES = ["sending", "checking", "communication_error", "batch_received", "processing"] as const;

export async function emitNFeForOrder(orderId: number): Promise<EmitNFeResult> {
  const environment = getNFeEnvironment();
  const urls = getNFeServiceUrls(environment);
  const supabase = requireSupabase("a emissão de NF-e");
  const order = await getOrder(orderId);
  if (!order) throw new Error("Pedido não encontrado.");

  const responsible = await getActiveNFeTechnicalResponsible();
  if (!responsible) throw new Error("Cadastre e ative um responsável técnico para emitir NF-e.");
  if (responsible.authorization_url !== urls.authorization) {
    throw new Error("A URL de autorização cadastrada não corresponde ao ambiente configurado no backend.");
  }

  let signedXml = order.nfe_xml ?? "";
  // XML assinado antes da compactação contém whitespace entre tags e é
  // rejeitado pela SEFAZ; nesse caso o XML precisa ser regerado e reassinado.
  const hasWhitespaceBetweenTags = />\s+</.test(signedXml);
  if (
    hasWhitespaceBetweenTags ||
    !validateNFeSignature(signedXml) ||
    !/\bId=["']NFe\d{44}["']/.test(signedXml) ||
    readTag(signedXml, "tpAmb") !== getNFeTpAmb(environment) ||
    hasInvalidCnf(signedXml)
  ) {
    signedXml = await generateNFeXml(orderId);
    if (!validateNFeSignature(signedXml)) {
      throw new Error("O XML gerado não contém uma assinatura digital válida; a NF-e não foi enviada.");
    }
    const { error } = await supabase.from("orders").update({ nfe_xml: signedXml }).eq("id", orderId);
    if (error) throw new Error(`Não foi possível salvar o XML assinado: ${error.message}`);
  }

  const nfeXml = extractSignedNFe(signedXml);
  const accessKey = extractAccessKey(nfeXml);
  const cUF = readTag(nfeXml, "cUF");
  if (!cUF) throw new Error("Não foi possível identificar a UF da NF-e.");

  const { data: previous, error: previousError } = await supabase
    .from("nfe_emissions")
    .select("*")
    .eq("order_id", orderId)
    .eq("access_key", accessKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (previousError) throw new Error(`Não foi possível consultar o histórico de emissão: ${previousError.message}`);

  if (previous?.status === "authorized") {
    return emissionResult("authorized", "Esta NF-e já consta como autorizada; nenhuma nova transmissão foi feita.", environment, previous);
  }
  if (previous?.status === "denied") {
    return emissionResult("denied", "Esta NF-e foi denegada pela SEFAZ e não será retransmitida.", environment, previous);
  }

  let emissionId = previous?.id as string | undefined;
  let auditHooks = createAuditHooks(supabase, () => emissionId);
  let client = new SefazNfeClient(environment, auditHooks);

  if (previous && UNCERTAIN_STATUSES.includes(previous.status)) {
    const lastUpdated = previous.updated_at ? new Date(previous.updated_at).getTime() : 0;
    if (["sending", "checking", "batch_received", "processing"].includes(previous.status) && Date.now() - lastUpdated < 180000) {
      return {
        status: "processing",
        message: "Já existe uma tentativa de transmissão recente em andamento. Aguarde e consulte novamente; não iniciei outra transmissão.",
        environment,
        cStat: previous.c_stat ?? undefined,
        reason: previous.reason ?? undefined,
        receipt: previous.receipt_number ?? undefined
      };
    }
    // Para communication_error, permite retransmissão após 30 segundos se não houver recibo
    if (previous.status === "communication_error" && Date.now() - lastUpdated < 30000) {
      return {
        status: "processing",
        message: "Erro de comunicação recente. Aguarde 30 segundos antes de tentar novamente.",
        environment,
        cStat: previous.c_stat ?? undefined,
        reason: previous.reason ?? undefined,
        receipt: previous.receipt_number ?? undefined
      };
    }

    // Para communication_error sem recibo, verifica o protocolo antes de bloquear
    let skipReceiptCheck = false;
    if (previous.status === "communication_error" && !previous.receipt_number) {
      const lookup = await callSefaz(() => client.consultProtocol(accessKey), environment);
      await saveLastResponse(supabase, emissionId!, lookup);
      if (lookup.cStat !== "217") {
        const lookupDecision = classifyProtocolLookup(lookup, environment);
        if (lookupDecision) {
          await updateEmission(supabase, emissionId!, lookupDecision, lookup.responseXml);
          return lookupDecision;
        }
        // Se não encontrou resultado conclusivo, retorna erro
        const uncertain = {
          status: "processing" as const,
          message: "A SEFAZ não confirmou o resultado da tentativa anterior. Nenhuma retransmissão foi feita; consulte novamente antes de tentar enviar.",
          environment,
          cStat: lookup.cStat ?? undefined,
          reason: lookup.reason ?? undefined
        };
        await updateEmission(supabase, emissionId!, uncertain, lookup.responseXml);
        return uncertain;
      }
      // Se cStat === "217", a nota não foi enviada, permite retransmissão
      // Atualiza o status para "sending" e marca para pular verificação de recibo
      const { error } = await supabase.from("nfe_emissions").update({
        status: "sending",
        reason: "Consulta de protocolo confirmou que a nota não foi enviada (cStat 217). Retomando transmissão.",
        updated_at: new Date().toISOString()
      }).eq("id", emissionId);
      if (error) throw new Error(`Não foi possível retomar a emissão: ${error.message}`);
      skipReceiptCheck = true;
    }

    if (!skipReceiptCheck) {
      const { data: lease, error: leaseError } = await supabase.from("nfe_emissions").update({
        status: "checking",
        updated_at: new Date().toISOString()
      }).eq("id", previous.id).eq("status", previous.status).select("id").maybeSingle();
      if (leaseError) throw new Error(`Não foi possível reservar a consulta desta emissão: ${leaseError.message}`);
      if (!lease) {
        return {
          status: "processing",
          message: "Outra consulta desta emissão já foi iniciada. Aguarde o resultado antes de tentar novamente.",
          environment
        };
      }
    }

    if (!skipReceiptCheck) {
      let receipt = previous.receipt_number as string | null;
      if (!receipt) {
        const { data: authorizationCall, error: callError } = await supabase
          .from("nfe_emission_calls")
          .select("response_xml")
          .eq("emission_id", emissionId)
          .eq("operation", "authorization")
          .not("response_xml", "is", null)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (callError) throw new Error(`Não foi possível consultar o retorno anterior da SEFAZ: ${callError.message}`);
        if (authorizationCall?.response_xml) {
          const savedReturn = extractReturnXml(authorizationCall.response_xml);
          const savedBatchStatus = readTag(savedReturn, "cStat");
          const savedReceipt = readTag(savedReturn, "nRec");
          if (["103", "105"].includes(savedBatchStatus ?? "") && savedReceipt) {
            receipt = savedReceipt;
            const { error } = await supabase.from("nfe_emissions").update({ receipt_number: receipt, updated_at: new Date().toISOString() }).eq("id", emissionId);
            if (error) throw new Error(`Não foi possível recuperar o recibo da SEFAZ: ${error.message}`);
          } else if (["103", "105"].includes(savedBatchStatus ?? "")) {
            const pending: EmitNFeResult = {
              status: "processing",
              message: "A SEFAZ recebeu o lote, mas não retornou o número do recibo. Não retransmiti a NF-e; consulte a situação novamente.",
              environment,
              cStat: savedBatchStatus ?? undefined,
              reason: readTag(savedReturn, "xMotivo") ?? undefined
            };
            await updateEmission(supabase, emissionId!, pending, authorizationCall.response_xml);
            return pending;
          } else if (savedBatchStatus === "104") {
            const recoveredResponse: SefazResponse = {
              operation: "authorization",
              endpoint: urls.authorization,
              requestSha256: "",
              httpStatus: 200,
              responseXml: authorizationCall.response_xml,
              returnXml: savedReturn,
              cStat: savedBatchStatus,
              reason: readTag(savedReturn, "xMotivo"),
              fault: null
            };
            const recovered = classifyFiscalResponse(recoveredResponse, environment);
            await updateEmission(supabase, emissionId!, recovered, authorizationCall.response_xml);
            return recovered;
          }
        }
      }
      if (receipt) {
        const receiptResult = await callSefaz(() => client.getReceipt(receipt), environment);
        await saveLastResponse(supabase, emissionId!, receiptResult);
        const decision = classifyFiscalResponse(receiptResult, environment);
        if (decision.status === "authorized" || decision.status === "denied" || decision.status === "rejected") {
          await updateEmission(supabase, emissionId!, decision, receiptResult.responseXml);
          return decision;
        }
        if (!["103", "104", "105"].includes(receiptResult.cStat ?? "")) {
          // A missing receipt is not proof that the authorization endpoint never received the request.
          const lookup = await callSefaz(() => client.consultProtocol(accessKey), environment);
          await saveLastResponse(supabase, emissionId!, lookup);
          if (lookup.cStat === "217") {
            // Protocol lookup confirms the key is not in the SEFAZ database; safe to resume transmission.
          } else {
            const lookupDecision = classifyProtocolLookup(lookup, environment);
            if (lookupDecision) {
              await updateEmission(supabase, emissionId!, lookupDecision, lookup.responseXml);
              return lookupDecision;
            }
            await updateEmission(supabase, emissionId!, {
              status: "processing",
              message: "A SEFAZ não confirmou o resultado da tentativa anterior. Nenhuma retransmissão foi feita; consulte novamente antes de tentar enviar.",
              environment,
              cStat: lookup.cStat ?? undefined,
              reason: lookup.reason ?? undefined
            }, lookup.responseXml);
            return {
              status: "processing",
              message: "A SEFAZ não confirmou o resultado da tentativa anterior. Nenhuma retransmissão foi feita; consulte novamente antes de tentar enviar.",
              environment,
              cStat: lookup.cStat ?? undefined,
              reason: lookup.reason ?? undefined,
              receipt: receipt ?? undefined
            };
          }
        } else {
          await updateEmission(supabase, emissionId!, {
            status: "processing",
            message: "O lote ainda está em processamento na SEFAZ. Não retransmiti a NF-e.",
            environment,
            cStat: receiptResult.cStat ?? undefined,
            reason: receiptResult.reason ?? undefined
          }, receiptResult.responseXml);
          return {
            status: "processing",
            message: "O lote ainda está em processamento na SEFAZ. Não retransmiti a NF-e.",
            environment,
            cStat: receiptResult.cStat ?? undefined,
            reason: receiptResult.reason ?? undefined,
            receipt
          };
        }
      } else {
        const lookup = await callSefaz(() => client.consultProtocol(accessKey), environment);
        await saveLastResponse(supabase, emissionId!, lookup);
        if (lookup.cStat !== "217") {
          const lookupDecision = classifyProtocolLookup(lookup, environment);
          if (lookupDecision) {
            await updateEmission(supabase, emissionId!, lookupDecision, lookup.responseXml);
            return lookupDecision;
          }
          const uncertain = {
            status: "processing" as const,
            message: "A SEFAZ não confirmou o resultado da tentativa anterior. Nenhuma retransmissão foi feita; consulte novamente antes de tentar enviar.",
            environment,
            cStat: lookup.cStat ?? undefined,
            reason: lookup.reason ?? undefined
          };
          await updateEmission(supabase, emissionId!, uncertain, lookup.responseXml);
          return uncertain;
        }
      }

      // We have an explicit 217 (key not found), so reusing the attempt is safe.
      const { error } = await supabase.from("nfe_emissions").update({
        status: "sending",
        reason: "Consulta de protocolo retornou cStat 217 antes da retransmissão.",
        updated_at: new Date().toISOString()
      }).eq("id", emissionId);
      if (error) throw new Error(`Não foi possível retomar a emissão: ${error.message}`);
    }
  }

  if (!emissionId) {
    const { data: emission, error } = await supabase.from("nfe_emissions").insert({
      id: randomUUID(),
      order_id: orderId,
      access_key: accessKey,
      environment,
      status: "sending",
      batch_id: makeBatchId(orderId)
    }).select("*").single();
    if (error) {
      if (error.code === "23505") {
        return {
          status: "processing",
          message: "Já existe uma transmissão desta NF-e em andamento. Consulte o status antes de iniciar outra.",
          environment
        };
      }
      throw new Error(`Não foi possível registrar a emissão para auditoria: ${error.message}`);
    }
    emissionId = emission.id;
    auditHooks = createAuditHooks(supabase, () => emissionId);
    client = new SefazNfeClient(environment, auditHooks);
  }

  const batchId = (await getEmission(supabase, emissionId!))?.batch_id ?? makeBatchId(orderId);
  const statusResponse = await callSefaz(() => client.checkServiceStatus(cUF), environment);
  await saveLastResponse(supabase, emissionId!, statusResponse);
  if (statusResponse.fault || statusResponse.httpStatus < 200 || statusResponse.httpStatus >= 300 || statusResponse.cStat !== "107") {
    const statusResult: EmitNFeResult = {
      status: "communication_error",
      message: statusResponse.fault
        ? `Falha SOAP ao consultar o serviço: ${statusResponse.fault}`
        : `O serviço da SEFAZ não está disponível para autorização: ${statusResponse.reason ?? "status sem resposta válida"}. A NF-e não foi enviada.`,
      environment,
      cStat: statusResponse.cStat ?? undefined,
      reason: statusResponse.reason ?? undefined
    };
    await updateEmission(supabase, emissionId!, statusResult, statusResponse.responseXml);
    return statusResult;
  }

  const { error: beforeTransmitError } = await supabase.from("nfe_emissions").update({
    status: "sending",
    updated_at: new Date().toISOString()
  }).eq("id", emissionId);
  if (beforeTransmitError) throw new Error(`Não foi possível preparar o registro de transmissão: ${beforeTransmitError.message}`);

  const authorization = await callSefaz(() => client.authorize(nfeXml, batchId), environment);
  await saveLastResponse(supabase, emissionId!, authorization);
  let result = classifyFiscalResponse(authorization, environment);
  let usedResponse = authorization;

  const receiptNumber = readTag(authorization.returnXml, "nRec");
  if ((authorization.cStat === "103" || authorization.cStat === "105") && receiptNumber) {
    await supabase.from("nfe_emissions").update({
      status: authorization.cStat === "103" ? "batch_received" : "processing",
      receipt_number: receiptNumber,
      c_stat: authorization.cStat,
      reason: authorization.reason,
      updated_at: new Date().toISOString()
    }).eq("id", emissionId);

    for (const delay of [1000, 2000]) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      const receiptResponse = await callSefaz(() => client.getReceipt(receiptNumber), environment);
      await saveLastResponse(supabase, emissionId!, receiptResponse);
      usedResponse = receiptResponse;
      result = classifyFiscalResponse(receiptResponse, environment);
      if (result.status !== "processing") break;
    }
    result.receipt = receiptNumber;
  }

  if (result.status === "processing" && !result.reason) {
    result.reason = authorization.reason ?? undefined;
  }
  await updateEmission(supabase, emissionId!, result, usedResponse.responseXml, receiptNumber ?? undefined);
  return result;
}

function createAuditHooks(supabase: NonNullable<ReturnType<typeof getSupabase>>, emissionId: () => string | undefined) {
  return {
    async onStarted(call: { operation: string; endpoint: string; requestSha256: string }) {
      const id = emissionId();
      if (!id) throw new Error("Não foi possível associar a chamada SEFAZ à auditoria da emissão.");
      const { data, error } = await supabase.from("nfe_emission_calls").insert({
        emission_id: id,
        operation: call.operation,
        endpoint: call.endpoint,
        request_sha256: call.requestSha256,
        outcome: "started"
      }).select("id").single();
      if (error) throw new Error(`Não foi possível registrar a chamada SEFAZ: ${error.message}`);
      return data.id as string;
    },
    async onFinished(callId: string | undefined, response: SefazResponse) {
      if (!callId) return;
      const outcome = response.fault || !response.cStat ? "communication_error" : "response";
      const { error } = await supabase.from("nfe_emission_calls").update({
        http_status: response.httpStatus,
        outcome,
        c_stat: response.cStat,
        reason: response.reason,
        response_xml: response.responseXml,
        finished_at: new Date().toISOString()
      }).eq("id", callId);
      if (error) throw new Error(`Não foi possível salvar a resposta da SEFAZ: ${error.message}`);
    },
    async onCommunicationError(callId: string | undefined, error: Error) {
      if (!callId) return;
      await supabase.from("nfe_emission_calls").update({
        outcome: "communication_error",
        reason: error.message,
        finished_at: new Date().toISOString()
      }).eq("id", callId);
    }
  };
}

function classifyFiscalResponse(response: SefazResponse, environment: EmitNFeResult["environment"]): EmitNFeResult {
  if (response.fault || !response.cStat) {
    return {
      status: "communication_error",
      message: response.fault ? `A SEFAZ retornou uma falha SOAP: ${response.fault}` : "A resposta da SEFAZ não contém o status fiscal esperado.",
      environment,
      cStat: response.cStat ?? undefined,
      reason: response.reason ?? undefined
    };
  }

  const protocolBlock = extractBlock(response.returnXml, "protNFe");
  const protocolInfo = protocolBlock ? extractBlock(protocolBlock, "infProt") : null;
  const fiscalStatus = protocolInfo ? readTag(protocolInfo, "cStat") : null;
  const fiscalReason = protocolInfo ? readTag(protocolInfo, "xMotivo") : null;
  const fiscalProtocol = protocolInfo ? readTag(protocolInfo, "nProt") : null;
  const status = fiscalStatus ?? response.cStat;
  const reason = fiscalReason ?? response.reason ?? undefined;

  if ((status === "100" || status === "150") && !fiscalStatus) {
    return {
      status: "processing",
      message: "O retorno da SEFAZ não trouxe o protocolo fiscal detalhado; a autorização ainda não foi confirmada.",
      environment,
      cStat: response.cStat ?? undefined,
      reason: response.reason ?? undefined,
      receipt: readTag(response.returnXml, "nRec") ?? undefined
    };
  }
  if (fiscalStatus === "100" || fiscalStatus === "150") {
    return {
      status: "authorized",
      message: `NF-e autorizada pela SEFAZ${fiscalProtocol ? ` (protocolo ${fiscalProtocol})` : ""}.`,
      environment,
      cStat: status,
      reason,
      protocol: fiscalProtocol ?? undefined
    };
  }
  if (["110", "301", "302"].includes(status)) {
    return { status: "denied", message: `NF-e denegada: ${reason ?? `cStat ${status}`}.`, environment, cStat: status, reason };
  }
  if (status === "103" || status === "104" || status === "105") {
    return {
      status: "processing",
      message: status === "104"
        ? "O lote foi processado, mas a resposta ainda não confirmou autorização da NF-e. Consulte a situação antes de retransmitir."
        : "A SEFAZ recebeu o lote e ainda está processando a NF-e.",
      environment,
      cStat: status,
      reason,
      protocol: fiscalProtocol ?? undefined,
      receipt: readTag(response.returnXml, "nRec") ?? undefined
    };
  }
  if (status === "217") {
    return { status: "processing", message: "A chave não consta na consulta de protocolo.", environment, cStat: status, reason };
  }
  return {
    status: "rejected",
    message: `NF-e rejeitada pela SEFAZ: ${reason ?? `cStat ${status}`}.`,
    environment,
    cStat: status,
    reason
  };
}

function classifyProtocolLookup(response: SefazResponse, environment: EmitNFeResult["environment"]): EmitNFeResult | null {
  if (response.cStat === "217") return null;
  if (!response.cStat || response.fault) return null;
  return classifyFiscalResponse(response, environment);
}

// SEFAZ rule B03-10 (rejection 897): cNF must be 8 digits, different from nNF
// and outside the forbidden list. XMLs stored before the fix have cNF == nNF.
function hasInvalidCnf(xml: string): boolean {
  const cNF = readTag(xml, "cNF");
  const nNF = readTag(xml, "nNF");
  if (!cNF || !/^\d{8}$/.test(cNF)) return true;
  if (FORBIDDEN_CNF.has(cNF)) return true;
  if (nNF && (cNF === nNF.padStart(8, "0").slice(-8) || Number(cNF) === Number(nNF))) return true;
  return false;
}

function extractSignedNFe(xml: string): string {
  const match = xml.match(/<(?:[\w.-]+:)?NFe\b[\s\S]*?<\/(?:[\w.-]+:)?NFe\s*>/i);
  if (!match || !/<(?:[\w.-]+:)?Signature\b/i.test(match[0])) {
    throw new Error("Não foi encontrado um elemento NFe assinado no XML armazenado.");
  }
  return match[0].trim();
}

function extractAccessKey(xml: string): string {
  const match = xml.match(/<(?:(?:[\w.-]+):)?infNFe\b[^>]*\bId=["']NFe(\d{44})["']/i);
  if (!match) throw new Error("A chave de acesso da NF-e não é válida (44 dígitos).");
  return match[1];
}

function makeBatchId(orderId: number) {
  return `${String(Date.now()).slice(-9)}${String(orderId).padStart(6, "0")}`.slice(-15);
}

function emissionResult(status: EmitNFeResult["status"], message: string, environment: EmitNFeResult["environment"], row: { c_stat?: string | null; reason?: string | null; protocol?: string | null; receipt_number?: string | null }): EmitNFeResult {
  return {
    status,
    message,
    environment,
    cStat: row.c_stat ?? undefined,
    reason: row.reason ?? undefined,
    protocol: row.protocol ?? undefined,
    receipt: row.receipt_number ?? undefined
  };
}

async function callSefaz<T extends Promise<SefazResponse>>(call: () => T, environment: EmitNFeResult["environment"]): Promise<SefazResponse> {
  try {
    return await call();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro de rede ao comunicar com a SEFAZ.";
    if (/timeout|tempo limite|socket hang up|ECONNRESET|ECONNREFUSED|ENOTFOUND|certificate|certificado/i.test(message)) {
      throw new Error(`Falha de comunicação com a SEFAZ (${environment}): ${message}`);
    }
    throw error;
  }
}

async function saveLastResponse(supabase: NonNullable<ReturnType<typeof getSupabase>>, emissionId: string, response: SefazResponse) {
  const { error } = await supabase.from("nfe_emissions").update({
    last_response_xml: response.responseXml,
    c_stat: response.cStat,
    reason: response.reason,
    updated_at: new Date().toISOString()
  }).eq("id", emissionId);
  if (error) throw new Error(`Não foi possível salvar o retorno da SEFAZ: ${error.message}`);
}

async function updateEmission(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
  emissionId: string,
  value: EmitNFeResult,
  responseXml: string,
  receipt?: string
) {
  const { error } = await supabase.from("nfe_emissions").update({
    status: value.status === "configuration_error" ? "communication_error" : value.status,
    c_stat: value.cStat ?? null,
    reason: value.reason ?? value.message,
    protocol: value.protocol ?? null,
    receipt_number: receipt ?? value.receipt ?? null,
    last_response_xml: responseXml,
    updated_at: new Date().toISOString()
  }).eq("id", emissionId);
  if (error) throw new Error(`Não foi possível atualizar o histórico da emissão: ${error.message}`);
}

async function getEmission(supabase: NonNullable<ReturnType<typeof getSupabase>>, id: string) {
  const { data, error } = await supabase.from("nfe_emissions").select("batch_id").eq("id", id).single();
  if (error) throw new Error(`Não foi possível recuperar o lote de emissão: ${error.message}`);
  return data;
}
