import { cn } from "@/lib/utils";

type ProductVisualProps = {
  name: string;
  imageSrc?: string | null;
  className?: string;
  compact?: boolean;
};

export function ProductVisual({ name, imageSrc, className, compact = false }: ProductVisualProps) {
  if (!imageSrc) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      alt={name}
      className={cn(
        "block object-contain",
        compact ? "h-36 w-24" : "h-72 w-44",
        className
      )}
    />
  );
}
