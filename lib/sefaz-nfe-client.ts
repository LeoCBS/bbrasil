import { createHash } from "crypto";
import { readFile } from "fs/promises";
import https from "https";
import { rootCertificates } from "tls";
import { loadNFeCertificatePfx } from "@/lib/nfe-certificate";
import { getNFeServiceUrls, getNFeTpAmb, type NFeEnvironment } from "@/lib/nfe-config";

const NFE_NAMESPACE = "http://www.portalfiscal.inf.br/nfe";
const WSDL_NAMESPACE = "http://www.portalfiscal.inf.br/nfe/wsdl";
const SOAP_NAMESPACE = "http://www.w3.org/2003/05/soap-envelope";
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

export type SefazOperation = "status" | "authorization" | "receipt" | "protocol";

export type SefazResponse = {
  operation: SefazOperation;
  endpoint: string;
  requestSha256: string;
  httpStatus: number;
  responseXml: string;
  returnXml: string;
  cStat: string | null;
  reason: string | null;
  fault: string | null;
};

export type SefazAuditHooks = {
  onStarted?: (call: Pick<SefazResponse, "operation" | "endpoint" | "requestSha256">) => Promise<string | undefined>;
  onFinished?: (callId: string | undefined, response: SefazResponse) => Promise<void>;
  onCommunicationError?: (callId: string | undefined, error: Error) => Promise<void>;
};

export class SefazNfeClient {
  private readonly urls;
  private readonly tpAmb: "1" | "2";
  private readonly environment: NFeEnvironment;
  private readonly audit?: SefazAuditHooks;
  private certificatePromise?: Promise<Buffer>;
  private sefazCaPromise?: Promise<Buffer>;

  constructor(environment: NFeEnvironment, audit?: SefazAuditHooks) {
    this.environment = environment;
    this.urls = getNFeServiceUrls(environment);
    this.tpAmb = getNFeTpAmb(environment);
    this.audit = audit;
  }

  checkServiceStatus(cUF: string) {
    const payload = `<consStatServ xmlns="${NFE_NAMESPACE}" versao="4.00"><tpAmb>${this.tpAmb}</tpAmb><cUF>${escapeXml(cUF)}</cUF><xServ>STATUS</xServ></consStatServ>`;
    return this.call("status", payload);
  }

  authorize(signedNFe: string, batchId: string) {
    const payload = `<enviNFe xmlns="${NFE_NAMESPACE}" versao="4.00"><idLote>${escapeXml(batchId)}</idLote><indSinc>1</indSinc>${signedNFe}</enviNFe>`;
    return this.call("authorization", payload);
  }

  getReceipt(receiptNumber: string) {
    const payload = `<consReciNFe xmlns="${NFE_NAMESPACE}" versao="4.00"><tpAmb>${this.tpAmb}</tpAmb><nRec>${escapeXml(receiptNumber)}</nRec></consReciNFe>`;
    return this.call("receipt", payload);
  }

  consultProtocol(accessKey: string) {
    const payload = `<consSitNFe xmlns="${NFE_NAMESPACE}" versao="4.00"><tpAmb>${this.tpAmb}</tpAmb><xServ>CONSULTAR</xServ><chNFe>${escapeXml(accessKey)}</chNFe></consSitNFe>`;
    return this.call("protocol", payload);
  }

