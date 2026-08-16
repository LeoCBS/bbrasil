"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Erro na renderização do site:", error);
  }, [error]);

  return (
    <main className="container flex min-h-screen items-center justify-center py-10">
      <div className="max-w-lg rounded-xl border bg-white p-8 text-center shadow-soft">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold text-brand-ink">Não foi possível carregar esta página</h1>
        <p className="mt-2 text-slate-600">{error.message || "Tente novamente em alguns instantes."}</p>
        {error.digest ? <p className="mt-2 text-xs text-slate-400">Código: {error.digest}</p> : null}
        <Button type="button" className="mt-6" onClick={reset}>
          <RotateCcw className="h-4 w-4" /> Tentar novamente
        </Button>
      </div>
    </main>
  );
}
