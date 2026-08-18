-- Tabela de contas a receber
CREATE TABLE IF NOT EXISTS receivables (
  id bigint generated always as identity primary key,
  order_id BIGINT,
  order_reference VARCHAR(50),
  client_id VARCHAR(255),
  client_name VARCHAR(255),
  client_cnpj VARCHAR(20),
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  payment_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  unit_id VARCHAR(255) NOT NULL,
  unit_name VARCHAR(255) NOT NULL,
  observation TEXT,
  user_id VARCHAR(255),
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_receivables_order_id ON receivables(order_id);
CREATE INDEX IF NOT EXISTS idx_receivables_client_id ON receivables(client_id);
CREATE INDEX IF NOT EXISTS idx_receivables_status ON receivables(status);
CREATE INDEX IF NOT EXISTS idx_receivables_due_date ON receivables(due_date);
CREATE INDEX IF NOT EXISTS idx_receivables_unit_id ON receivables(unit_id);
CREATE INDEX IF NOT EXISTS idx_receivables_created_at ON receivables(created_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_receivables_updated_at BEFORE UPDATE ON receivables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
