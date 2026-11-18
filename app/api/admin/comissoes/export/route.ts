import { requireAdminUser } from '@/auth';
import { getCommissionRecords } from '@/lib/commissions';

function escapeCell(value: unknown) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
function getExportTimestamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}-${values.hour}${values.minute}${values.second}`;
}
export async function GET(request: Request) {
  await requireAdminUser('/admin/comissoes');
  const url = new URL(request.url); const seller = url.searchParams.get('vendedor') || undefined;
  const records = await getCommissionRecords(seller);
  const rows = [['Data','Pedido','Vendedor','Produto','Quantidade','Venda','Base','Percentual','Comissão'], ...records.map(r => [new Date(r.created_at).toLocaleDateString('pt-BR'), r.order_id, r.salesperson_name, r.product_name, r.quantity, r.sale_amount.toFixed(2), r.base_amount.toFixed(2), r.commission_percent, r.commission_amount.toFixed(2)])];
  const html = `<html><meta charset="utf-8"><table>${rows.map(row => `<tr>${row.map(cell => `<td>${escapeCell(cell)}</td>`).join('')}</tr>`).join('')}</table></html>`;
  const filename = `comissoes-${getExportTimestamp()}.xls`;
  return new Response(`\ufeff${html}`, { headers: { 'Content-Type': 'application/vnd.ms-excel; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"` } });
}
