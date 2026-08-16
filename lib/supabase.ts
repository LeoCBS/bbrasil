import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false
    }
  });
}

export function missingConfigMessage(feature = "o admin") {
  return `Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar ${feature}.`;
}

export function requireSupabase(feature?: string): SupabaseClient {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error(missingConfigMessage(feature));
  }

  return supabase;
}

export async function insertRecord(table: string, values: Record<string, unknown>, feature?: string) {
  const { error } = await requireSupabase(feature).from(table).insert(values);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateRecord(table: string, id: string, values: Record<string, unknown>, feature?: string) {
  const { error } = await requireSupabase(feature).from(table).update(values).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteRecord(table: string, id: string, feature?: string) {
  const { error } = await requireSupabase(feature).from(table).delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
