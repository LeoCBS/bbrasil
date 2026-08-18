-- Adicionar campo order_id à tabela quotations para associar o pedido criado
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS order_id BIGINT;

-- Adicionar índice para melhorar performance de buscas por order_id
CREATE INDEX IF NOT EXISTS idx_quotations_order_id ON quotations(order_id);
