ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS commercial_status text NOT NULL DEFAULT 'pedido',
  ADD COLUMN IF NOT EXISTS valid_until date,
  ADD COLUMN IF NOT EXISTS payment_terms text NOT NULL DEFAULT 'Boleto',
  ADD COLUMN IF NOT EXISTS delivery_days integer NOT NULL DEFAULT 2;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2) NOT NULL DEFAULT 0;

ALTER TABLE public.orders DROP COLUMN IF EXISTS observation;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_commercial_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_commercial_status_check
  CHECK (commercial_status IN ('orcamento','pedido','faturado'));

UPDATE public.orders SET commercial_status = 'faturado' WHERE status = 'finalized';

DROP TABLE IF EXISTS public.quotation_items CASCADE;
DROP TABLE IF EXISTS public.quotations CASCADE;

ALTER TABLE public.orders ALTER COLUMN commercial_status SET DEFAULT 'orcamento';
