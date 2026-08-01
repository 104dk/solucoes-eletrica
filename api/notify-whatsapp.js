// =============================================
// SOLUCOES ELETRICA / GELO MIX - Notificacao WhatsApp
// Envia mensagem automatica via WhatsApp Cloud API (Meta).
//
// Env vars (configurar no Vercel):
//   WHATSAPP_TOKEN     - Access Token (System User) da conta WhatsApp Business
//   WHATSAPP_PHONE_ID  - Phone Number ID do numero do Gelo Mix
//
// Se as env vars nao estiverem configuradas, retorna { sent: false, reason: 'not_configured' }
// para o frontend acionar o fallback via link wa.me.
// =============================================

const GRAPH_URL = 'https://graph.facebook.com/v25.0';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ sent: false, reason: 'method_not_allowed' });
    return;
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    res.status(200).json({ sent: false, reason: 'not_configured' });
    return;
  }

  const { telefone, mensagem } = req.body || {};

  if (!telefone || !mensagem) {
    res.status(400).json({ sent: false, reason: 'invalid_payload' });
    return;
  }

  const to = normalizarTelefone(telefone);
  if (!to) {
    res.status(400).json({ sent: false, reason: 'invalid_phone' });
    return;
  }

  try {
    const response = await fetch(GRAPH_URL + '/' + phoneId + '/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
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
  } catch (err) {
    res.status(200).json({ sent: false, reason: 'exception', error: err.message });
  }
}

function normalizarTelefone(valor) {
  const digitos = String(valor || '').replace(/\D/g, '');
  if (!digitos) return null;
  if (digitos.length === 10 || digitos.length === 11) {
    return '55' + digitos;
  }
  if (digitos.length === 12 || digitos.length === 13) {
    return digitos.startsWith('55') ? digitos : '55' + digitos;
  }
  return digitos;
}
