import { randomUUID } from "crypto";
import { unstable_noStore as noStore } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export type Salesperson = { id: string; name: string; email: string; phone: string; unit_id: string; active: boolean; created_at?: string };
export type SalespersonInput = Omit<Salesperson, "id" | "created_at">;

const fallbackSalespeople: Salesperson[] = [
  { id: "demo-salesperson-1", name: "João da Silva", email: "", phone: "", unit_id: "unit-joinville", active: true },
  { id: "demo-salesperson-2", name: "Maria Santos", email: "", phone: "", unit_id: "unit-joinville", active: true }
];

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createSupabaseClient(url, key, { auth: { persistSession: false } }) : null;
}

export async function getSalespeople({ includeInactive = false }: { includeInactive?: boolean } = {}) {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackSalespeople.filter((person) => includeInactive || person.active);
  let query = supabase.from("salespeople").select("*").order("name");
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw new Error(`Não foi possível carregar os vendedores: ${error.message}`);
  return (data ?? []) as Salesperson[];
}

export async function getSalesperson(id: string) {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackSalespeople.find((person) => person.id === id) ?? null;
  const { data, error } = await supabase.from("salespeople").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Não foi possível carregar o vendedor: ${error.message}`);
  return data as Salesperson | null;
}

export async function createSalesperson(input: SalespersonInput) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o cadastro de vendedores.");
  const { error } = await supabase.from("salespeople").insert({ ...input, id: randomUUID() });
  if (error) throw new Error(error.message);
}

export async function updateSalesperson(id: string, input: SalespersonInput) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o cadastro de vendedores.");
  const { error } = await supabase.from("salespeople").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteSalesperson(id: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o cadastro de vendedores.");
  const { error } = await supabase.from("salespeople").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
