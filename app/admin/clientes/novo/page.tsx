import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { logoutAction, requireAdminUser } from "@/auth";
import { createClientAction } from "@/lib/actions";
import { productCompanies } from "@/lib/companies";
import { getSalespeople } from "@/lib/salespeople";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ClientForm } from "@/components/client-form";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function NewClientPage() {
  const user = await requireAdminUser("/admin/clientes/novo");
  const salespeople = await getSalespeople();
  return <main className="min-h-screen bg-slate-50"><header className="border-b bg-white"><div className="container flex h-24 items-center justify-between gap-4"><Logo /><div className="flex items-center gap-3"><span className="hidden text-sm text-slate-600 md:inline">{user.email}</span><form action={logoutAction}><SubmitButton pendingLabel="Saindo..." variant="outline" size="sm"><LogOut className="h-4 w-4" /> Sair</SubmitButton></form></div></div></header><div className="lg:flex"><AdminSidebar current="clientes" /><section className="flex-1 p-4 md:p-8"><div className="mx-auto max-w-3xl"><Button asChild variant="ghost" size="sm"><Link href="/admin/clientes"><ArrowLeft className="h-4 w-4" /> Voltar para clientes</Link></Button><Card className="mt-4 shadow-soft"><CardHeader><CardTitle>Novo cliente</CardTitle><CardDescription>Cadastre os dados comerciais, fiscais e de contato do cliente.</CardDescription></CardHeader><CardContent><ClientForm action={createClientAction} submitLabel="Cadastrar cliente" successHref="/admin/clientes" units={productCompanies} salespeople={salespeople} /></CardContent></Card></div></section></div></main>;
}
