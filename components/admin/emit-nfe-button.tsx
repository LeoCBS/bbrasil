"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { emitNFeOrderAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import type { EmitNFeResult } from "@/lib/nfe-emission";

const statusLabel: Record<EmitNFeResult["status"], string> = {
  authorized: "Autorizada",
  rejected: "Rejeitada",
  denied: "Denegada",
  processing: "Em processamento",
  communication_error: "Falha de comunicação",
  configuration_error: "Configuração necessária"
};

type DialogState =
  | { state: "sending" }
  | { state: "result"; result: Omit<EmitNFeResult, "environment"> & { environment: EmitNFeResult["environment"] | "unknown" } };

export function EmitNFeButton({ orderId }: { orderId: number }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const sending = dialog?.state === "sending";

  async function emit() {
    if (sending) return;
    // Open the live status dialog before starting the server action.
    setDialog({ state: "sending" });
    try {
      const result = await emitNFeOrderAction(orderId);
      setDialog({ state: "result", result });
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Não foi possível iniciar a emissão.";
      const transportFailure = /unexpected response|failed to fetch|networkerror|load failed/i.test(raw);
      setDialog({
        state: "result",
        result: {
          status: "communication_error",
          message: transportFailure
            ? "O servidor não retornou uma resposta válida para a emissão (possível atualização do servidor de desenvolvimento ou queda de conexão). Verifique o terminal do `next dev`, atualize a página e tente novamente. Se a NF-e tiver sido transmitida, consulte a situação antes de reenviar."
            : raw,
          environment: "unknown"
        }
      });
    }
  }

  const result = dialog?.state === "result" ? dialog.result : null;

  return (
    <>
      <Button type="button" size="sm" disabled={sending} onClick={() => void emit()}>
        {sending ? "Enviando…" : "Emitir NF-e"}
      </Button>
      {dialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`nfe-title-${orderId}`}
            aria-live="polite"
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id={`nfe-title-${orderId}`} className="text-xl font-semibold text-brand-ink">
                  {sending ? "Enviando NF-e" : `Retorno da emissão da NF-e #${orderId}`}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Ambiente: {result?.environment === "production" ? "Produção" : result?.environment === "homologation" ? "Homologação" : sending ? "Verificando" : "Não confirmado"}
                </p>
              </div>
              {result && (
                <span className={`rounded-md px-2.5 py-1 text-sm font-medium ${result.status === "authorized" ? "bg-green-100 text-green-800" : result.status === "processing" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                  {statusLabel[result.status]}
                </span>
              )}
            </div>

            {sending ? (
              <div className="mt-6 flex items-center gap-3 rounded-lg bg-blue-50 p-4 text-blue-950">
                <LoaderCircle className="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
                <p className="text-sm">Consultando o serviço e transmitindo o lote à SEFAZ. Esta janela será atualizada com o retorno fiscal.</p>
              </div>
            ) : result ? (
              <>
                <p className="mt-5 text-slate-800">{result.message}</p>
                {(result.cStat || result.reason || result.protocol || result.receipt) && (
                  <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                    {result.cStat && <><dt className="font-medium text-slate-600">cStat</dt><dd>{result.cStat}</dd></>}
                    {result.reason && <><dt className="font-medium text-slate-600">Motivo SEFAZ</dt><dd>{result.reason}</dd></>}
                    {result.protocol && <><dt className="font-medium text-slate-600">Protocolo</dt><dd className="break-all">{result.protocol}</dd></>}
                    {result.receipt && <><dt className="font-medium text-slate-600">Recibo</dt><dd className="break-all">{result.receipt}</dd></>}
                  </dl>
                )}
              </>
            ) : null}

            {!sending && (
              <div className="mt-6 flex justify-end">
                <Button type="button" variant="outline" onClick={() => setDialog(null)}>Fechar</Button>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
