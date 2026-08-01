-- =============================================
-- SOLUCOES ELETRICA - TABELAS SUPABASE
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- =============================================

-- Tabela de perfis (estende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT now()
);

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
  cep TEXT,
  email TEXT,
  endereco TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Adiciona CEP em bancos criados antes desta versao do script
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cep TEXT;

-- Produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
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

-- Usuarios autorizados no painel administrativo
CREATE TABLE IF NOT EXISTS usuarios_acesso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  nivel TEXT DEFAULT 'nv1' CHECK (nivel IN ('nv1', 'nv2', 'nv3')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- RLS (Row Level Security)
--
-- O check de admin e feito no frontend (verificarSessao no admin.html).
-- Qualquer usuario autenticado tem acesso total as tabelas.
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_acesso ENABLE ROW LEVEL SECURITY;

-- Policies simplificadas: qualquer autenticado tem CRUD
CREATE POLICY "profiles_auth" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pedidos_auth" ON pedidos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "clientes_auth" ON clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "produtos_auth" ON produtos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rotas_auth" ON rotas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "configuracoes_auth" ON configuracoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "usuarios_acesso_auth" ON usuarios_acesso FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Leitura publica (para o frontend carregar dados da empresa sem login)
GRANT SELECT ON configuracoes TO anon;

-- =============================================
-- PEDIDOS PAGINA PUBLICA (GELO MIX)
-- Clientes nao autenticados podem gravar pedidos
-- (formulario publico da gelomix.html)
-- =============================================
CREATE POLICY "pedidos_public_insert" ON pedidos FOR INSERT TO anon WITH CHECK (true);
GRANT INSERT ON pedidos TO anon;

-- =============================================
-- GRANTS (expor tabelas via API)
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pedidos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON clientes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON produtos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rotas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON configuracoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON usuarios_acesso TO authenticated;

-- =============================================
-- INDEXES para performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(data);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes(chave);
CREATE INDEX IF NOT EXISTS idx_usuarios_acesso_email ON usuarios_acesso(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_acesso_nivel ON usuarios_acesso(nivel);
