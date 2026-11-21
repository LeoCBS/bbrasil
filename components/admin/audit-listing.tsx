import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminPagination } from "@/components/admin/admin-pagination";
import AdminHeader from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { buildHref } from "@/lib/pagination";
import type { AuditKind } from "@/lib/audit";

const definitions: Record<AuditKind, { title: string; current: "auditoria-ibpt" | "auditoria-emissoes" | "auditoria-chamadas"; fields: [string, string][]; filterLabel: string; options: string[] }> = {
  ibpt: { title: "Cache IBPT", current: "auditoria-ibpt", fields: [["uf", "UF"], ["ncm", "NCM"], ["ex", "Ex"], ["nacional", "Nacional %"], ["estadual", "Estadual %"], ["municipal", "Municipal %"], ["importado", "Importado %"], ["vigencia_inicio", "Início vigência"], ["vigencia_fim", "Fim vigência"], ["versao", "Versão"], ["fetched_at", "Consultado em"]], filterLabel: "UF", options: [] },
  emissoes: { title: "Emissões NF-e", current: "auditoria-emissoes", fields: [["order_id", "Pedido"], ["access_key", "Chave de acesso"], ["environment", "Ambiente"], ["status", "Status"], ["batch_id", "Lote"], ["receipt_number", "Recibo"], ["protocol", "Protocolo"], ["c_stat", "cStat"], ["reason", "Motivo"], ["created_at", "Criado em"], ["updated_at", "Atualizado em"]], filterLabel: "Status", options: ["sending", "checking", "communication_error", "batch_received", "processing", "rejected", "denied", "authorized"] },
  chamadas: { title: "Chamadas NF-e", current: "auditoria-chamadas", fields: [["emission_id", "Emissão"], ["operation", "Operação"], ["endpoint", "Endpoint"], ["request_sha256", "SHA-256 solicitação"], ["http_status", "HTTP"], ["outcome", "Resultado"], ["c_stat", "cStat"], ["reason", "Motivo"], ["started_at", "Iniciada em"], ["finished_at", "Finalizada em"]], filterLabel: "Resultado", options: ["started", "response", "communication_error"] }
};
function display(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "string" && /^\d{4}-\d\d-\d\dT/.test(value)) return new Date(value).toLocaleString("pt-BR");
  return String(value);
}

export function AuditListing({ kind, user, rows, total, page, totalPages, busca, filtro, inicio, fim }: { kind: AuditKind; user: { email?: string }; rows: Record<string, unknown>[]; total: number; page: number; totalPages: number; busca?: string; filtro?: string; inicio?: string; fim?: string }) {
  const definition = definitions[kind];
  const hrefFor = (target: number) => buildHref(`/admin/auditoria/${kind}`, { busca, filtro, inicio, fim }, target);
  return <main className="min-h-screen bg-slate-50"><AdminHeader email={user.email ?? ""} /><div className="lg:flex"><AdminSidebar current={definition.current} /><section className="flex-1 p-4 md:p-8"><div className="mb-6"><h1 className="text-3xl font-bold text-brand-ink">{definition.title}</h1><p className="mt-1 text-slate-600">Consulta para auditoria · Somente leitura</p></div>
    <form className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5" action={`/admin/auditoria/${kind}`}><div className="relative md:col-span-2"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><Input name="busca" defaultValue={busca ?? ""} placeholder="Buscar nos registros..." className="pl-10"/></div><select name="filtro" defaultValue={filtro ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">{definition.filterLabel}: todos</option>{(definition.options.length ? definition.options : ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"]).map((option) => <option key={option} value={option}>{option}</option>)}</select><Input name="inicio" type="date" defaultValue={inicio ?? ""} aria-label="Data inicial"/><Input name="fim" type="date" defaultValue={fim ?? ""} aria-label="Data final"/><Button type="submit">Filtrar</Button></form>
    <Card><CardContent className="overflow-x-auto p-0"><table className="w-full text-left text-sm"><thead className="bg-slate-100 text-slate-600"><tr>{definition.fields.map(([, label]) => <th key={label} className="whitespace-nowrap px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y">{rows.map((row, index) => <tr key={String(row.id ?? `${row.uf}-${row.ncm}-${index}`)} className="align-top">{definition.fields.map(([field]) => <td key={field} className="max-w-xs whitespace-normal px-4 py-3">{display(row[field])}</td>)}</tr>)}</tbody></table></CardContent></Card>
    {total > 0 ? <AdminPagination className="mt-4 flex items-center justify-between" page={page} totalPages={totalPages} hrefFor={hrefFor} label={<div className="text-sm text-slate-600">Mostrando {rows.length} de {total} registros · Página {page} de {totalPages}</div>}/> : <div className="mt-4 text-center text-slate-600">Nenhum registro encontrado.</div>}</section></div></main>;
}
