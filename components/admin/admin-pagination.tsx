import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageWindow } from "@/lib/pagination";
import { LinkPending } from "@/components/ui/link-pending";

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
            <LinkPending><ArrowLeft className="h-4 w-4" /></LinkPending>
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
                  <LinkPending>{item}</LinkPending>
                </Link>
              </Button>
            )
          )}
        </div>

        <Button asChild variant="outline" size={arrowSize} disabled={page >= totalPages}>
          <Link href={hrefFor(page + 1)}>
            <LinkPending><ArrowRight className="h-4 w-4" /></LinkPending>
          </Link>
        </Button>
      </div>
    </nav>
  );
}
