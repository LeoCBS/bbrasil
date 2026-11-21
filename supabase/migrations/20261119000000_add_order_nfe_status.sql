ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending';

-- Status legados descreviam o andamento do pedido, não a emissão da NF-e.
-- Não há como inferir que uma NF-e foi autorizada a partir de "confirmed".
UPDATE orders
SET status = 'pending'
WHERE status NOT IN ('pending', 'finalized', 'nfeerror');

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'finalized', 'nfeerror'));

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE OR REPLACE FUNCTION prevent_finalized_order_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'finalized' THEN
    RAISE EXCEPTION 'Pedidos finalizados não podem ser editados ou removidos.';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_prevent_finalized_changes ON orders;
CREATE TRIGGER orders_prevent_finalized_changes
  BEFORE UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION prevent_finalized_order_changes();
