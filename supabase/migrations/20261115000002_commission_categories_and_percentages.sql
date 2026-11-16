ALTER TABLE public.commission_rules
  ADD COLUMN IF NOT EXISTS min_difference_percent numeric(9,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_difference_percent numeric(9,4);

ALTER TABLE public.commission_rules
  DROP CONSTRAINT IF EXISTS commission_rules_difference_range_check;
ALTER TABLE public.commission_rules
  ADD CONSTRAINT commission_rules_difference_percent_range_check
  CHECK (max_difference_percent IS NULL OR max_difference_percent >= min_difference_percent);

DROP INDEX IF EXISTS public.commission_rules_one_category_active;
CREATE UNIQUE INDEX IF NOT EXISTS commission_rules_one_active_category
  ON public.commission_rules(category_id)
  WHERE active AND category_id IS NOT NULL;
