-- Adiciona campos NFe na tabela clients
-- address_number e city_code necessários para emissão de NFe

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS address_number text,
ADD COLUMN IF NOT EXISTS city_code text;
