// =============================================
// SOLUCOES ELETRICA - Autenticacao server-side
// Exige um token JWT valido do Supabase Auth + perfil admin/super.
// Utilizado pelos endpoints administrativos (Vercel).
// =============================================

import { SUPABASE_URL, SERVICE_KEY, headers } from './supabase.js';

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function getToken(req) {
  const h = req.headers || {};
  const auth = h.authorization || h.Authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  return m ? m[1].trim() : null;
}

// Valida o token e retorna o usuario; lanca 401/403 caso invalido/sem permissao.
export async function requireAdmin(req) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw httpError(500, 'supabase_not_configured');
  }
  const token = getToken(req);
  if (!token) {
    throw httpError(401, 'unauthorized');
  }
  const userRes = await fetch(SUPABASE_URL + '/auth/v1/user', {
    headers: { apikey: SERVICE_KEY, Authorization: 'Bearer ' + token }
  });
  if (!userRes.ok) {
    throw httpError(401, 'unauthorized');
  }
  const user = await userRes.json();
  if (!user || !user.id) {
    throw httpError(401, 'unauthorized');
  }
  if (!(await ehAdmin(user))) {
    throw httpError(403, 'forbidden');
  }
  return user;
}

async function ehAdmin(user) {
  try {
    const profileRes = await fetch(SUPABASE_URL + '/rest/v1/profiles?select=role&id=eq.' + user.id, {
      headers: headers()
    });
    if (profileRes.ok) {
      const rows = await profileRes.json();
      if (rows && rows[0] && (rows[0].role === 'admin' || rows[0].role === 'super')) {
        return true;
      }
    }
    if (user.email) {
      const acessoRes = await fetch(
        SUPABASE_URL + '/rest/v1/usuarios_acesso?select=nivel&email=eq.' + encodeURIComponent(user.email),
        { headers: headers() }
      );
      if (acessoRes.ok) {
        const arows = await acessoRes.json();
        if (arows && arows[0] && (arows[0].nivel === 'nv2' || arows[0].nivel === 'nv3')) {
          return true;
        }
      }
    }
  } catch (e) {
    // cai para nao-admin
  }
  return false;
}
