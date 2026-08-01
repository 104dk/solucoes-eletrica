// =============================================
// SOLUCOES ELETRICA / GELO MIX - Webhook WhatsApp Cloud API (Meta)
// Recebe notificacoes de mensagens recebidas e atualizacoes de status.
//
// Env var (configurar no Vercel):
//   WHATSAPP_VERIFY_TOKEN - segredo compartilhado com a Meta (verificacao do webhook)
//
// GET  /api/whatsapp-webhook - handshake de verificacao (retorna hub.challenge)
// POST /api/whatsapp-webhook - eventos (messages, message_statuses); responde 200 na hora
// =============================================

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const validToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && validToken && token === validToken && challenge) {
      res.status(200).send(challenge);
      return;
    }
    res.status(403).json({ error: 'Token de verificacao invalido' });
    return;
  }

  if (req.method === 'POST') {
    let body = {};
    try { body = JSON.parse(req.body || '{}'); } catch (e) { body = {}; }
    console.log('[WhatsApp Webhook]', JSON.stringify(body).slice(0, 2000));
    res.status(200).json({ received: true });
    return;
  }

  res.status(405).json({ error: 'method_not_allowed' });
}
