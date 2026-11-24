import { getSupabase } from "@/lib/supabase";
import { formatCep } from "@/lib/format";

export type CepAddress = {
  zip_code: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  city_code: string;
};

type CepRow = {
  cep: string;
  logradouro: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  ibge: string | null;
  ddd: string | null;
};

function rowToCepAddress(row: CepRow, cep: string): CepAddress {
  return {
    zip_code: formatCep(row.cep || cep),
    address: row.logradouro ?? "",
    neighborhood: row.bairro ?? "",
    city: row.cidade ?? "",
    state: row.uf ?? "",
    city_code: row.ibge ?? ""
  };
}

export async function findCepLocal(cep: string): Promise<CepAddress | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("ceps")
    .select("cep,logradouro,complemento,bairro,cidade,uf,ibge,ddd")
    .eq("cep", cep)
    .maybeSingle();

  if (error || !data) return null;

  return rowToCepAddress(data as CepRow, cep);
}

type ViaCepResponse = {
  erro?: boolean;
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  ddd?: string;
};

export async function findCepRemote(cep: string): Promise<CepAddress | null> {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { cache: "no-store" });

  if (!response.ok) return null;

  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) return null;

  return {
    zip_code: formatCep(cep),
    address: data.logradouro ?? "",
    neighborhood: data.bairro ?? "",
    city: data.localidade ?? "",
    state: data.uf ?? "",
    city_code: data.ibge ?? ""
  };
}

export async function lookupCep(cep: string): Promise<CepAddress | null> {
  const local = await findCepLocal(cep);
  if (local) return local;

  const remote = await findCepRemote(cep);
  if (!remote) return null;

  await saveCepRemote(remote, cep);

  return remote;
}

async function saveCepRemote(address: CepAddress, cep: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const digits = cep.replace(/\D/g, "");
  const [logradouro = "", neighborhood = ""] = [address.address, address.neighborhood];

  const { error } = await supabase.from("ceps").upsert(
    {
      cep: digits,
      logradouro,
      complemento: "",
      bairro: neighborhood,
      cidade: address.city,
      uf: address.state,
      ibge: address.city_code,
      ddd: ""
    },
    { onConflict: "cep", ignoreDuplicates: false }
  );

  if (error) console.error("Não foi possível gravar o CEP consultado:", error.message);
}
