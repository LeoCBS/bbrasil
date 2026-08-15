"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

type SubmitButtonProps = ButtonProps & {
  pendingLabel: string;
  pendingIcon?: React.ReactNode;
  // optional external pending flag for client-handled submissions
  forcePending?: boolean;
};

export function SubmitButton({ children, pendingLabel, pendingIcon, disabled, forcePending, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isPending = Boolean(pending || forcePending);

  return (
    <Button type="submit" disabled={isPending || disabled} aria-busy={isPending} {...props}>
      {isPending ? (
        <>
          {pendingIcon ?? <Loader2 className="h-4 w-4 animate-spin" />}
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
