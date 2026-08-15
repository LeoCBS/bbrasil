import Link from "next/link";
import { ArrowLeft, ArrowRight, LogOut, Pencil, Plus, Search } from "lucide-react";
import { logoutAction, requireAdminUser } from "@/auth";
import { getPaginatedClients } from "@/lib/clients";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

type Props = { searchParams?: Promise<{ busca?: string; situacao?: string; page?: string }> };
const pageSize = 8;

function pageNumber(value?: string) { const page = Number(value); return Number.isInteger(page) && page > 0 ? page : 1; }
function href(page: number, search?: string, status?: string) {
  const params = new URLSearchParams();
  if (search) params.set("busca", search);
  if (status) params.set("situacao", status);
  if (page > 1) params.set("page", String(page));
  return `/admin/clientes${params.size ? `?${params}` : ""}`;
}

export default async function ClientsPage({ searchParams }: Props) {
  const user = await requireAdminUser("/admin/clientes");
  const params = await searchParams;
  const search = params?.busca?.trim();
  const status = params?.situacao === "ativo" || params?.situacao === "inativo" ? params.situacao : undefined;
  const result = await getPaginatedClients({ search, status, page: pageNumber(params?.page), pageSize });
  return <main className="min-h-screen bg-slate-50">
    <header className="border-b bg-white"><div className="container flex h-24 items-center justify-between gap-4"><Logo /><div className="flex items-center gap-3"><span className="hidden text-sm text-slate-600 md:inline">{user.email}</span><Button asChild variant="outline" size="sm"><Link href="/"><ArrowLeft className="h-4 w-4" /> Site</Link></Button><form action={logoutAction}><SubmitButton pendingLabel="Saindo..." variant="outline" size="sm" className="text-destructive hover:text-destructive"><LogOut className="h-4 w-4" /> Sair</SubmitButton></form></div></div></header>
    <div className="lg:flex"><AdminSidebar current="clientes" /><section className="min-w-0 flex-1 p-4 md:p-8">
      <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-brand-green">Cadastro</p><h1 className="text-3xl font-bold text-brand-ink">Clientes</h1><p className="mt-1 text-slate-600">Gerencie os dados comerciais e de contato dos seus clientes.</p></div><Button asChild><Link href="/admin/clientes/novo"><Plus className="h-4 w-4" /> Novo cliente</Link></Button></div>
      <form className="mb-6 grid gap-3 rounded-lg border bg-white p-4 shadow-soft md:grid-cols-[1fr_200px_auto_auto]" action="/admin/clientes"><label className="relative"><span className="sr-only">Buscar cliente</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input name="busca" defaultValue={search ?? ""} placeholder="Buscar cliente, CNPJ, cidade ou e-mail" className="pl-10" /></label><select name="situacao" defaultValue={status ?? ""} className="h-11 rounded-md border border-input bg-background px-3 text-sm"><option value="">Situação: todas</option><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select><Button type="submit"><Search className="h-4 w-4" /> Buscar</Button>{search || status ? <Button asChild variant="outline"><Link href="/admin/clientes">Limpar</Link></Button> : null}</form>
      <Card className="overflow-hidden shadow-soft"><CardHeader className="border-b"><CardTitle>Clientes cadastrados</CardTitle><CardDescription>{result.total} {result.total === 1 ? "cliente encontrado" : "clientes encontrados"}</CardDescription></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500"><tr><th className="px-5 py-4">Cliente</th><th className="px-4 py-4">CNPJ</th><th className="px-4 py-4">Contato</th><th className="px-4 py-4">Telefone</th><th className="px-4 py-4">Cidade</th><th className="px-4 py-4">Situação</th><th className="px-4 py-4">Ações</th></tr></thead><tbody className="divide-y">{result.clients.map((client) => <tr key={client.id} className="text-slate-600"><td className="px-5 py-4 font-semibold text-brand-ink">{client.corporate_name}</td><td className="px-4 py-4">{client.cnpj}</td><td className="px-4 py-4">{client.salesperson || "—"}</td><td className="px-4 py-4">{client.phone || "—"}</td><td className="px-4 py-4">{client.city}{client.state ? `/${client.state}` : ""}</td><td className="px-4 py-4"><span className={client.active ? "rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700" : "rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600"}>{client.active ? "Ativo" : "Inativo"}</span></td><td className="px-4 py-4"><Button asChild variant="ghost" size="sm"><Link href={`/admin/clientes/${client.id}`}><Pencil className="h-4 w-4" /> Ver / editar</Link></Button></td></tr>)}</tbody></table></div>{result.clients.length === 0 ? <p className="p-8 text-center text-slate-600">Nenhum cliente encontrado para os filtros informados.</p> : null}{result.totalPages > 1 ? <nav className="flex items-center justify-between border-t p-4"><span className="text-sm text-slate-600">Página {result.page} de {result.totalPages}</span><div className="flex gap-2">{result.page > 1 ? <Button asChild size="sm" variant="outline"><Link href={href(result.page - 1, search, status)}><ArrowLeft className="h-4 w-4" /> Anterior</Link></Button> : null}{result.page < result.totalPages ? <Button asChild size="sm"><Link href={href(result.page + 1, search, status)}>Próxima <ArrowRight className="h-4 w-4" /></Link></Button> : null}</div></nav> : null}</CardContent></Card>
    </section></div>
  </main>;
}
