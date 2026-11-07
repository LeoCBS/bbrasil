-- Adicionar campos de regra fiscal e tributos em order_items
-- Para integração com NFE (Nota Fiscal Eletrônica)
-- Cálculo de tributos é feito no backend TypeScript (não no banco)

-- Adicionar tax_rule_id (FK para tax_rules)
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS tax_rule_id uuid REFERENCES public.tax_rules(id) ON DELETE SET NULL;

-- Adicionar campos de valores de tributos
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS v_pis DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS v_cofins DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS v_tot_trib DECIMAL(10, 2) DEFAULT 0.00;

-- Criar índice para tax_rule_id
CREATE INDEX IF NOT EXISTS order_items_tax_rule_id_idx ON public.order_items(tax_rule_id);

-- Comentários
COMMENT ON COLUMN public.order_items.tax_rule_id IS 'ID da regra fiscal aplicada ao item';
COMMENT ON COLUMN public.order_items.v_pis IS 'Valor do PIS (Programa de Integração Social) - calculado no backend';
COMMENT ON COLUMN public.order_items.v_cofins IS 'Valor do COFINS (Contribuição para Financiamento da Seguridade Social) - calculado no backend';
COMMENT ON COLUMN public.order_items.v_tot_trib IS 'Valor total dos tributos - calculado no backend';
