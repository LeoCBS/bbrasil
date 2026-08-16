import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";
import { requireAdminUser } from "@/auth";
import { getPaginatedClients } from "@/lib/clients";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import AdminHeader from "@/components/admin/admin-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildHref, parsePageParam } from "@/lib/pagination";

type Props = { searchParams?: Promise<{ busca?: string; situacao?: string; page?: string }> };
const pageSize = 8;

export default async function ClientsPage({ searchParams }: Props) {
  const user = await requireAdminUser("/admin/clientes");
  const params = await searchParams;
  const search = params?.busca?.trim();
  const status = params?.situacao === "ativo" || params?.situacao === "inativo" ? params.situacao : undefined;
  const result = await getPaginatedClients({ search, status, page: parsePageParam(params?.page), pageSize });
  const hrefFor = (target: number) => buildHref("/admin/clientes", { busca: search, situacao: status }, target);
  return <main className="min-h-screen bg-slate-50">
    <AdminHeader email={user.email} />
    <div className="lg:flex"><AdminSidebar current="clientes" /><section className="min-w-0 flex-1 p-4 md:p-8">
      <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-brand-green">Cadastro</p><h1 className="text-3xl font-bold text-brand-ink">Clientes</h1><p className="mt-1 text-slate-600">Gerencie os dados comerciais e de contato dos seus clientes.</p></div><Button asChild><Link href="/admin/clientes/novo"><Plus className="h-4 w-4" /> Novo cliente</Link></Button></div>
      <form className="mb-6 grid gap-3 rounded-lg border bg-white p-4 shadow-soft md:grid-cols-[1fr_200px_auto_auto]" action="/admin/clientes"><label className="relative"><span className="sr-only">Buscar cliente</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input name="busca" defaultValue={search ?? ""} placeholder="Buscar cliente, CNPJ, cidade ou e-mail" className="pl-10" /></label><select name="situacao" defaultValue={status ?? ""} className="h-11 rounded-md border border-input bg-background px-3 text-sm"><option value="">Situação: todas</option><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select><Button type="submit"><Search className="h-4 w-4" /> Buscar</Button>{search || status ? <Button asChild variant="outline"><Link href="/admin/clientes">Limpar</Link></Button> : null}</form>
      <Card className="overflow-hidden shadow-soft"><CardHeader className="border-b"><CardTitle>Clientes cadastrados</CardTitle><CardDescription>{result.total} {result.total === 1 ? "cliente encontrado" : "clientes encontrados"}</CardDescription></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500"><tr><th className="px-5 py-4">Cliente</th><th className="px-4 py-4">CNPJ</th><th className="px-4 py-4">Contato</th><th className="px-4 py-4">Telefone</th><th className="px-4 py-4">Cidade</th><th className="px-4 py-4">Situação</th><th className="px-4 py-4">Ações</th></tr></thead><tbody className="divide-y">{result.clients.map((client) => <tr key={client.id} className="text-slate-600"><td className="px-5 py-4 font-semibold text-brand-ink">{client.corporate_name}</td><td className="px-4 py-4">{client.cnpj}</td><td className="px-4 py-4">{client.salesperson || "—"}</td><td className="px-4 py-4">{client.phone || "—"}</td><td className="px-4 py-4">{client.city}{client.state ? `/${client.state}` : ""}</td><td className="px-4 py-4"><span className={client.active ? "rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700" : "rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600"}>{client.active ? "Ativo" : "Inativo"}</span></td><td className="px-4 py-4"><Button asChild variant="ghost" size="sm"><Link href={`/admin/clientes/${client.id}`}><Pencil className="h-4 w-4" /> Ver / editar</Link></Button></td></tr>)}</tbody></table></div>{result.clients.length === 0 ? <p className="p-8 text-center text-slate-600">Nenhum cliente encontrado para os filtros informados.</p> : null}{result.totalPages > 1 ? <AdminPagination className="flex items-center justify-between border-t p-4" page={result.page} totalPages={result.totalPages} hrefFor={hrefFor} arrowSize="sm" label={<span className="text-sm text-slate-600">Página {result.page} de {result.totalPages}</span>} /> : null}</CardContent></Card>
    </section></div>
  </main>;
}
