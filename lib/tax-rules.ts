import { unstable_noStore as noStore } from "next/cache";
import { deleteRecord, getSupabase, insertRecord, updateRecord } from "@/lib/supabase";
import { paginate, pageRange, totalPagesFor } from "@/lib/pagination";
import { likePattern } from "@/lib/text";

export type TaxCalculation = {
  v_pis: number;
  v_cofins: number;
  v_tot_trib: number;
};

export type TaxRule = {
  id: string;
  name: string;
  description?: string | null;
  ncm?: string | null;
  icms_orig?: number | null;
  icms_csosn?: number | null;
  icms_p_cred_sn?: number | null;
  pis_cst?: number | null;
  pis_p?: number | null;
  cofins_cst?: number | null;
  cofins_p?: number | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TaxRuleMutationInput = Omit<TaxRule, "id" | "created_at" | "updated_at">;

const fallbackTaxRules: TaxRule[] = [
  {
    id: "demo-1",
    name: "Regra Padrão Simples Nacional",
    description: "Regra geral para vendas dentro do estado",
    ncm: null,
    icms_orig: 0,
    icms_csosn: 101,
    icms_p_cred_sn: 0.00,
    pis_cst: 99,
    pis_p: 0.00,
    cofins_cst: 99,
    cofins_p: 0.00,
    active: true
  },
  {
    id: "demo-2",
    name: "Produtos de Limpeza (NCM 3401)",
    description: "Regra específica para produtos de limpeza",
    ncm: "3401",
    icms_orig: 0,
    icms_csosn: 101,
    icms_p_cred_sn: 0.00,
    pis_cst: 99,
    pis_p: 0.00,
    cofins_cst: 99,
    cofins_p: 0.00,
    active: true
  }
];

function normalizeTaxRule(rule: Partial<TaxRule> & { id: string; name: string }): TaxRule {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description ?? null,
    ncm: rule.ncm ?? null,
    icms_orig: rule.icms_orig ?? null,
    icms_csosn: rule.icms_csosn ?? null,
    icms_p_cred_sn: rule.icms_p_cred_sn ?? null,
    pis_cst: rule.pis_cst ?? null,
    pis_p: rule.pis_p ?? null,
    cofins_cst: rule.cofins_cst ?? null,
    cofins_p: rule.cofins_p ?? null,
    active: rule.active ?? true,
    created_at: rule.created_at,
    updated_at: rule.updated_at
  };
}

export type TaxRulesPage = {
  tax_rules: TaxRule[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getTaxRules({ includeInactive = false } = {}) {
  noStore();
  const supabase = getSupabase();

  if (!supabase) {
    return fallbackTaxRules.filter((rule) => includeInactive || rule.active);
  }

  let query = supabase.from("tax_rules").select("*").order("name", { ascending: true });

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Não foi possível carregar as regras fiscais: ${error.message}`);
  }

  return (data ?? []).map((rule) => normalizeTaxRule(rule as TaxRule));
}

function paginateFallbackTaxRules(includeInactive: boolean, page: number, pageSize: number, search?: string): TaxRulesPage {
  const filtered = fallbackTaxRules.filter((rule) => {
    const visible = includeInactive || rule.active;
    const matches = search 
      ? rule.name.toLowerCase().includes(search.toLowerCase()) || 
        (rule.ncm && rule.ncm.toLowerCase().includes(search.toLowerCase()))
      : true;

    return visible && matches;
  });

  const { items, ...rest } = paginate(filtered, page, pageSize);

  return { tax_rules: items, ...rest };
}

export async function getPaginatedTaxRules({ includeInactive = false, page = 1, pageSize = 10, search }: { includeInactive?: boolean; page?: number; pageSize?: number; search?: string } = {}): Promise<TaxRulesPage> {
  noStore();
  const supabase = getSupabase();
  const { page: safePage, pageSize: safePageSize, from, to } = pageRange(page, pageSize);

  if (!supabase) {
    return paginateFallbackTaxRules(includeInactive, safePage, safePageSize, search);
  }

  let query = supabase.from("tax_rules").select("*", { count: "exact" }).order("name", { ascending: true });

  if (!includeInactive) query = query.eq("active", true);
  if (search) {
    const pattern = likePattern(search);
    query = query.or(`name.ilike.${pattern},ncm.ilike.${pattern}`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(`Não foi possível carregar as regras fiscais: ${error.message}`);
  }

  const total = count ?? 0;
  const totalPages = totalPagesFor(total, safePageSize);

  return {
    tax_rules: (data ?? []).map((rule) => normalizeTaxRule(rule as TaxRule)),
    total,
    page: Math.min(safePage, totalPages),
    pageSize: safePageSize,
    totalPages
  };
}

export async function getTaxRule(id: string, { includeInactive = false } = {}) {
  noStore();
  const supabase = getSupabase();

  if (!supabase) {
    return fallbackTaxRules.find((rule) => rule.id === id && (includeInactive || rule.active)) ?? null;
  }

  let query = supabase.from("tax_rules").select("*").eq("id", id).limit(1);

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Não foi possível carregar a regra fiscal: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return normalizeTaxRule(data as TaxRule);
}

export async function createTaxRule(input: TaxRuleMutationInput) {
  await insertRecord("tax_rules", input);
}

export async function updateTaxRule(id: string, input: TaxRuleMutationInput) {
  await updateRecord("tax_rules", id, input);
}

export async function deleteTaxRule(id: string) {
  await deleteRecord("tax_rules", id);
}

export async function getTaxRuleByNcm(ncm: string): Promise<TaxRule | null> {
  noStore();
  const supabase = getSupabase();

  if (!supabase) {
    return fallbackTaxRules.find((rule) => rule.ncm === ncm && rule.active) ?? null;
  }

  const { data, error } = await supabase
    .from("tax_rules")
    .select("*")
    .eq("ncm", ncm)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Não foi possível carregar a regra fiscal para o NCM: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return normalizeTaxRule(data as TaxRule);
}

export async function getDefaultTaxRule(): Promise<TaxRule | null> {
  noStore();
  const supabase = getSupabase();

  if (!supabase) {
    return fallbackTaxRules.find((rule) => rule.ncm === null && rule.active) ?? null;
  }

  const { data, error } = await supabase
    .from("tax_rules")
    .select("*")
    .is("ncm", null)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Não foi possível carregar a regra fiscal padrão: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return normalizeTaxRule(data as TaxRule);
}

/**
 * Calcula os valores de tributos (PIS, COFINS, Total) com base na regra fiscal
 * @param taxRule - Regra fiscal a ser aplicada
 * @param baseValue - Valor base para cálculo (geralmente total_price do item)
 * @returns Objeto com os valores calculados
 */
export function calculateItemTaxes(taxRule: TaxRule | null, baseValue: number): TaxCalculation {
  if (!taxRule) {
    return {
      v_pis: 0,
      v_cofins: 0,
      v_tot_trib: 0
    };
  }

  // Calcular vPIS = base de cálculo × alíquota / 100
  const v_pis = baseValue * (taxRule.pis_p ?? 0) / 100;

  // Calcular vCOFINS = base de cálculo × alíquota / 100
  const v_cofins = baseValue * (taxRule.cofins_p ?? 0) / 100;

  // vTotTrib = vPIS + vCOFINS (pode incluir outros tributos no futuro)
  const v_tot_trib = v_pis + v_cofins;

  return {
    v_pis: Math.round(v_pis * 100) / 100, // Arredondar para 2 casas decimais
    v_cofins: Math.round(v_cofins * 100) / 100,
    v_tot_trib: Math.round(v_tot_trib * 100) / 100
  };
}
