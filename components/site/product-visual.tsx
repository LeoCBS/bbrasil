"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const placeholderSrc = "/placeholder-product.jpg";

type ProductVisualProps = {
  name: string;
  imageSrc?: string | null;
  className?: string;
  compact?: boolean;
};

export function ProductVisual({ name, imageSrc, className, compact = false }: ProductVisualProps) {
  const initialSrc = imageSrc?.trim() || placeholderSrc;
  const [src, setSrc] = useState(initialSrc);

  useEffect(() => {
    setSrc(initialSrc);
  }, [initialSrc]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      onError={() => {
        if (src !== placeholderSrc) {
          setSrc(placeholderSrc);
        }
      }}
      className={cn(
        "block object-contain",
        compact ? "h-36 w-24" : "h-72 w-44",
        className
      )}
    />
  );
}
