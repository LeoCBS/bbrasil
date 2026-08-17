import Link from "next/link";
import { ArrowLeft, LogOut, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { logoutAction, requireAdminUser } from "@/auth";
import { deleteClientAction, updateClientAction } from "@/lib/actions";
import { getUnits } from "@/lib/units";
import { getClient } from "@/lib/clients";
import { getProfiles } from "@/lib/profiles";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ClientForm } from "@/components/client-form";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const user = await requireAdminUser(`/admin/clientes/${id}`); const client = await getClient(id); if (!client) notFound(); const profiles = await getProfiles(); const units = await getUnits();
  return <main className="min-h-screen bg-slate-50"><header className="border-b bg-white"><div className="container flex h-24 items-center justify-between gap-4"><Logo /><div className="flex items-center gap-3"><span className="hidden text-sm text-slate-600 md:inline">{user.email}</span><form action={logoutAction}><SubmitButton pendingLabel="Saindo..." variant="outline" size="sm"><LogOut className="h-4 w-4" /> Sair</SubmitButton></form></div></div></header><div className="lg:flex"><AdminSidebar current="clientes" /><section className="flex-1 p-4 md:p-8"><div className="mx-auto max-w-3xl"><Button asChild variant="ghost" size="sm"><Link href="/admin/clientes"><ArrowLeft className="h-4 w-4" /> Voltar para clientes</Link></Button><Card className="mt-4 shadow-soft"><CardHeader><CardTitle>{client.corporate_name}</CardTitle><CardDescription>Visualize e edite todas as informações deste cliente.</CardDescription></CardHeader><CardContent><ClientForm client={client} action={updateClientAction} submitLabel="Salvar alterações" units={units} profiles={profiles} /><form action={deleteClientAction} className="mt-4 border-t pt-4"><input type="hidden" name="id" value={client.id} /><SubmitButton pendingLabel="Excluindo..." variant="outline" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /> Excluir cliente</SubmitButton></form></CardContent></Card></div></section></div></main>;
}