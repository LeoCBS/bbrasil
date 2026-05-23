import Link from "next/link";
import { ArrowLeft, LogIn } from "lucide-react";
import { loginAction } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/logo";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid: "E-mail ou senha invalidos.",
  missing: "Informe e-mail e senha para entrar."
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = params.next || "/admin/produtos";
  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container flex h-24 items-center justify-between">
          <Logo />
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" /> Voltar ao site
            </Link>
          </Button>
        </div>
      </header>

      <section className="container flex min-h-[calc(100vh-6rem)] items-center justify-center py-10">
        <Card className="w-full max-w-md shadow-soft">
          <CardHeader>
            <CardTitle>Login do admin</CardTitle>
            <CardDescription>Entre com o e-mail e senha cadastrados no Supabase Auth.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={loginAction} className="grid gap-4">
              <input type="hidden" name="next" value={next} />
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" required />
              </div>
              {errorMessage ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errorMessage}
                </p>
              ) : null}
              <Button type="submit" className="w-full">
                <LogIn className="h-4 w-4" /> Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
