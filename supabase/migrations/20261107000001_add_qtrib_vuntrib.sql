-- Adiciona colunas qtrib e v_un_trib nas tabelas order_items e quotation_items
-- Para integração com NFE (Nota Fiscal Eletrônica)
-- qtrib: quantidade tributável (mesmo valor de quantity)
-- v_un_trib: valor unitário tributável (mesmo valor de unit_price)

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS qtrib INTEGER,
ADD COLUMN IF NOT EXISTS v_un_trib DECIMAL(10, 2);

ALTER TABLE public.quotation_items
ADD COLUMN IF NOT EXISTS qtrib INTEGER,
ADD COLUMN IF NOT EXISTS v_un_trib DECIMAL(10, 2);

-- Criar trigger para manter qtrib sincronizado com quantity (order_items)
CREATE OR REPLACE FUNCTION sync_qtrib_to_quantity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.qtrib = NEW.quantity;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_sync_qtrib_order_items
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION sync_qtrib_to_quantity();

-- Criar trigger para manter qtrib sincronizado com quantity (quotation_items)
CREATE TRIGGER trigger_sync_qtrib_quotation_items
  BEFORE INSERT OR UPDATE ON public.quotation_items
  FOR EACH ROW EXECUTE FUNCTION sync_qtrib_to_quantity();

-- Criar trigger para manter v_un_trib sincronizado com unit_price (order_items)
CREATE OR REPLACE FUNCTION sync_v_un_trib_to_unit_price()
RETURNS TRIGGER AS $$
BEGIN
  NEW.v_un_trib = NEW.unit_price;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_sync_v_un_trib_order_items
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION sync_v_un_trib_to_unit_price();

-- Criar trigger para manter v_un_trib sincronizado com unit_price (quotation_items)
CREATE TRIGGER trigger_sync_v_un_trib_quotation_items
  BEFORE INSERT OR UPDATE ON public.quotation_items
  FOR EACH ROW EXECUTE FUNCTION sync_v_un_trib_to_unit_price();

-- Atualizar registros existentes (order_items)
UPDATE public.order_items
SET qtrib = quantity,
    v_un_trib = unit_price
WHERE qtrib IS NULL OR v_un_trib IS NULL;

-- Atualizar registros existentes (quotation_items)
UPDATE public.quotation_items
SET qtrib = quantity,
    v_un_trib = unit_price
WHERE qtrib IS NULL OR v_un_trib IS NULL;
