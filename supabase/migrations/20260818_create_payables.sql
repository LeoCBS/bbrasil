-- Tabela de contas a pagar
CREATE TABLE IF NOT EXISTS payables (
  id bigint generated always as identity primary key,
  supplier_name VARCHAR(255) NOT NULL,
  supplier_cnpj VARCHAR(20),
  supplier_address TEXT,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  payment_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  category VARCHAR(100),
  payment_method VARCHAR(50),
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
CREATE INDEX IF NOT EXISTS idx_payables_supplier_name ON payables(supplier_name);
CREATE INDEX IF NOT EXISTS idx_payables_status ON payables(status);
CREATE INDEX IF NOT EXISTS idx_payables_due_date ON payables(due_date);
CREATE INDEX IF NOT EXISTS idx_payables_unit_id ON payables(unit_id);
CREATE INDEX IF NOT EXISTS idx_payables_category ON payables(category);
CREATE INDEX IF NOT EXISTS idx_payables_created_at ON payables(created_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_payables_updated_at BEFORE UPDATE ON payables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
