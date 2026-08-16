import { randomUUID } from "crypto";
import { unstable_noStore as noStore } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { buildIlikePattern } from "@/lib/supabase-filters";

export type Client = {
  id: string;
  corporate_name: string;
  cnpj: string;
  state_registration: string;
  address: string;
  neighborhood: string;
  notes: string;
  city: string;
  state: string;
  zip_code: string;
  email: string;
  phone: string;
  salesperson: string;
  unit: string;
  unit_id: string;
  active: boolean;
  created_at?: string;
};

export type ClientMutationInput = Omit<Client, "id" | "created_at">;
export type ClientsPage = { clients: Client[]; total: number; page: number; pageSize: number; totalPages: number };

const fallbackClients: Client[] = [
  { id: "demo-client-1", corporate_name: "Mercado 3 Irmãos Ltda", cnpj: "12.345.678/0001-90", state_registration: "", address: "Rua das Flores, 120", neighborhood: "Centro", notes: "", city: "Joinville", state: "SC", zip_code: "89201-000", email: "contato@mercado3irmaos.com.br", phone: "(47) 99999-9999", salesperson: "João da Silva", unit: "JOINVILLE SC", unit_id: "unit-joinville", active: true },
  { id: "demo-client-2", corporate_name: "Hotel Praia Norte", cnpj: "23.456.789/0001-01", state_registration: "", address: "Av. Atlântica, 80", neighborhood: "Praia", notes: "", city: "Joinville", state: "SC", zip_code: "89210-000", email: "compras@hotelpraianorte.com.br", phone: "(47) 98888-8888", salesperson: "Maria Santos", unit: "JOINVILLE SC", unit_id: "unit-joinville", active: true }
];

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createSupabaseClient(url, key, { auth: { persistSession: false } }) : null;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function matches(client: Client, search?: string, status?: string) {
  const text = normalize(search?.trim() ?? "");
  const hasText = !text || [client.corporate_name, client.cnpj, client.city, client.email, client.salesperson].some((value) => normalize(value).includes(text));
  return hasText && (status !== "ativo" || client.active) && (status !== "inativo" || !client.active);
}

export async function getPaginatedClients({ search, status, page = 1, pageSize = 10 }: { search?: string; status?: string; page?: number; pageSize?: number } = {}): Promise<ClientsPage> {
  noStore();
  const supabase = getSupabase();
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  if (!supabase) {
    const filtered = fallbackClients.filter((client) => matches(client, search, status));
    const totalPages = Math.max(1, Math.ceil(filtered.length / safePageSize));
    const finalPage = Math.min(safePage, totalPages);
    return { clients: filtered.slice((finalPage - 1) * safePageSize, finalPage * safePageSize), total: filtered.length, page: finalPage, pageSize: safePageSize, totalPages };
  }
  let query = supabase.from("clients").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (status === "ativo") query = query.eq("active", true);
  if (status === "inativo") query = query.eq("active", false);
  if (search?.trim()) {
    const pattern = buildIlikePattern(search.trim());
    query = query.or(`corporate_name.ilike.${pattern},cnpj.ilike.${pattern},city.ilike.${pattern},email.ilike.${pattern}`);
  }
  const from = (safePage - 1) * safePageSize;
  const { data, error, count } = await query.range(from, from + safePageSize - 1);
  if (error) {
    console.error("Supabase clients fetch failed:", error.message);
    const filtered = fallbackClients.filter((client) => matches(client, search, status));
    const totalPages = Math.max(1, Math.ceil(filtered.length / safePageSize));
    const finalPage = Math.min(safePage, totalPages);
    return { clients: filtered.slice((finalPage - 1) * safePageSize, finalPage * safePageSize), total: filtered.length, page: finalPage, pageSize: safePageSize, totalPages };
  }
  const total = count ?? 0;
  return { clients: (data ?? []) as Client[], total, page: safePage, pageSize: safePageSize, totalPages: Math.max(1, Math.ceil(total / safePageSize)) };
}

export async function getClient(id: string): Promise<Client | null> {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackClients.find((client) => client.id === id) ?? null;
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Não foi possível carregar o cliente: ${error.message}`);
  return data as Client | null;
}

export async function createClient(input: ClientMutationInput) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o cadastro de clientes.");
  const { error } = await supabase.from("clients").insert({ ...input, id: randomUUID() });
  if (error) throw new Error(error.message);
}

export async function updateClient(id: string, input: ClientMutationInput) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o cadastro de clientes.");
  const { error } = await supabase.from("clients").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteClient(id: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar o cadastro de clientes.");
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
