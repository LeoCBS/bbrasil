"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

type SubmitButtonProps = ButtonProps & {
  pendingLabel: string;
  pendingIcon?: React.ReactNode;
};

export function SubmitButton({ children, pendingLabel, pendingIcon, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending ? (
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
