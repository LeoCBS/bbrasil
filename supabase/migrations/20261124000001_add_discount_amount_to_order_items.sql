ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) NOT NULL DEFAULT 0;

UPDATE public.order_items
SET discount_amount = ROUND(unit_price * quantity * COALESCE(discount_percent, 0) / 100, 2);
