import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  user_id?: string | null;
  email: string;
  name?: string | null;
  unit_id?: string | null;
  role: 'admin' | 'vendedor';
  active: boolean;
  created_at?: string;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getProfiles(): Promise<Profile[]> {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Profile[];
}

export async function getProfile(id: string): Promise<Profile | null> {
  noStore();
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Profile | null;
}

export async function createProfile(input: Omit<Profile, 'id' | 'created_at'>) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('profiles').insert([input]);
  if (error) throw new Error(error.message);
}

export async function updateProfile(id: string, input: Partial<Omit<Profile, 'id' | 'created_at'>>) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('profiles').update(input).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteProfile(id: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
