-- Tabela de responsável técnico para NFe
-- Armazena os dados do responsável técnico que assina a NFe

CREATE TABLE IF NOT EXISTS nfe_technical_responsible (
  id VARCHAR(255) PRIMARY KEY,
  cnpj VARCHAR(20) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_nfe_technical_responsible_active ON nfe_technical_responsible(active);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_nfe_technical_responsible_updated_at BEFORE UPDATE ON nfe_technical_responsible
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
