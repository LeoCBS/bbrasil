import { Loader2 } from "lucide-react";

type PageLoadingProps = {
  label?: string;
};

export function PageLoading({ label = "Carregando..." }: PageLoadingProps) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container flex min-h-screen items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-md border bg-white px-5 py-4 text-sm font-medium text-slate-700 shadow-soft">
          <Loader2 className="h-5 w-5 animate-spin text-brand-green" />
          {label}
        </div>
      </div>
    </main>
  );
}
