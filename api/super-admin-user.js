// =============================================
// SOLUCOES ELETRICA - Gestao de senha de usuarios
// Altera a senha de um usuario do Supabase Auth (admin).
//
// Env vars (configurar no Vercel):
//   SUPABASE_URL                  - URL do projeto (ex: https://xxxx.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY     - Service Role Key (Supabase Dashboard > Settings > API)
//
// Auth: exige token JWT valido + perfil admin/super (requireAdmin).
// Se as env vars nao estiverem configuradas, retorna { configured: false }
// para o frontend acionar o fallback (envio de link de redefinicao).
// =============================================

import { requireAdmin } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    await requireAdmin(req);
  } catch (e) {
    res.status(e.status === 403 ? 403 : 401).json({
      error: e.status === 403
        ? 'Acesso negado: voce nao e administrador.'
        : 'Nao autorizado: faca login como administrador.'
    });
    return;
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    res.status(200).json({ configured: false, error: 'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nao configurados no Vercel.' });
    return;
  }

  let body = {};
  try {
    body = JSON.parse(req.body || '{}');
  } catch (e) {
    body = {};
  }

  const action = body.action;

  if (action === 'update_password') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha sao obrigatorios.' });
      return;
    }
    try {
      const listRes = await fetch(url + '/auth/v1/admin/users?per_page=1000', {
        headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey }
      });
      const listData = await listRes.json();
      if (!listRes.ok) {
        res.status(400).json({ error: listData.msg || listData.error_description || 'Erro ao listar usuarios.' });
        return;
      }
      const user = (listData.users || []).find(function(u) {
        return (u.email || '').toLowerCase() === email;
      });
      if (!user) {
        res.status(404).json({ error: 'Nenhum login encontrado para ' + email + '. Cadastre a senha ao registrar o usuario.' });
        return;
      }
      const updRes = await fetch(url + '/auth/v1/admin/users/' + user.id, {
        method: 'PUT',
        headers: {
          apikey: serviceKey,
          Authorization: 'Bearer ' + serviceKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: password })
      });
      const updData = await updRes.json();
      if (!updRes.ok) {
        res.status(400).json({ error: updData.msg || updData.error_description || 'Erro ao alterar a senha.' });
        return;
      }
      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  res.status(400).json({ error: 'Acao invalida: ' + action });
}
