"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";

export function DownloadNFeXmlButton({ orderId }: { orderId: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function downloadXml() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/orders/${orderId}/nfe-xml`);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Não foi possível baixar o XML da NF-e.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nfe-pedido-${orderId}.xml`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível baixar o XML da NF-e.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void downloadXml()}
        disabled={loading}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-brand-ink disabled:opacity-60"
        title={error || (loading ? "Baixando XML da NF-e..." : "Baixar XML NF-e")}
        aria-label={error || (loading ? "Baixando XML da NF-e" : "Baixar XML da NF-e")}
        aria-busy={loading}
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </button>
      <span role={error ? "alert" : "status"} aria-live="polite" className="sr-only">
        {error || (loading ? "Baixando XML da NF-e..." : "")}
      </span>
    </>
  );
}
