-- Tabela de orçamentos
CREATE TABLE IF NOT EXISTS quotations (
  id bigint generated always as identity primary key,
  user_id VARCHAR(255),
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  client_id VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_cnpj VARCHAR(20) NOT NULL,
  client_salesperson_id VARCHAR(255),
  client_salesperson_name VARCHAR(255),
  unit_id VARCHAR(255) NOT NULL,
  unit_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
  observation TEXT,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens do orçamento
CREATE TABLE IF NOT EXISTS quotation_items (
  id bigint generated always as identity primary key,
  quotation_id bigint NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_code VARCHAR(50),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_quotations_unit_id ON quotations(unit_id);
CREATE INDEX IF NOT EXISTS idx_quotations_client_id ON quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_product_id ON quotation_items(product_id);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
