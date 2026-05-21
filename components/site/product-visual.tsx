import { cn } from "@/lib/utils";

type ProductVisualProps = {
  name: string;
  size?: string;
  className?: string;
  compact?: boolean;
};

export function ProductVisual({ name, size = "1L", className, compact = false }: ProductVisualProps) {
  return (
    <div
      className={cn(
        "product-bottle flex flex-col items-center justify-end rounded-t-[22px] rounded-b-lg border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-200 p-3",
        compact ? "h-36 w-24" : "h-72 w-44",
        className
      )}
    >
      <div className="mb-3 h-5 w-10 rounded-t-md bg-slate-200 shadow-inner" />
      <div className="relative z-10 mb-4 flex w-full flex-1 flex-col justify-end rounded-md bg-white/70 p-3">
        <div className="mb-2 flex items-center gap-1">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-brand-blue text-lg font-black text-white">B</span>
          <span className="text-sm font-semibold text-brand-blue">B.Brasil</span>
        </div>
        <div className="rounded bg-brand-green px-2 py-2 text-xs font-semibold text-white">{name}</div>
        <div className="mt-2 text-[10px] text-slate-500">Uso Profissional</div>
        <div className="mt-3 text-xs text-slate-600">{size}</div>
      </div>
    </div>
  );
}
