-- Remover o campo status da tabela orders
ALTER TABLE orders DROP COLUMN IF EXISTS status;

-- Remover o check constraint de status (se existir)
-- Nota: Dependendo da versão do PostgreSQL, pode precisar remover a constraint primeiro
-- DROP CONSTRAINT IF EXISTS orders_status_check
