-- Adiciona campo nfe_info na tabela orders
-- Para armazenar informações adicionais da NFe (infCpl)

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS nfe_info text;
