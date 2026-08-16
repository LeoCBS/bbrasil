"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Erro no admin:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="max-w-lg rounded-xl border bg-white p-8 text-center shadow-soft">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold text-brand-ink">Falha ao processar a operação</h1>
        <p className="mt-2 text-slate-600">{error.message || "Tente novamente em alguns instantes."}</p>
        {error.digest ? <p className="mt-2 text-xs text-slate-400">Código: {error.digest}</p> : null}
        <div className="mt-6 flex justify-center gap-3">
          <Button type="button" onClick={reset}>
            <RotateCcw className="h-4 w-4" /> Tentar novamente
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/produtos">Voltar ao admin</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
