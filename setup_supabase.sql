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
-- Apenas admin/super (profiles) ou nv2/nv3 (usuarios_acesso) tem escrita.
-- Leitura publica permanece apenas onde necessario.
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_acesso ENABLE ROW LEVEL SECURITY;

-- Funcao auxiliar de admin (usada nas policies)
CREATE OR REPLACE FUNCTION is_admin_or_super()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (role IN ('admin','super')) FROM profiles WHERE id = auth.uid()),
    (SELECT (nivel IN ('nv2','nv3'))
       FROM usuarios_acesso
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())),
    false
  );
$$;

-- profiles: SELECT proprio ou admin; escrita somente admin
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR is_admin_or_super());
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_super());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated
  USING (is_admin_or_super()) WITH CHECK (is_admin_or_super());
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO authenticated
  USING (is_admin_or_super());

-- pedidos: insert publico (formulario gelomix.html); leitura/escrita admin
CREATE POLICY "pedidos_insert_public" ON pedidos FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "pedidos_select_admin" ON pedidos FOR SELECT TO authenticated
  USING (is_admin_or_super());
CREATE POLICY "pedidos_update_admin" ON pedidos FOR UPDATE TO authenticated
  USING (is_admin_or_super()) WITH CHECK (is_admin_or_super());
CREATE POLICY "pedidos_delete_admin" ON pedidos FOR DELETE TO authenticated
  USING (is_admin_or_super());

-- clientes / produtos / rotas: somente admin
CREATE POLICY "clientes_all_admin" ON clientes FOR ALL TO authenticated
  USING (is_admin_or_super()) WITH CHECK (is_admin_or_super());
CREATE POLICY "produtos_all_admin" ON produtos FOR ALL TO authenticated
  USING (is_admin_or_super()) WITH CHECK (is_admin_or_super());
CREATE POLICY "rotas_all_admin" ON rotas FOR ALL TO authenticated
  USING (is_admin_or_super()) WITH CHECK (is_admin_or_super());

-- configuracoes: leitura publica; escrita somente admin
CREATE POLICY "configuracoes_select_public" ON configuracoes FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "configuracoes_all_admin" ON configuracoes FOR ALL TO authenticated
  USING (is_admin_or_super()) WITH CHECK (is_admin_or_super());

-- usuarios_acesso: somente admin
CREATE POLICY "usuarios_acesso_all_admin" ON usuarios_acesso FOR ALL TO authenticated
  USING (is_admin_or_super()) WITH CHECK (is_admin_or_super());

-- Leitura publica (para o frontend carregar dados da empresa sem login)
GRANT SELECT ON configuracoes TO anon;

-- =============================================
-- PEDIDOS PAGINA PUBLICA (GELO MIX)
-- Clientes nao autenticados podem gravar pedidos
-- (formulario publico da gelomix.html)
-- =============================================
GRANT INSERT ON pedidos TO anon;

-- =============================================
-- WHATSAPP_CONFIG (single row, admin-only)
-- =============================================
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  graph_api_version TEXT DEFAULT 'v25.0',
  phone_number_id TEXT DEFAULT '',
  waba_id TEXT DEFAULT '',
  business_phone TEXT DEFAULT '',
  business_name TEXT DEFAULT '',
  admin_phone TEXT DEFAULT '',
  access_token TEXT DEFAULT '',
  app_secret TEXT DEFAULT '',
  verify_token TEXT DEFAULT '',
  webhook_url TEXT DEFAULT '',
  templates JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pendente',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_config_all_admin" ON whatsapp_config FOR ALL TO authenticated
  USING (is_admin_or_super()) WITH CHECK (is_admin_or_super());

GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_config TO authenticated;

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
