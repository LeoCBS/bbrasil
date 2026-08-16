"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Erro global da aplicação:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Algo deu errado</h1>
        <p style={{ marginTop: "0.75rem" }}>{error.message || "Tente novamente em alguns instantes."}</p>
        {error.digest ? <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#94a3b8" }}>Código: {error.digest}</p> : null}
        <button type="button" onClick={reset} style={{ marginTop: "1.5rem", padding: "0.6rem 1.2rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}>
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
