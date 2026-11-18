ALTER TABLE public.commission_rules
  ADD CONSTRAINT commission_rules_name_unique UNIQUE (name);
