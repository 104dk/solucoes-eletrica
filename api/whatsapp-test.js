// =============================================
// SOLUCOES ELETRICA - Validar conexao WhatsApp (Meta)
//
// POST /api/whatsapp-test - valida Access Token (debug_token) e
//                           Phone Number ID; grava status conectado/pendente.
//
// Auth: exige token JWT valido + perfil admin/super (requireAdmin).
// =============================================

import { GRAPH_URL, loadConfig, updateConfigStatus } from './_lib/whatsapp.js';
import { requireAdmin } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    await requireAdmin(req);

    const cfg = await loadConfig();
    if (!cfg.accessToken || !cfg.phoneNumberId) {
      res.status(200).json({
        ok: false,
        message: 'Preencha o Access Token e o Phone Number ID e salve antes de validar.'
      });
      return;
    }

    const version = cfg.graphApiVersion || 'v25.0';

    // Valida o token (debug_token)
    const tokenRes = await fetch(
      GRAPH_URL + '/' + version + '/debug_token' +
      '?input_token=' + encodeURIComponent(cfg.accessToken) +
      '&access_token=' + encodeURIComponent(cfg.accessToken)
    );
    const tokenData = await tokenRes.json();
    const tokenValid = !!(tokenRes.ok && tokenData && tokenData.data && tokenData.data.is_valid);
    const scopes = (tokenData && tokenData.data && tokenData.data.granular_scopes) || [];

    // Valida o numero
    let phoneData = null;
    let phoneValid = false;
    if (tokenValid) {
      const phoneRes = await fetch(
        GRAPH_URL + '/' + version + '/' + cfg.phoneNumberId +
        '?fields=display_phone_number,verified_name,code_verification_status' +
        '&access_token=' + encodeURIComponent(cfg.accessToken)
      );
      phoneData = await phoneRes.json();
      phoneValid = !!(phoneRes.ok && phoneData && phoneData.display_phone_number);
    }

    const conectado = tokenValid && phoneValid;
    await updateConfigStatus(conectado ? 'conectado' : 'pendente');

    res.status(200).json({
      ok: conectado,
      token_valid: tokenValid,
      phone_valid: phoneValid,
      permissions: scopes,
      phone: phoneValid ? phoneData : null,
      message: conectado
        ? 'Conexao validada com sucesso.'
        : (tokenValid
            ? 'Token valido, mas o numero nao foi encontrado ou o token nao tem acesso a ele.'
            : 'Access Token invalido ou expirado.')
    });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
