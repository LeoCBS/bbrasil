import { randomUUID } from "crypto";
import { unstable_noStore as noStore } from "next/cache";
import { buildIlikePattern } from "@/lib/supabase-filters";
import { deleteRecord, getSupabase, insertRecord, updateRecord } from "@/lib/supabase";
import { paginate, pageRange, totalPagesFor } from "@/lib/pagination";
import { normalizeText } from "@/lib/text";

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
  profile_id: string | null;
  unit: string;
  unit_id: string;
  active: boolean;
  created_at?: string;
};

export type ClientMutationInput = Omit<Client, "id" | "created_at">;
export type ClientsPage = { clients: Client[]; total: number; page: number; pageSize: number; totalPages: number };

const fallbackClients: Client[] = [
  { id: "demo-client-1", corporate_name: "Mercado 3 Irmãos Ltda", cnpj: "12.345.678/0001-90", state_registration: "", address: "Rua das Flores, 120", neighborhood: "Centro", notes: "", city: "Joinville", state: "SC", zip_code: "89201-000", email: "contato@mercado3irmaos.com.br", phone: "(47) 99999-9999", profile_id: "demo-profile-1", unit: "JOINVILLE SC", unit_id: "unit-joinville", active: true },
  { id: "demo-client-2", corporate_name: "Hotel Praia Norte", cnpj: "23.456.789/0001-01", state_registration: "", address: "Av. Atlântica, 80", neighborhood: "Praia", notes: "", city: "Joinville", state: "SC", zip_code: "89210-000", email: "compras@hotelpraianorte.com.br", phone: "(47) 98888-8888", profile_id: "demo-profile-2", unit: "JOINVILLE SC", unit_id: "unit-joinville", active: true }
];

const clientsFeature = "o cadastro de clientes";

function matches(client: Client, search?: string, status?: string) {
  const text = normalizeText(search ?? "");
  const hasText = !text || [client.corporate_name, client.cnpj, client.city, client.email].some((value) => normalizeText(value).includes(text));
  return hasText && (status !== "ativo" || client.active) && (status !== "inativo" || !client.active);
}

function paginateFallbackClients(page: number, pageSize: number, search?: string, status?: string): ClientsPage {
  const { items, ...rest } = paginate(fallbackClients.filter((client) => matches(client, search, status)), page, pageSize);

  return { clients: items, ...rest };
}

export async function getClients({ includeInactive = false }: { includeInactive?: boolean } = {}): Promise<Client[]> {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackClients.filter((client) => includeInactive || client.active);
  let query = supabase.from("clients").select("*").order("corporate_name");
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw new Error(`Não foi possível carregar os clientes: ${error.message}`);
  return (data ?? []) as Client[];
}

export async function getPaginatedClients({ search, status, page = 1, pageSize = 10 }: { search?: string; status?: string; page?: number; pageSize?: number } = {}): Promise<ClientsPage> {
  noStore();
  const supabase = getSupabase();
  const { page: safePage, pageSize: safePageSize, from, to } = pageRange(page, pageSize);
  if (!supabase) return paginateFallbackClients(safePage, safePageSize, search, status);
  let query = supabase.from("clients").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (status === "ativo") query = query.eq("active", true);
  if (status === "inativo") query = query.eq("active", false);
  if (search?.trim()) {
    const pattern = buildIlikePattern(search.trim());
    query = query.or(`corporate_name.ilike.${pattern},cnpj.ilike.${pattern},city.ilike.${pattern},email.ilike.${pattern}`);
  }
  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(`Não foi possível carregar os clientes: ${error.message}`);
  const total = count ?? 0;
  return { clients: (data ?? []) as Client[], total, page: safePage, pageSize: safePageSize, totalPages: totalPagesFor(total, safePageSize) };
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
  await insertRecord("clients", { ...input, id: randomUUID() }, clientsFeature);
}

export async function updateClient(id: string, input: ClientMutationInput) {
  await updateRecord("clients", id, input, clientsFeature);
}

export async function deleteClient(id: string) {
  await deleteRecord("clients", id, clientsFeature);
}
