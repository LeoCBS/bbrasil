-- Adiciona campos NFe na tabela units
-- CNPJ e IE necessários para emissão de NFe

ALTER TABLE public.units
ADD COLUMN IF NOT EXISTS cnpj text,
ADD COLUMN IF NOT EXISTS ie text,
ADD COLUMN IF NOT EXISTS process_version text DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS address_number text,
ADD COLUMN IF NOT EXISTS city_code text;
