-- =============================================
-- SOLUCOES ELETRICA - MIGRACAO: RLS restrito + tabela whatsapp_config
-- Execute este SQL no Supabase Dashboard > SQL Editor
--
-- 1) Restringe o RLS: apenas admin/super (profiles) ou nv2/nv3
--    (usuarios_acesso) tem acesso de escrita. Leitura publica permanece
--    apenas onde necessario (configuracoes e insert de pedidos).
-- 2) Cria a tabela whatsapp_config (single row) com RLS admin-only.
--
-- Idempotente: pode ser executado mais de uma vez.
-- =============================================

-- =============================================
-- 1) FUNCAO AUXILIAR DE ADMIN
-- =============================================
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

-- =============================================
-- 2) REMOVE POLICIES PERMISSIVAS ANTIGAS
-- =============================================
DROP POLICY IF EXISTS "profiles_auth" ON profiles;
DROP POLICY IF EXISTS "pedidos_auth" ON pedidos;
DROP POLICY IF EXISTS "clientes_auth" ON clientes;
DROP POLICY IF EXISTS "produtos_auth" ON produtos;
DROP POLICY IF EXISTS "rotas_auth" ON rotas;
DROP POLICY IF EXISTS "configuracoes_auth" ON configuracoes;
DROP POLICY IF EXISTS "usuarios_acesso_auth" ON usuarios_acesso;
DROP POLICY IF EXISTS "pedidos_public_insert" ON pedidos;

-- =============================================
-- 3) POLICIES RESTRITAS
-- =============================================

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

-- =============================================
-- 4) TABELA WHATSAPP_CONFIG (single row)
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
