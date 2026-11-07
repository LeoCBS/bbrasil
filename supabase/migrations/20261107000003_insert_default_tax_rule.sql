-- Inserir regra fiscal padrão para Simples Nacional
-- Baseado no exemplo de NFE fornecido

INSERT INTO public.tax_rules (
  id,
  name,
  description,
  ncm,
  icms_orig,
  icms_csosn,
  icms_p_cred_sn,
  pis_cst,
  pis_p,
  cofins_cst,
  cofins_p,
  active
) VALUES (
  gen_random_uuid(),
  'Regra Padrão Simples Nacional',
  'Regra fiscal padrão para empresas do Simples Nacional (CSOSN 101, CST 99)',
  NULL,  -- Regra geral (aplica a todos os produtos)
  0,     -- Origem: Nacional
  101,   -- CSOSN: Tributada pelo Simples Nacional
  0.00,  -- Alíquota de crédito ICMS
  99,    -- CST PIS: Outras operações
  0.00,  -- Alíquota PIS
  99,    -- CST COFINS: Outras operações
  0.00,  -- Alíquota COFINS
  true   -- Ativa
) ON CONFLICT DO NOTHING;
