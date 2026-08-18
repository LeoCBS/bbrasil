import { unstable_noStore as noStore } from "next/cache";
import { buildIlikePattern } from "@/lib/supabase-filters";
import { getSupabase } from "@/lib/supabase";
import { paginate, pageRange, totalPagesFor } from "@/lib/pagination";
import { normalizeText } from "@/lib/text";

export type Payable = {
  id: number;
  supplier_name: string;
  supplier_cnpj?: string;
  supplier_address?: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  category?: string;
  payment_method?: string;
  unit_id: string;
  unit_name: string;
  observation?: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  created_at?: string;
  updated_at?: string;
};

export type PayableMutationInput = Omit<Payable, "id" | "created_at" | "updated_at">;

export type PayablesPage = { payables: Payable[]; total: number; page: number; pageSize: number; totalPages: number };

const fallbackPayables: Payable[] = [];

function matches(payable: Payable, search?: string, status?: string, unitId?: string) {
  const text = normalizeText(search ?? "");
  const hasText = !text || [payable.supplier_name, payable.supplier_cnpj, payable.description, payable.category, payable.unit_name].some((value) => normalizeText(value || "").includes(text));
  const hasStatus = !status || payable.status === status;
  const hasUnit = !unitId || payable.unit_id === unitId;
  return hasText && hasStatus && hasUnit;
}

function paginateFallbackPayables(page: number, pageSize: number, search?: string, status?: string, unitId?: string): PayablesPage {
  const { items, ...rest } = paginate(fallbackPayables.filter((payable) => matches(payable, search, status, unitId)), page, pageSize);
  return { payables: items, ...rest };
}

export async function getPaginatedPayables({ search, status, unitId, page = 1, pageSize = 10 }: { search?: string; status?: string; unitId?: string; page?: number; pageSize?: number } = {}): Promise<PayablesPage> {
  noStore();
  const supabase = getSupabase();
  const { page: safePage, pageSize: safePageSize, from, to } = pageRange(page, pageSize);
  if (!supabase) return paginateFallbackPayables(safePage, safePageSize, search, status, unitId);
  
  let query = supabase.from("payables").select("*", { count: "exact" }).order("due_date", { ascending: true });
  
  if (status) query = query.eq("status", status);
  if (unitId) query = query.eq("unit_id", unitId);
  if (search?.trim()) {
    const pattern = buildIlikePattern(search.trim());
    query = query.or(`supplier_name.ilike.${pattern},supplier_cnpj.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern},unit_name.ilike.${pattern}`);
  }
  
  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(`Não foi possível carregar as contas a pagar: ${error.message}`);
  const total = count ?? 0;
  return { payables: (data ?? []) as Payable[], total, page: safePage, pageSize: safePageSize, totalPages: totalPagesFor(total, safePageSize) };
}

export async function getPayable(id: number): Promise<Payable | null> {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackPayables.find((payable) => payable.id === id) ?? null;
  
  const { data, error } = await supabase.from("payables").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Não foi possível carregar a conta a pagar: ${error.message}`);
  return data as Payable;
}

export async function createPayable(input: PayableMutationInput) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from("payables").insert([input]);
  if (error) throw new Error(`Não foi possível criar a conta a pagar: ${error.message}`);
}

export async function updatePayable(id: number, input: PayableMutationInput) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from("payables").update(input).eq("id", id);
  if (error) throw new Error(`Não foi possível atualizar a conta a pagar: ${error.message}`);
}

export async function deletePayable(id: number) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from("payables").delete().eq("id", id);
  if (error) throw new Error(`Não foi possível deletar a conta a pagar: ${error.message}`);
}

export async function markAsPaid(id: number, paymentDate: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from("payables").update({
    status: 'paid',
    payment_date: paymentDate
  }).eq("id", id);
  if (error) throw new Error(`Não foi possível marcar como pago: ${error.message}`);
}
