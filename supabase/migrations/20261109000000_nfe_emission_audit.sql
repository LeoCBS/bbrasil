ALTER TABLE public.nfe_technical_responsible
  ADD COLUMN IF NOT EXISTS authorization_url TEXT;

UPDATE public.nfe_technical_responsible
SET authorization_url = 'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx'
WHERE authorization_url IS NULL;

CREATE TABLE IF NOT EXISTS public.nfe_emissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  access_key VARCHAR(44) NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('homologation', 'production')),
  status TEXT NOT NULL CHECK (status IN (
    'sending', 'checking', 'communication_error', 'batch_received', 'processing',
    'rejected', 'denied', 'authorized'
  )),
  batch_id VARCHAR(15),
  receipt_number VARCHAR(20),
  protocol VARCHAR(20),
  c_stat VARCHAR(10),
  reason TEXT,
  last_response_xml TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nfe_emissions_order_created
  ON public.nfe_emissions(order_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_nfe_emissions_one_uncertain_key
  ON public.nfe_emissions(order_id, access_key)
  WHERE status IN ('sending', 'checking', 'communication_error', 'batch_received', 'processing');

CREATE TABLE IF NOT EXISTS public.nfe_emission_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emission_id UUID NOT NULL REFERENCES public.nfe_emissions(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_sha256 CHAR(64) NOT NULL,
  http_status INTEGER,
  outcome TEXT NOT NULL CHECK (outcome IN ('started', 'response', 'communication_error')),
  c_stat VARCHAR(10),
  reason TEXT,
  response_xml TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_nfe_emission_calls_emission
  ON public.nfe_emission_calls(emission_id, started_at);

ALTER TABLE public.nfe_emissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfe_emission_calls ENABLE ROW LEVEL SECURITY;
