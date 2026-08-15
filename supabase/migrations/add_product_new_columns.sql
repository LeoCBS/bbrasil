-- 1) Adiciona colunas (nullable) e defaults para novos registros
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS code text,
ADD COLUMN IF NOT EXISTS unit text,
ADD COLUMN IF NOT EXISTS stock integer,
ADD COLUMN IF NOT EXISTS cost_price numeric(12,2);

ALTER TABLE public.products
ALTER COLUMN stock SET DEFAULT 0,
ALTER COLUMN cost_price SET DEFAULT 0.00;

-- 2) (Opcional) Criar índice no código para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_products_code
ON public.products (code);

-- 3) (Opcional) Se desejar tornar stock/cost_price NOT NULL depois de preencher dados:
-- UPDATE public.products SET stock = 0 WHERE stock IS NULL;
-- UPDATE public.products SET cost_price = 0.00 WHERE cost_price IS NULL;
-- ALTER TABLE public.products ALTER COLUMN stock SET NOT NULL;
-- ALTER TABLE public.products ALTER COLUMN cost_price SET NOT NULL;