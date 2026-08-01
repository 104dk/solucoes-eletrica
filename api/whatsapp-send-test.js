// =============================================
// SOLUCOES ELETRICA - Envio teste de WhatsApp
//
// POST /api/whatsapp-send-test - envia mensagem de texto livre
//                                para um destino (teste do painel).
//
// Auth: exige token JWT valido + perfil admin/super (requireAdmin).
// =============================================

import { GRAPH_URL, loadConfig, normalizarTelefone } from './_lib/whatsapp.js';
import { requireAdmin } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ sent: false, reason: 'method_not_allowed' });
    return;
  }

  try {
    await requireAdmin(req);

    const cfg = await loadConfig();
    if (!cfg.accessToken || !cfg.phoneNumberId) {
      res.status(200).json({ sent: false, reason: 'not_configured' });
      return;
    }

    let body = {};
    try { body = JSON.parse(req.body || '{}'); } catch (e) { body = {}; }

    const { telefone, mensagem } = body;
    if (!telefone || !mensagem) {
      res.status(400).json({ sent: false, reason: 'invalid_payload' });
      return;
    }

    const to = normalizarTelefone(telefone);
    if (!to) {
      res.status(400).json({ sent: false, reason: 'invalid_phone' });
      return;
    }

    const version = cfg.graphApiVersion || 'v25.0';
    const response = await fetch(GRAPH_URL + '/' + version + '/' + cfg.phoneNumberId + '/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.accessToken
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: String(mensagem).slice(0, 1024) }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(200).json({ sent: false, reason: 'whatsapp_error', error: data.error || data });
      return;
    }

    res.status(200).json({ sent: true, data: data });
  } catch (e) {
    res.status(200).json({ sent: false, reason: 'exception', error: e.message });
  }
}
