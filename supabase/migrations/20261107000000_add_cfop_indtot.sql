-- Adiciona colunas cfop e indTot nas tabelas order_items e quotation_items
-- Para integração com NFE (Nota Fiscal Eletrônica)

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS cfop integer,
ADD COLUMN IF NOT EXISTS indtot integer;

ALTER TABLE public.order_items
ALTER COLUMN cfop SET DEFAULT 5102,
ALTER COLUMN indtot SET DEFAULT 1;

ALTER TABLE public.quotation_items
ADD COLUMN IF NOT EXISTS cfop integer,
ADD COLUMN IF NOT EXISTS indtot integer;

ALTER TABLE public.quotation_items
ALTER COLUMN cfop SET DEFAULT 5102,
ALTER COLUMN indtot SET DEFAULT 1;