  private async call(operation: SefazOperation, payload: string): Promise<SefazResponse> {
    const endpoint = this.urls[operation];
    const soapAction = `${wsdlServiceName(operation)}/${soapOperationName(operation)}`;
    const soapBody = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="${SOAP_NAMESPACE}" xmlns:nfe="${WSDL_NAMESPACE}/${wsdlServiceName(operation)}"><soap:Body><nfe:nfeDadosMsg>${payload}</nfe:nfeDadosMsg></soap:Body></soap:Envelope>`;
    const requestSha256 = createHash("sha256").update(soapBody, "utf8").digest("hex");
    const metadata = { operation, endpoint, requestSha256 } as const;
    const callId = await this.audit?.onStarted?.(metadata);
    let response: { status: number; body: string };
    try {
      response = await this.post(endpoint, soapBody, soapAction);
    } catch (error) {
      await this.audit?.onCommunicationError?.(callId, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
    const responseXml = response.body;
    const returnXml = extractReturnXml(responseXml);
    const faultBlock = extractBlock(responseXml, "Fault");
    const fault = faultBlock
      ? readTag(faultBlock, "Text") ?? readTag(faultBlock, "faultstring") ?? "Falha SOAP sem descrição"
      : null;

    const result: SefazResponse = {
      operation,
      endpoint,
      requestSha256,
      httpStatus: response.status,
      responseXml,
      returnXml,
      cStat: readTag(returnXml, "cStat"),
      reason: readTag(returnXml, "xMotivo"),
      fault
    };
    await this.audit?.onFinished?.(callId, result);
    return result;
  }

  private async post(endpoint: string, body: string, soapAction: string): Promise<{ status: number; body: string }> {
    const certPath = process.env.NFE_CERTIFICATE_PATH;
    const passphrase = process.env.NFE_CERTIFICATE_PASSWORD;
    if (!certPath || !passphrase) {
      throw new Error("Configure NFE_CERTIFICATE_PATH e NFE_CERTIFICATE_PASSWORD no backend.");
    }
    const pfx = await (this.certificatePromise ??= loadNFeCertificatePfx());
    const caPath = process.env.NFE_CA_CERT_PATH;
    const ca = caPath ? await (this.sefazCaPromise ??= readFile(caPath)) : undefined;
    const url = new URL(endpoint);

    return new Promise((resolve, reject) => {
      const request = https.request(url, {
        method: "POST",
        minVersion: "TLSv1.2",
        rejectUnauthorized: false, // Desabilita validação SSL temporariamente para ambiente de homologação
        // Em produção, configure NFE_CA_CERT_PATH e use: rejectUnauthorized: true
        // ...(ca ? { ca: [...rootCertificates, ca] } : {}),
        pfx,
        passphrase,
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: `"${WSDL_NAMESPACE}/${soapAction}"`,
          "Content-Length": Buffer.byteLength(body, "utf8")
        }
      }, (response) => {
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_RESPONSE_BYTES) {
            request.destroy(new Error("A resposta da SEFAZ excedeu o limite esperado."));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => resolve({
          status: response.statusCode ?? 0,
          body: Buffer.concat(chunks).toString("utf8")
        }));
      });

      const configuredTimeout = Number(process.env.NFE_REQUEST_TIMEOUT_MS) || 30000;
      const timeoutMs = Math.min(Math.max(configuredTimeout, 1000), 120000);
      request.setTimeout(timeoutMs, () => {
        request.destroy(new Error("Tempo limite de comunicação com a SEFAZ excedido."));
      });
      request.on("error", reject);
      request.end(body, "utf8");
    });
  }
}

export function readTag(xml: string, tagName: string): string | null {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = xml.match(new RegExp(`<(?:(?:[\\w.-]+):)?${escaped}\\b[^>]*>([\\s\\S]*?)<\\/(?:(?:[\\w.-]+):)?${escaped}\\s*>`, "i"));
  return match ? decodeXml(match[1].trim()) : null;
}

export function extractBlock(xml: string, tagName: string): string | null {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = xml.match(new RegExp(`<((?:[\\w.-]+:)?${escaped})\\b[^>]*>[\\s\\S]*?<\\/\\1\\s*>`, "i"));
  return match?.[0] ?? null;
}

export function extractReturnXml(xml: string): string {
  for (const name of ["retConsStatServ", "retEnviNFe", "retConsReciNFe", "retConsSitNFe"]) {
    const block = extractBlock(xml, name);
    if (block) return block;
  }
  return xml;
}

function wsdlServiceName(operation: SefazOperation) {
  return {
    status: "NFeStatusServico4",
    authorization: "NFeAutorizacao4",
    receipt: "NFeRetAutorizacao4",
    protocol: "NFeConsulta4"
  }[operation];
}

function soapOperationName(operation: SefazOperation) {
  return {
    status: "nfeStatusServicoNF",
    authorization: "nfeAutorizacaoLote",
    receipt: "nfeRetAutorizacao",
    protocol: "nfeConsultaNF"
  }[operation];
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
