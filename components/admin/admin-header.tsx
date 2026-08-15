import NextLink from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Logo } from "@/components/site/logo";
import { logoutAction } from "@/auth";

export default function AdminHeader({ email }: { email?: string }) {
  return (
    <header className="border-b bg-white">
      <div className="container flex h-24 items-center justify-between gap-4">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 md:inline">{email}</span>
          <Button asChild variant="outline" size="sm">
            <NextLink href="/">
              <ArrowLeft className="h-4 w-4" /> Site
            </NextLink>
          </Button>
          <form action={logoutAction}>
            <SubmitButton pendingLabel="Saindo..." variant="outline" size="sm" className="text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" /> Sair
            </SubmitButton>
          </form>
        </div>
      </div>
    </header>
  );
}
