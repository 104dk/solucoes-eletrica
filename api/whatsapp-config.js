// =============================================
// SOLUCOES ELETRICA - Configuracao WhatsApp (painel)
//
// GET  /api/whatsapp-config - retorna config salva (ou defaults)
// POST /api/whatsapp-config - grava/atualiza a config (single row)
//
// Auth: exige token JWT valido + perfil admin/super (requireAdmin).
// =============================================

import { SUPABASE_URL, headers } from './_lib/supabase.js';
import { requireAdmin } from './_lib/auth.js';
import { getConfigRow, CAMPOS_CONFIG, TEMPLATES_DEFAULT } from './_lib/whatsapp.js';

function defaults() {
  return {
    graph_api_version: 'v25.0',
    phone_number_id: '',
    waba_id: '',
    business_phone: '',
    business_name: '',
    admin_phone: '',
    access_token: '',
    app_secret: '',
    verify_token: '',
    webhook_url: '',
    templates: Object.assign({}, TEMPLATES_DEFAULT),
    status: 'pendente'
  };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await requireAdmin(req);
      const cfg = await getConfigRow();
      res.status(200).json({ ok: true, config: cfg || defaults() });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      await requireAdmin(req);
      let body = {};
      try { body = JSON.parse(req.body || '{}'); } catch (e) { body = {}; }

      const payload = {};
      CAMPOS_CONFIG.forEach(function (k) {
        if (body[k] !== undefined) payload[k] = body[k];
      });
      if (payload.templates && typeof payload.templates === 'object') {
        payload.templates = JSON.stringify(payload.templates);
      }
      payload.updated_at = new Date().toISOString();

      const existing = await getConfigRow();
      let resp;
      if (existing && existing.id) {
        resp = await fetch(SUPABASE_URL + '/rest/v1/whatsapp_config?id=eq.' + existing.id, {
          method: 'PATCH',
          headers: headers(true),
          body: JSON.stringify(payload)
        });
      } else {
        resp = await fetch(SUPABASE_URL + '/rest/v1/whatsapp_config', {
          method: 'POST',
          headers: headers(true),
          body: JSON.stringify(payload)
        });
      }

      if (!resp.ok) {
        const err = await resp.json().catch(function () { return {}; });
        res.status(400).json({ error: err.message || 'Erro ao salvar configuracao WhatsApp.' });
        return;
      }

      const cfg = await getConfigRow();
      res.status(200).json({ ok: true, config: cfg || defaults() });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
    return;
  }

  res.status(405).json({ error: 'method_not_allowed' });
}
