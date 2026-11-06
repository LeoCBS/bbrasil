-- Adiciona colunas cEAN, cEANTrib e uTrib na tabela products
-- Para integração com NFE (Nota Fiscal Eletrônica)

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS cean text,
ADD COLUMN IF NOT EXISTS cean_trib text,


ALTER TABLE public.products
ALTER COLUMN cean SET DEFAULT 'SEM GTIN',
ALTER COLUMN cean_trib SET DEFAULT 'SEM GTIN',
