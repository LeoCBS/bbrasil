"use client";

import { ReactNode } from "react";
import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";

type LinkPendingProps = {
  children: ReactNode;
  className?: string;
};

// Render inside a <Link>: shows a spinner while that link's navigation is pending
export function LinkPending({ children, className }: LinkPendingProps) {
  const { pending } = useLinkStatus();

  if (!pending) {
    return <>{children}</>;
  }

  return <Loader2 className={className ?? "inline h-4 w-4 animate-spin"} />;
}
