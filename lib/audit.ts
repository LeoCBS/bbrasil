import { unstable_noStore as noStore } from "next/cache";
import { buildIlikePattern } from "@/lib/supabase-filters";
import { getSupabase } from "@/lib/supabase";
import { pageRange, totalPagesFor } from "@/lib/pagination";

export type AuditKind = "ibpt" | "emissoes" | "chamadas";
const config = {
  ibpt: { table: "ibpt_rates_cache", search: ["uf", "ncm", "chave", "versao"], order: "fetched_at" },
  emissoes: { table: "nfe_emissions", search: ["order_id", "access_key", "protocol", "reason"], order: "created_at" },
  chamadas: { table: "nfe_emission_calls", search: ["operation", "endpoint", "outcome", "c_stat", "reason"], order: "started_at" }
} as const;

export async function getAuditRows(kind: AuditKind, params: { page: number; pageSize: number; busca?: string; filtro?: string; inicio?: string; fim?: string }) {
  noStore();
  const supabase = getSupabase();
  const { from, to, page, pageSize } = pageRange(params.page, params.pageSize);
  if (!supabase) return { rows: [] as Record<string, unknown>[], total: 0, page, pageSize, totalPages: 0 };
  const definition = config[kind];
  let query = supabase.from(definition.table).select("*", { count: "exact" }).order(definition.order, { ascending: false });
  if (params.busca?.trim()) {
    const pattern = buildIlikePattern(params.busca.trim());
    query = query.or(definition.search.map((column) => `${column}.ilike.${pattern}`).join(","));
  }
  if (params.filtro) query = query.eq(kind === "ibpt" ? "uf" : kind === "emissoes" ? "status" : "outcome", params.filtro);
  if (params.inicio) query = query.gte(kind === "ibpt" ? "fetched_at" : kind === "emissoes" ? "created_at" : "started_at", `${params.inicio}T00:00:00`);
  if (params.fim) query = query.lte(kind === "ibpt" ? "fetched_at" : kind === "emissoes" ? "created_at" : "started_at", `${params.fim}T23:59:59`);
  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(`Não foi possível carregar os dados de auditoria: ${error.message}`);
  const total = count ?? 0;
  return { rows: (data ?? []) as Record<string, unknown>[], total, page, pageSize, totalPages: totalPagesFor(total, pageSize) };
}
