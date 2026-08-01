// =============================================
// SOLUCOES ELETRICA - Envio em lote de WhatsApp
//
// POST /api/whatsapp-send-bulk - envia uma mensagem de texto
//   para varios destinos (lote). Substitui {{nome}} por cliente.
//
// Body: { destinos: string[], mensagem: string, nomes: { telefone: nome } }
// Auth: exige token JWT valido + perfil admin/super (requireAdmin).
// =============================================

import { GRAPH_URL, loadConfig, normalizarTelefone } from './_lib/whatsapp.js';
import { requireAdmin } from './_lib/auth.js';

export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, reason: 'method_not_allowed' });
    return;
  }

  try {
    await requireAdmin(req);

    const cfg = await loadConfig();
    if (!cfg.accessToken || !cfg.phoneNumberId) {
      res.status(200).json({ ok: false, reason: 'not_configured' });
      return;
    }

    let body = {};
    try { body = JSON.parse(req.body || '{}'); } catch (e) { body = {}; }

    const destinosRaw = Array.isArray(body.destinos) ? body.destinos : [];
    const mensagem = String(body.mensagem || '').trim();
    const nomes = (body.nomes && typeof body.nomes === 'object') ? body.nomes : {};

    if (!destinosRaw.length || !mensagem) {
      res.status(400).json({ ok: false, reason: 'invalid_payload' });
      return;
    }

    const telefones = new Set();
    destinosRaw.forEach(function(t) {
      const n = normalizarTelefone(t);
      if (n) telefones.add(n);
    });
    const destinos = Array.from(telefones);
    if (!destinos.length) {
      res.status(200).json({ ok: false, reason: 'invalid_phone' });
      return;
    }

    const nomesPorTelefone = {};
    Object.keys(nomes).forEach(function(k) {
      const n = normalizarTelefone(k);
      if (n) nomesPorTelefone[n] = nomes[k];
    });

    const version = cfg.graphApiVersion || 'v25.0';
    const resultados = [];
    const falhas = [];
    let enviados = 0;

    for (const to of destinos) {
      const nome = nomesPorTelefone[to] || '';
      let corpo = mensagem;
      if (nome) corpo = corpo.replace(/\{\{\s*nome\s*\}\}/g, nome);
      corpo = String(corpo).slice(0, 1024);

      try {
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
            text: { body: corpo }
          })
        });
        const data = await response.json();
        if (response.ok) {
          enviados++;
          resultados.push({ telefone: to, ok: true });
        } else {
          const msg = (data && data.error) ? (data.error.message || JSON.stringify(data.error)) : JSON.stringify(data);
          falhas.push({ telefone: to, ok: false, erro: msg });
        }
      } catch (e) {
        falhas.push({ telefone: to, ok: false, erro: e.message });
      }
    }

    res.status(200).json({
      ok: true,
      total: destinos.length,
      enviados: enviados,
      falhas: falhas,
      resultados: resultados
    });
  } catch (e) {
    res.status(200).json({ ok: false, reason: 'exception', error: e.message });
  }
}
