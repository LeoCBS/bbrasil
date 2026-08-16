import { randomUUID } from "crypto";
import { unstable_noStore as noStore } from "next/cache";
import { deleteRecord, getSupabase, insertRecord, updateRecord } from "@/lib/supabase";

export type Unit = { id: string; name: string; address: string; phone: string; whatsapp_number: string; email: string; active: boolean; created_at?: string };
export type UnitInput = Omit<Unit, "id" | "created_at">;

const fallbackUnits: Unit[] = [
  { id: "unit-florianopolis", name: "FLORIANOPOLIS SC", address: "Rua Sao Ludgero, 1580 - CEP 88117-270\nBarreiros - Sao Jose - SC", phone: "(48) 3240 0074", whatsapp_number: "554832400074", email: "comercial@bbrasilprodutosdelimpeza.com.br", active: true },
  { id: "unit-joinville", name: "JOINVILLE SC", address: "Rua Rocha Pombo, 252 - CEP 89222-060\nIririu - Joinville - SC", phone: "(47) 3026 6607", whatsapp_number: "554730266607", email: "joinville@bbrasilprodutosdelimpeza.com.br", active: true },
  { id: "unit-itajai", name: "ITAJAI SC", address: "Rua Blumenau, 1520 - Bl. 05 - CEP 88305-104\nBarra do Rio - Itajai - SC", phone: "(47) 3246 0868", whatsapp_number: "554732460868", email: "itajai@bbrasilprodutosdelimpeza.com.br", active: true },
  { id: "unit-blumenau", name: "BLUMENAU SC", address: "Rua Fritz Spernau, 912 - CEP 89052-015\nFortaleza - Blumenau - SC", phone: "(47) 3338 5555", whatsapp_number: "554733385555", email: "blumenau@bbrasilprodutosdelimpeza.com.br", active: true },
  { id: "unit-criciuma", name: "CRICIUMA SC", address: "Rua Gonçalves Ledo, 92 sala 02 - Centro - Criciúma SC. Cep: 88802-120", phone: "(48) 3413 5005", whatsapp_number: "554834135005", email: "criciuma@bbrasilprodutosdelimpeza.com.br", active: true },
  { id: "unit-curitiba", name: "CURITIBA PR", address: "Rua Des. Westphalen, 1642 A - CEP 80230-100\nReboucas - Curitiba - PR", phone: "(41) 3278 7008", whatsapp_number: "554132787008", email: "curitiba@bbrasilprodutosdelimpeza.com.br", active: true },
  { id: "unit-sao-paulo", name: "SAO PAULO SP", address: "Rua Cel. Mario de Azevedo, 153 - CEP 02710-020\nJardim Pereira Leite - Sao Paulo - SP", phone: "(11) 2679 5559", whatsapp_number: "551126795559", email: "sp@bbrasilprodutosdelimpeza.com.br", active: true }
];

const unitsFeature = "o cadastro de unidades";

export async function getUnits({ includeInactive = false }: { includeInactive?: boolean } = {}) {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackUnits.filter((unit) => includeInactive || unit.active);
  let query = supabase.from("units").select("*").order("name");
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw new Error(`Não foi possível carregar as unidades: ${error.message}`);
  return (data ?? []) as Unit[];
}

export async function createUnit(input: UnitInput) {
  await insertRecord("units", { ...input, id: randomUUID() }, unitsFeature);
}

export async function updateUnit(id: string, input: UnitInput) {
  await updateRecord("units", id, input, unitsFeature);
}

export async function deleteUnit(id: string) {
  await deleteRecord("units", id, unitsFeature);
}
