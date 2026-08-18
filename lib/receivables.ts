import { unstable_noStore as noStore } from "next/cache";
import { buildIlikePattern } from "@/lib/supabase-filters";
import { getSupabase } from "@/lib/supabase";
import { paginate, pageRange, totalPagesFor } from "@/lib/pagination";
import { normalizeText } from "@/lib/text";

export type Receivable = {
  id: number;
  order_id?: number;
  order_reference?: string;
  client_id?: string;
  client_name?: string;
  client_cnpj?: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  unit_id: string;
  unit_name: string;
  observation?: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  created_at?: string;
  updated_at?: string;
};

export type ReceivableMutationInput = Omit<Receivable, "id" | "created_at" | "updated_at">;

export type ReceivablesPage = { receivables: Receivable[]; total: number; page: number; pageSize: number; totalPages: number };

const fallbackReceivables: Receivable[] = [];

function matches(receivable: Receivable, search?: string, status?: string, unitId?: string) {
  const text = normalizeText(search ?? "");
  const hasText = !text || [receivable.client_name, receivable.client_cnpj, receivable.order_reference, receivable.unit_name].some((value) => normalizeText(value || "").includes(text));
  const hasStatus = !status || receivable.status === status;
  const hasUnit = !unitId || receivable.unit_id === unitId;
  return hasText && hasStatus && hasUnit;
}

function paginateFallbackReceivables(page: number, pageSize: number, search?: string, status?: string, unitId?: string): ReceivablesPage {
  const { items, ...rest } = paginate(fallbackReceivables.filter((receivable) => matches(receivable, search, status, unitId)), page, pageSize);
  return { receivables: items, ...rest };
}

export async function getPaginatedReceivables({ search, status, unitId, page = 1, pageSize = 10 }: { search?: string; status?: string; unitId?: string; page?: number; pageSize?: number } = {}): Promise<ReceivablesPage> {
  noStore();
  const supabase = getSupabase();
  const { page: safePage, pageSize: safePageSize, from, to } = pageRange(page, pageSize);
  if (!supabase) return paginateFallbackReceivables(safePage, safePageSize, search, status, unitId);
  
  let query = supabase.from("receivables").select("*", { count: "exact" }).order("due_date", { ascending: true });
  
  if (status) query = query.eq("status", status);
  if (unitId) query = query.eq("unit_id", unitId);
  if (search?.trim()) {
    const pattern = buildIlikePattern(search.trim());
    query = query.or(`client_name.ilike.${pattern},client_cnpj.ilike.${pattern},order_reference.ilike.${pattern},unit_name.ilike.${pattern}`);
  }
  
  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(`Não foi possível carregar as contas a receber: ${error.message}`);
  const total = count ?? 0;
  return { receivables: (data ?? []) as Receivable[], total, page: safePage, pageSize: safePageSize, totalPages: totalPagesFor(total, safePageSize) };
}

export async function getReceivable(id: number): Promise<Receivable | null> {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackReceivables.find((receivable) => receivable.id === id) ?? null;
  
  const { data, error } = await supabase.from("receivables").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Não foi possível carregar a conta a receber: ${error.message}`);
  return data as Receivable;
}

export async function createReceivable(input: ReceivableMutationInput) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from("receivables").insert([input]);
  if (error) throw new Error(`Não foi possível criar a conta a receber: ${error.message}`);
}

export async function updateReceivable(id: number, input: ReceivableMutationInput) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from("receivables").update(input).eq("id", id);
  if (error) throw new Error(`Não foi possível atualizar a conta a receber: ${error.message}`);
}

export async function deleteReceivable(id: number) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from("receivables").delete().eq("id", id);
  if (error) throw new Error(`Não foi possível deletar a conta a receber: ${error.message}`);
}

export async function markAsPaid(id: number, paymentDate: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from("receivables").update({
    status: 'paid',
    payment_date: paymentDate
  }).eq("id", id);
  if (error) throw new Error(`Não foi possível marcar como pago: ${error.message}`);
}

export async function createReceivableFromOrder(orderId: number, orderData: {
  client_id?: string;
  client_name?: string;
  client_cnpj?: string;
  total_amount: number;
  unit_id?: string;
  unit_name?: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from("receivables").insert([{
    order_id: orderId,
    order_reference: `#${orderId}`,
    client_id: orderData.client_id,
    client_name: orderData.client_name,
    client_cnpj: orderData.client_cnpj,
    amount: orderData.total_amount,
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias a partir de hoje
    status: 'pending',
    unit_id: orderData.unit_id,
    unit_name: orderData.unit_name,
    user_id: orderData.user_id,
    user_name: orderData.user_name,
    user_email: orderData.user_email
  }]);
  if (error) throw new Error(`Não foi possível criar a conta a receber: ${error.message}`);
}
