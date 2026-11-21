CREATE TABLE IF NOT EXISTS public.ibpt_rates_cache (
  uf char(2) NOT NULL,
  ncm varchar(8) NOT NULL,
  ex integer NOT NULL DEFAULT 0,
  nacional numeric(9, 4) NOT NULL DEFAULT 0,
  estadual numeric(9, 4) NOT NULL DEFAULT 0,
  municipal numeric(9, 4) NOT NULL DEFAULT 0,
  importado numeric(9, 4) NOT NULL DEFAULT 0,
  vigencia_inicio text,
  vigencia_fim text,
  chave text,
  versao text,
  fonte text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (uf, ncm, ex)
);

ALTER TABLE public.ibpt_rates_cache ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.ibpt_rates_cache IS 'Cache das alíquotas aproximadas do IBPT por UF, NCM e exceção tarifária.';
