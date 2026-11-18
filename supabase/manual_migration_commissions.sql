-- SQL para o SQL Editor do Supabase durante o desenvolvimento.
-- Apaga e recria apenas regras e registros de comissão existentes.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS preco_tabela numeric(12,2);
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS salesperson_type text CHECK (salesperson_type IN ('interno', 'externo'));

DROP TABLE IF EXISTS public.commissions;
DROP TABLE IF EXISTS public.commission_rules;

CREATE TABLE public.commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  min_difference_percent numeric(9,4) NOT NULL DEFAULT 0,
  max_difference_percent numeric(9,4),
  commission_percent numeric(7,4) NOT NULL CHECK (commission_percent >= 0 AND commission_percent <= 100),
  category_id uuid NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT commission_rules_difference_percent_range_check
    CHECK (max_difference_percent IS NULL OR max_difference_percent >= min_difference_percent)
);
CREATE UNIQUE INDEX commission_rules_one_active_category
  ON public.commission_rules(category_id)
  WHERE active AND category_id IS NOT NULL;
CREATE INDEX commission_rules_active_range_idx
  ON public.commission_rules(min_difference_percent, max_difference_percent)
  WHERE active AND category_id IS NULL;

CREATE TABLE public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id bigint NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  salesperson_id text NOT NULL,
  salesperson_name text NOT NULL,
  product_name text NOT NULL,
  category_name text,
  quantity numeric(12,3) NOT NULL,
  sale_amount numeric(12,2) NOT NULL,
  base_amount numeric(12,2) NOT NULL,
  commission_percent numeric(7,4) NOT NULL,
  commission_amount numeric(12,2) NOT NULL,
  rule_id uuid NULL REFERENCES public.commission_rules(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_item_id)
);
CREATE INDEX commissions_salesperson_idx ON public.commissions(salesperson_id, created_at DESC);

ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.commission_rules FROM anon, authenticated;
REVOKE ALL ON public.commissions FROM anon, authenticated;

NOTIFY pgrst, 'reload schema';
