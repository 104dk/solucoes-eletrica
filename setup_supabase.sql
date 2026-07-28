-- =============================================
-- SOLUCOES ELETRICA - TABELAS SUPABASE
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- =============================================

-- Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente TEXT NOT NULL,
  servico TEXT,
  valor DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'Pendente',
  data DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) DEFAULT 0,
  estoque INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rotas
CREATE TABLE IF NOT EXISTS rotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bairro TEXT NOT NULL,
  regiao TEXT,
  horario TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Configuracoes
CREATE TABLE IF NOT EXISTS configuracoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT UNIQUE NOT NULL,
  valor TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Policies para usuarios autenticados
CREATE POLICY "auth_all_pedidos" ON pedidos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all_clientes" ON clientes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all_produtos" ON produtos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all_rotas" ON rotas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all_configuracoes" ON configuracoes FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- GRANTS (expor tabelas via API)
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON pedidos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON clientes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON produtos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rotas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON configuracoes TO authenticated;

-- Acesso anon para leitura (opcional - para pagina publica)
GRANT SELECT ON pedidos TO anon;
GRANT SELECT ON clientes TO anon;
GRANT SELECT ON produtos TO anon;
GRANT SELECT ON rotas TO anon;
