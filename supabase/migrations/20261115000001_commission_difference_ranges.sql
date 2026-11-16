ALTER TABLE public.commission_rules
  ADD COLUMN IF NOT EXISTS min_difference numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_difference numeric(12,2);

-- Regras criadas no formato anterior não representam faixas de diferença.
-- Mantemos o histórico e desativamos essas regras para revisão no admin.
UPDATE public.commission_rules SET active = false WHERE rule_type <> 'difference';

DROP INDEX IF EXISTS public.commission_rules_one_margin_active;
DROP INDEX IF EXISTS public.commission_rules_one_category_active;
ALTER TABLE public.commission_rules DROP CONSTRAINT IF EXISTS commission_rule_category_required;
ALTER TABLE public.commission_rules DROP CONSTRAINT IF EXISTS commission_rules_rule_type_check;
ALTER TABLE public.commission_rules ADD CONSTRAINT commission_rules_rule_type_check CHECK (rule_type = 'difference');
ALTER TABLE public.commission_rules ADD CONSTRAINT commission_rules_difference_range_check CHECK (max_difference IS NULL OR max_difference >= min_difference);
