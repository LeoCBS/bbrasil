import { randomUUID } from "crypto";
import { unstable_noStore as noStore } from "next/cache";
import { deleteRecord, getSupabase, insertRecord, updateRecord } from "@/lib/supabase";
import { getNFeServiceUrls } from "@/lib/nfe-config";

export type NFeTechnicalResponsible = {
  id: string;
  cnpj: string;
  contact_name: string;
  email: string;
  phone: string;
  authorization_url?: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type NFeTechnicalResponsibleInput = Omit<NFeTechnicalResponsible, "id" | "created_at" | "updated_at">;

const fallbackNFeTechnicalResponsible: NFeTechnicalResponsible[] = [];

const nfeTechnicalResponsibleFeature = "o cadastro de responsável técnico NFe";

export async function getNFeTechnicalResponsibles({ includeInactive = false }: { includeInactive?: boolean } = {}): Promise<NFeTechnicalResponsible[]> {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackNFeTechnicalResponsible.filter((resp) => includeInactive || resp.active);
  let query = supabase.from("nfe_technical_responsible").select("*").order("contact_name");
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw new Error(`Não foi possível carregar os responsáveis técnicos: ${error.message}`);
  return (data ?? []) as NFeTechnicalResponsible[];
}

export async function getNFeTechnicalResponsible(id: string): Promise<NFeTechnicalResponsible | null> {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackNFeTechnicalResponsible.find((resp) => resp.id === id) ?? null;
  const { data, error } = await supabase.from("nfe_technical_responsible").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Não foi possível carregar o responsável técnico: ${error.message}`);
  return data as NFeTechnicalResponsible | null;
}

export async function getActiveNFeTechnicalResponsible(): Promise<NFeTechnicalResponsible | null> {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackNFeTechnicalResponsible.find((resp) => resp.active) ?? null;
  const { data, error } = await supabase.from("nfe_technical_responsible").select("*").eq("active", true).maybeSingle();
  if (error) throw new Error(`Não foi possível carregar o responsável técnico ativo: ${error.message}`);
  return data as NFeTechnicalResponsible | null;
}

export async function createNFeTechnicalResponsible(input: NFeTechnicalResponsibleInput) {
  const authorizationUrl = validateAuthorizationUrl(input.authorization_url);
  await insertRecord("nfe_technical_responsible", { ...input, authorization_url: authorizationUrl, id: randomUUID() }, nfeTechnicalResponsibleFeature);
}

export async function updateNFeTechnicalResponsible(id: string, input: NFeTechnicalResponsibleInput) {
  const authorizationUrl = validateAuthorizationUrl(input.authorization_url);
  await updateRecord("nfe_technical_responsible", id, { ...input, authorization_url: authorizationUrl }, nfeTechnicalResponsibleFeature);
}

function validateAuthorizationUrl(value: string | null | undefined): string {
  const officialUrl = getNFeServiceUrls().authorization;
  if (value && value !== officialUrl) {
    throw new Error("A URL de autorização precisa corresponder ao ambiente configurado no backend.");
  }
  return officialUrl;
}

export async function deleteNFeTechnicalResponsible(id: string) {
  await deleteRecord("nfe_technical_responsible", id, nfeTechnicalResponsibleFeature);
}
