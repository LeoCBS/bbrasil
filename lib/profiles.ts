import { unstable_noStore as noStore } from "next/cache";
import { getSupabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  unit_id: string | null;
  role: string;
  active: boolean;
  created_at?: string;
};

const profilesFeature = "o cadastro de perfis";

const fallbackProfiles: Profile[] = [
  { id: "demo-profile-1", user_id: null, email: "joao@example.com", name: "João da Silva", unit_id: "unit-joinville", role: "vendedor", active: true },
  { id: "demo-profile-2", user_id: null, email: "maria@example.com", name: "Maria Santos", unit_id: "unit-joinville", role: "vendedor", active: true }
];

export async function getProfiles({ includeInactive = false }: { includeInactive?: boolean } = {}) {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackProfiles.filter((profile) => includeInactive || profile.active);
  let query = supabase.from("profiles").select("*").order("name");
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw new Error(`Não foi possível carregar os perfis: ${error.message}`);
  return (data ?? []) as Profile[];
}

export async function getProfile(id: string) {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return fallbackProfiles.find((profile) => profile.id === id) ?? null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Não foi possível carregar o perfil: ${error.message}`);
  return data as Profile | null;
}