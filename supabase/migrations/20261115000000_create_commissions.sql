ALTER TABLE products ADD COLUMN IF NOT EXISTS preco_tabela numeric(12,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salesperson_type text CHECK (salesperson_type IN ('interno', 'externo'));

CREATE TABLE IF NOT EXISTS commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN ('margin', 'category')),
  category_id uuid NULL REFERENCES categories(id) ON DELETE CASCADE,
  commission_percent numeric(7,4) NOT NULL CHECK (commission_percent >= 0 AND commission_percent <= 100),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT commission_rule_category_required CHECK (rule_type <> 'category' OR category_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS commission_rules_one_margin_active ON commission_rules(rule_type) WHERE rule_type = 'margin' AND active;
CREATE UNIQUE INDEX IF NOT EXISTS commission_rules_one_category_active ON commission_rules(category_id) WHERE rule_type = 'category' AND active;

CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id bigint NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  salesperson_id text NOT NULL,
  salesperson_name text NOT NULL,
  product_name text NOT NULL,
  category_name text,
  quantity numeric(12,3) NOT NULL,
  sale_amount numeric(12,2) NOT NULL,
  base_amount numeric(12,2) NOT NULL,
  commission_percent numeric(7,4) NOT NULL,
  commission_amount numeric(12,2) NOT NULL,
  rule_id uuid NULL REFERENCES commission_rules(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_item_id)
);
CREATE INDEX IF NOT EXISTS commissions_salesperson_idx ON commissions(salesperson_id, created_at DESC);

ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.commission_rules FROM anon, authenticated;
REVOKE ALL ON public.commissions FROM anon, authenticated;
