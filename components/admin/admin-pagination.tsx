import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageWindow } from "@/lib/pagination";

export function AdminPagination({
  page,
  totalPages,
  hrefFor,
  label,
  className,
  arrowSize
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  label: React.ReactNode;
  className?: string;
  arrowSize?: "sm" | "default";
}) {
  return (
    <nav className={className}>
      {label}
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size={arrowSize} disabled={page <= 1}>
          <Link href={hrefFor(page - 1)}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="flex items-center gap-1">
          {pageWindow(page, totalPages).map((item, index) =>
            item === "dots" ? (
              <span key={`dots-${index}`} className="px-2">
                …
              </span>
            ) : (
              <Button asChild size="sm" key={item} variant={item === page ? "default" : "ghost"}>
                <Link href={hrefFor(item)} className={item === page ? "font-semibold" : undefined}>
                  {item}
                </Link>
              </Button>
            )
          )}
        </div>

        <Button asChild variant="outline" size={arrowSize} disabled={page >= totalPages}>
          <Link href={hrefFor(page + 1)}>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </nav>
  );
}
