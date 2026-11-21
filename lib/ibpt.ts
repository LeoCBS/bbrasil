import { getSupabase } from "@/lib/supabase";

const IBPT_ENDPOINT = "https://apidoni.ibpt.org.br/api/v1/produtos";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type IbptRates = {
  uf: string;
  ncm: string;
  ex: number;
  nacional: number;
  estadual: number;
  municipal: number;
  importado: number;
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  chave: string | null;
  versao: string | null;
  fonte: string | null;
  fetched_at: string;
};

export type IbptTaxAmounts = {
  v_tot_trib: number;
  federal: number;
  estadual: number;
  municipal: number;
  fonte: string | null;
  chave: string | null;
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function numberFrom(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function readApiRates(data: Record<string, unknown>, uf: string, ncm: string, ex: number): IbptRates {
  return {
    uf,
    ncm,
    ex,
    nacional: numberFrom(data.Nacional),
    estadual: numberFrom(data.Estadual),
    municipal: numberFrom(data.Municipal),
    importado: numberFrom(data.Importado),
    vigencia_inicio: typeof data.VigenciaInicio === "string" ? data.VigenciaInicio : null,
    vigencia_fim: typeof data.VigenciaFim === "string" ? data.VigenciaFim : null,
    chave: typeof data.Chave === "string" ? data.Chave : null,
    versao: typeof data.Versao === "string" ? data.Versao : null,
    fonte: typeof data.Fonte === "string" ? data.Fonte : null,
    fetched_at: new Date().toISOString()
  };
}

async function fetchIbptRates(params: {
  uf: string;
  ncm: string;
  ex: number;
  cnpj: string;
  descricao: string;
  unidade: string;
  gtin: string;
  codigoInterno: string;
}): Promise<IbptRates> {
  const token = process.env.IBPT_API_TOKEN;
  if (!token) throw new Error("IBPT_API_TOKEN não configurado.");
  if (!params.cnpj) throw new Error("CNPJ da unidade emissora não configurado para consulta IBPT.");

  const query = new URLSearchParams({
    token,
    cnpj: params.cnpj.replace(/\D/g, ""),
    codigo: params.ncm,
    uf: params.uf,
    ex: String(params.ex),
    descricao: params.descricao,
    unidadeMedida: params.unidade || "UN",
    valor: "1.00",
    gtin: params.gtin || "SEM GTIN",
    codigoInterno: params.codigoInterno
  });
  const response = await fetch(`${IBPT_ENDPOINT}?${query}`, { signal: AbortSignal.timeout(8000), cache: "no-store" });
  if (!response.ok) throw new Error(`API IBPT respondeu HTTP ${response.status}.`);

  const raw: unknown = await response.json();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Resposta da API IBPT inválida.");
  const data = raw as Record<string, unknown>;
  if (data.Erro || data.erro) throw new Error(String(data.Erro ?? data.erro));

  const rates = readApiRates(data, params.uf, params.ncm, params.ex);
  if (![rates.nacional, rates.estadual, rates.municipal, rates.importado].some((rate) => rate > 0)) {
    throw new Error("A API IBPT não retornou alíquotas para o NCM informado.");
  }
  return rates;
}

/** Busca primeiro o cache Supabase. Quando expirado, tenta atualizar pela API;
 * se a API falhar, devolve o último valor conhecido, mesmo vencido. */
export async function getIbptRates(params: {
  uf: string;
  ncm: string;
  ex?: number;
  cnpj: string;
  descricao: string;
  unidade?: string | null;
  gtin?: string | null;
  codigoInterno?: string | null;
  forceRefresh?: boolean;
}): Promise<IbptRates> {
  const uf = params.uf.trim().toUpperCase();
  const ncm = params.ncm.replace(/\D/g, "");
  const ex = params.ex ?? 0;
  if (!uf || !ncm) throw new Error("UF e NCM são necessários para consultar o IBPT.");

  const supabase = getSupabase();
  let cached: IbptRates | null = null;
  if (supabase) {
    const { data, error } = await supabase.from("ibpt_rates_cache").select("*").eq("uf", uf).eq("ncm", ncm).eq("ex", ex).maybeSingle();
    if (error) console.error("Erro ao consultar cache IBPT:", error.message);
    else cached = data as IbptRates | null;
  }

  const isFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (isFresh && !params.forceRefresh) return cached;

  try {
    const fresh = await fetchIbptRates({
      uf, ncm, ex, cnpj: params.cnpj, descricao: params.descricao,
      unidade: params.unidade ?? "UN", gtin: params.gtin ?? "SEM GTIN",
      codigoInterno: params.codigoInterno ?? ""
    });
    if (supabase) {
      const { error } = await supabase.from("ibpt_rates_cache").upsert(fresh, { onConflict: "uf,ncm,ex" });
      if (error) console.error("Erro ao salvar cache IBPT:", error.message);
    }
    return fresh;
  } catch (error) {
    if (cached) {
      console.warn("API IBPT indisponível; usando valor em cache:", error);
      return cached;
    }
    throw error;
  }
}

export function calculateIbptAmounts(rates: IbptRates, amount: number, imported = false): IbptTaxAmounts {
  const federalRate = imported ? rates.importado : rates.nacional;
  const federal = roundMoney(amount * federalRate / 100);
  const estadual = roundMoney(amount * rates.estadual / 100);
  const municipal = roundMoney(amount * rates.municipal / 100);
  return {
    federal,
    estadual,
    municipal,
    v_tot_trib: roundMoney(federal + estadual + municipal),
    fonte: rates.fonte,
    chave: rates.chave
  };
}

export async function invalidateIbptCache() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { error } = await supabase.from("ibpt_rates_cache").delete().not("ncm", "is", null);
  if (error) throw new Error(`Não foi possível invalidar o cache IBPT: ${error.message}`);
}
