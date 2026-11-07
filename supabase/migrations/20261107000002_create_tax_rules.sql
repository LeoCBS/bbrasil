-- Tabela de regras fiscais para NFE
-- Armazena configurações de tributos por NCM ou regra geral
CREATE TABLE IF NOT EXISTS public.tax_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  ncm text,  -- NCM específico (nulo para regra geral)
  
  -- ICMS
  icms_orig integer,  -- Origem da mercadoria (0=Nacional, 1=Importada, 2=Estrangeira-Importação-Direta, etc)
  icms_csosn integer,  -- Código de Situação da Operação - Simples Nacional (101, 102, 103, 201, 202, 203, 300, 400, 500, 900)
  icms_p_cred_sn decimal(5, 2),  -- Alíquota aplicável de cálculo do crédito (Simples Nacional)
  
  -- PIS
  pis_cst integer,  -- Código de Situação Tributária do PIS (01, 02, 49, 50, 51, 52, 53, 54, 55, 56, 60, 61, 62, 63, 64, 65, 66, 67, 70, 71, 72, 73, 74, 75, 98, 99)
  pis_p decimal(5, 2),  -- Alíquota do PIS (%)
  
  -- COFINS
  cofins_cst integer,  -- Código de Situação Tributária do COFINS (01, 02, 49, 50, 51, 52, 53, 54, 55, 56, 60, 61, 62, 63, 64, 65, 66, 67, 70, 71, 72, 73, 74, 75, 98, 99)
  cofins_p decimal(5, 2),  -- Alíquota do COFINS (%)
  
  -- Metadados
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS tax_rules_ncm_idx ON public.tax_rules(ncm);
CREATE INDEX IF NOT EXISTS tax_rules_active_idx ON public.tax_rules(active);
CREATE INDEX IF NOT EXISTS tax_rules_name_idx ON public.tax_rules(name);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_tax_rules_updated_at
  BEFORE UPDATE ON public.tax_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.tax_rules IS 'Regras fiscais para cálculo de tributos em NF-e';
COMMENT ON COLUMN public.tax_rules.ncm IS 'NCM específico (deixe nulo para regra geral que se aplica a todos)';
COMMENT ON COLUMN public.tax_rules.icms_orig IS 'Origem da mercadoria: 0=Nacional, 1=Importada, 2=Estrangeira-Importação-Direta, 3=Estrangeira-Adquirida-Brasil, 4=Nacional-Conteúdo-Importado>40%, 5=Nacional-Conteúdo-Importado≤40%, 6=Estrangeira-Importação-Direta-Sem-Similar, 7=Estrangeira-Adquirida-Brasil-Sem-Similar, 8=Nacional-Conteúdo-Importado>70%';
COMMENT ON COLUMN public.tax_rules.icms_csosn IS 'CSOSN - Código de Situação da Operação no Simples Nacional';
COMMENT ON COLUMN public.tax_rules.icms_p_cred_sn IS 'Alíquota aplicável de cálculo do crédito do ICMS no Simples Nacional (%)';
COMMENT ON COLUMN public.tax_rules.pis_cst IS 'CST - Código de Situação Tributária do PIS';
COMMENT ON COLUMN public.tax_rules.pis_p IS 'Alíquota do PIS (%)';
COMMENT ON COLUMN public.tax_rules.cofins_cst IS 'CST - Código de Situação Tributária do COFINS';
COMMENT ON COLUMN public.tax_rules.cofins_p IS 'Alíquota do COFINS (%)';
