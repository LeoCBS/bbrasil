import { requireAdminUser } from '@/auth';
import { getCommissionRecords } from '@/lib/commissions';

function escapeCell(value: unknown) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
export async function GET(request: Request) {
  await requireAdminUser('/admin/comissoes');
  const url = new URL(request.url); const seller = url.searchParams.get('vendedor') || undefined;
  const records = await getCommissionRecords(seller);
  const rows = [['Data','Pedido','Vendedor','Produto','Quantidade','Venda','Base','Percentual','Comissão'], ...records.map(r => [new Date(r.created_at).toLocaleDateString('pt-BR'), r.order_id, r.salesperson_name, r.product_name, r.quantity, r.sale_amount.toFixed(2), r.base_amount.toFixed(2), r.commission_percent, r.commission_amount.toFixed(2)])];
  const html = `<html><meta charset="utf-8"><table>${rows.map(row => `<tr>${row.map(cell => `<td>${escapeCell(cell)}</td>`).join('')}</tr>`).join('')}</table></html>`;
  return new Response(`\ufeff${html}`, { headers: { 'Content-Type': 'application/vnd.ms-excel; charset=utf-8', 'Content-Disposition': 'attachment; filename="comissoes.xls"' } });
}
