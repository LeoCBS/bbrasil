import { unstable_noStore as noStore } from "next/cache";
import { getSupabase } from "@/lib/supabase";

export type CommissionRule = { id: string; name: string; min_difference_percent: number; max_difference_percent: number | null; commission_percent: number; category_id: string | null; active: boolean; category_name?: string | null };
export type CommissionRecord = { id: string; order_id: number; order_item_id: number; salesperson_id: string; salesperson_name: string; product_name: string; category_name: string | null; quantity: number; sale_amount: number; base_amount: number; commission_percent: number; commission_amount: number; created_at: string };

type CommissionRuleRow = CommissionRule & { categories?: { name: string | null } | null };
type OrderItemRow = { id: number; product_id: string | number | null; product_name: string; quantity: number | string; unit_price: number | string; total_price: number | string | null };
type ProductRow = { id: string | number; category_id: string | null; preco_tabela: number | string | null };

export function calculateCommission(saleAmount: number, tablePrice: number, quantity: number, commissionPercent: number) {
  const baseAmount = Math.round((saleAmount - tablePrice * quantity) * 100) / 100;
  return { baseAmount, commissionAmount: Math.round(baseAmount * commissionPercent) / 100 };
}

export function calculatePriceDifferencePercent(salePrice: number, tablePrice: number) {
  if (tablePrice === 0) return null;
  return ((salePrice - tablePrice) / tablePrice) * 100;
}

export function selectCommissionRule(rules: CommissionRule[], categoryId: string | null, differencePercent: number | null) {
  const categoryRule = rules.find(rule => rule.category_id !== null && rule.category_id === categoryId);
  if (categoryRule) return categoryRule;
  if (differencePercent === null) return null;

  const boundedRule = rules.find(rule => rule.category_id === null
    && rule.max_difference_percent !== null
    && differencePercent >= rule.min_difference_percent
    && differencePercent <= rule.max_difference_percent);
  if (boundedRule) return boundedRule;

  return rules.find(rule => rule.category_id === null
    && rule.max_difference_percent === null
    && differencePercent >= rule.min_difference_percent) ?? null;
}

export async function getCommissionRules(): Promise<CommissionRule[]> {
  noStore(); const db = getSupabase(); if (!db) return [];
  const { data, error } = await db.from('commission_rules').select('*, categories(name)').order('min_difference_percent', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: CommissionRuleRow) => ({ ...row, category_name: row.categories?.name ?? null })) as CommissionRule[];
}

export async function saveCommissionRule(input: Omit<CommissionRule, 'id'> & { id?: string }) {
  const db = getSupabase(); if (!db) throw new Error('Supabase not configured');
  const { id, ...values } = input;
  const query = id ? db.from('commission_rules').update(values).eq('id', id) : db.from('commission_rules').insert(values);
  const { error } = await query; if (error) throw new Error(error.message);
}
export async function deleteCommissionRule(id: string) {
  const db = getSupabase(); if (!db) throw new Error('Supabase not configured');
  const { error } = await db.from('commission_rules').delete().eq('id', id); if (error) throw new Error(error.message);
}

export async function getCommissionRecords(salespersonId?: string): Promise<CommissionRecord[]> {
  noStore(); const db = getSupabase(); if (!db) return [];
  let query = db.from('commissions').select('*').order('created_at', { ascending: false });
  if (salespersonId) query = query.eq('salesperson_id', salespersonId);
  const { data, error } = await query; if (error) throw new Error(error.message); return (data ?? []) as CommissionRecord[];
}

export async function createOrderCommissions(orderId: number, salespersonId?: string | null, salespersonName?: string | null) {
  if (!salespersonId) return;
  const db = getSupabase(); if (!db) return;
  const [{ data: items, error: itemsError }, { data: rules, error: rulesError }] = await Promise.all([
    db.from('order_items').select('id, product_id, product_name, quantity, unit_price, total_price').eq('order_id', orderId),
    db.from('commission_rules').select('id, min_difference_percent, max_difference_percent, commission_percent, category_id').eq('active', true)
  ]);
  if (itemsError) throw new Error(itemsError.message); if (rulesError) throw new Error(rulesError.message);
  const productIds = [...new Set((items ?? []).map((item: OrderItemRow) => item.product_id).filter((id): id is string | number => id !== null))];
  const { data: products, error: productsError } = productIds.length ? await db.from('products').select('id, category_id, preco_tabela').in('id', productIds) : { data: [], error: null };
  if (productsError) throw new Error(productsError.message);
  const productMap = new Map((products ?? []).map((p: ProductRow) => [p.id, p]));
  const rows = (items ?? []).flatMap((item: OrderItemRow) => {
    const product = item.product_id === null ? undefined : productMap.get(item.product_id);
    if (product?.preco_tabela == null) return [];
    const quantity = Number(item.quantity);
    const sale = Number(item.total_price ?? quantity * Number(item.unit_price));
    const tablePrice = Number(product?.preco_tabela ?? 0);
    const differencePercent = calculatePriceDifferencePercent(Number(item.unit_price), tablePrice);
    const rule = selectCommissionRule((rules ?? []) as CommissionRule[], product?.category_id ?? null, differencePercent);
    if (!rule) return [];
    const { baseAmount, commissionAmount } = calculateCommission(sale, tablePrice, quantity, Number(rule.commission_percent));
    return [{ order_id: orderId, order_item_id: item.id, salesperson_id: salespersonId, salesperson_name: salespersonName || salespersonId, product_name: item.product_name, category_name: null, quantity, sale_amount: sale, base_amount: baseAmount, commission_percent: rule.commission_percent, commission_amount: commissionAmount, rule_id: rule.id }];
  });
  if (rows.length) { const { error } = await db.from('commissions').insert(rows); if (error) throw new Error(error.message); }
}
