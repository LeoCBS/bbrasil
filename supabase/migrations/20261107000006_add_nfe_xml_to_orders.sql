-- Adiciona coluna nfe_xml na tabela orders
-- Para armazenar o XML da NFe gerado automaticamente

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS nfe_xml text;
