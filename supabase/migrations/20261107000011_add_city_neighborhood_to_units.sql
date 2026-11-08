-- Adiciona campos city, neighborhood e state na tabela units
-- Para emissão de NFe (enderEmit)

ALTER TABLE public.units
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text;
