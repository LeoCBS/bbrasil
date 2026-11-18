import { requireAdminUser } from '@/auth';
import { getProfiles } from '@/lib/users';
import { getCommissionRecords, getCommissionRules } from '@/lib/commissions';
import { getCategories } from '@/lib/categories';
import { formatCurrency } from '@/lib/format';
import AdminHeader from '@/components/admin/admin-header';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { CommissionRulesPanel } from '@/components/admin/commission-rules-panel';
import { deleteCommissionRecordAction } from '@/lib/commission-actions';
import { DeleteCommissionRecordButton } from '@/components/admin/delete-commission-record-button';

export default async function CommissionsPage({ searchParams }: { searchParams?: Promise<{ vendedor?: string }> }) {
  const user = await requireAdminUser('/admin/comissoes');
  const params = await searchParams; const seller = params?.vendedor ?? '';
  const [profiles, rules, records, categories] = await Promise.all([getProfiles(), getCommissionRules(), getCommissionRecords(seller || undefined), getCategories()]);
  const sellers = profiles.filter(p => p.role === 'vendedor');
  const rulesById = new Map(rules.map(rule => [rule.id, rule.name]));
  return <main className="min-h-screen bg-slate-50"><AdminHeader email={user.email}/><div className="lg:flex"><AdminSidebar current="comissoes"/><section className="flex-1 space-y-6 p-4 md:p-8">
    <div><h1 className="text-3xl font-bold text-brand-ink">Comissões</h1><p className="mt-1 text-slate-600">A comissão é calculada sobre a diferença entre o preço de venda e o preço de custo.</p></div>
    <CommissionRulesPanel rules={rules} categories={categories}/>
    <Card><CardContent className="p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Vendas com comissão</h2><a className="rounded border bg-white px-4 py-2" href={`/api/admin/comissoes/export${seller ? `?vendedor=${encodeURIComponent(seller)}` : ''}`}>Exportar XLS</a></div><form className="mb-4 flex gap-3"><select name="vendedor" defaultValue={seller} className="h-11 rounded-md border bg-white px-3"><option value="">Todos os vendedores</option>{sellers.map(p=><option key={p.id} value={p.id}>{p.name || p.email}</option>)}</select><button className="rounded bg-brand-blue px-4 text-white">Filtrar</button></form><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-sm"><thead><tr className="text-left"><th className="p-2">Data</th><th className="p-2">Pedido</th><th className="p-2">Vendedor</th><th className="p-2">Produto</th><th className="p-2">Qtd.</th><th className="p-2">Venda</th><th className="p-2">Diferença</th><th className="p-2">%</th><th className="p-2">Comissão</th><th className="p-2">Regra</th><th className="p-2">Ação</th></tr></thead><tbody>{records.map(r=><tr key={r.id} className="border-t"><td className="p-2">{new Date(r.created_at).toLocaleDateString('pt-BR')}</td><td className="p-2">#{r.order_id}</td><td className="p-2">{r.salesperson_name}</td><td className="p-2">{r.product_name}</td><td className="p-2">{r.quantity}</td><td className="p-2">{formatCurrency(r.sale_amount)}</td><td className="p-2">{formatCurrency(r.base_amount)}</td><td className="p-2">{r.commission_percent}%</td><td className="p-2">{formatCurrency(r.commission_amount)}</td><td className="p-2">{r.rule_id ? rulesById.get(r.rule_id) ?? "Regra removida" : "—"}</td><td className="p-2"><DeleteCommissionRecordButton id={r.id} action={deleteCommissionRecordAction}/></td></tr>)}</tbody></table>{records.length===0&&<p className="p-4 text-slate-500">Nenhum registro encontrado.</p>}</div></CardContent></Card>
  </section></div></main>;
}
