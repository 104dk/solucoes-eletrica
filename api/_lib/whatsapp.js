// =============================================
// SOLUCOES ELETRICA - WhatsApp Cloud API (Meta)
// Configuracao vem da tabela whatsapp_config (primeiro) com
// fallback para as env vars (WHATSAPP_TOKEN, WHATSAPP_PHONE_ID).
// =============================================

import { SUPABASE_URL, headers } from './supabase.js';

export const GRAPH_URL = 'https://graph.facebook.com';

export const CAMPOS_CONFIG = [
  'graph_api_version',
  'phone_number_id',
  'waba_id',
  'business_phone',
  'business_name',
  'admin_phone',
  'access_token',
  'app_secret',
  'verify_token',
  'webhook_url',
  'templates',
  'status'
];

export const TEMPLATES_DEFAULT = {
  pedido_confirmado: 'Olá {{nome}}! 🧊\nSeu pedido na Gelo Mix foi CONFIRMADO:\n{{resumo}}\nTotal: {{total}}\nNossa equipe entrará em contato para combinar a entrega. Obrigado!',
  lembrete_pedido: 'Olá {{nome}}! 🧊\nLembrete do seu pedido na Gelo Mix:\n{{resumo}}\nTotal: {{total}}\nQualquer dúvida, estamos à disposição.',
  pedido_cancelado: 'Olá {{nome}}! 🧊\nSeu pedido na Gelo Mix foi CANCELADO:\n{{resumo}}\nSe precisar de algo, é só chamar. Obrigado!',
  pagamento_pendente: 'Olá {{nome}}! 🧊\nO pagamento do seu pedido na Gelo Mix está PENDENTE:\n{{resumo}}\nTotal: {{total}}\nRealize o pagamento para confirmarmos a entrega. Obrigado!'
};

export async function getConfigRow() {
  if (!SUPABASE_URL) return null;
  const res = await fetch(
    SUPABASE_URL + '/rest/v1/whatsapp_config?select=*&limit=1&order=updated_at.desc',
    { headers: headers() }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  const row = (Array.isArray(rows) && rows[0]) || null;
  if (row && typeof row.templates === 'string') {
    try { row.templates = JSON.parse(row.templates); } catch (e) { row.templates = {}; }
  }
  return row;
}

export async function loadConfig() {
  let row = null;
  try { row = await getConfigRow(); } catch (e) { row = null; }
  return {
    graphApiVersion: (row && row.graph_api_version) || 'v25.0',
    phoneNumberId: (row && row.phone_number_id) || process.env.WHATSAPP_PHONE_ID || '',
    accessToken: (row && row.access_token) || process.env.WHATSAPP_TOKEN || '',
    verifyToken: (row && row.verify_token) || process.env.WHATSAPP_VERIFY_TOKEN || '',
    appSecret: (row && row.app_secret) || '',
    businessPhone: (row && row.business_phone) || '',
    adminPhone: (row && row.admin_phone) || '',
    templates: (row && row.templates) || {}
  };
}

export async function updateConfigStatus(status) {
  const row = await getConfigRow();
  if (!row || !row.id) return;
  try {
    await fetch(SUPABASE_URL + '/rest/v1/whatsapp_config?id=eq.' + row.id, {
      method: 'PATCH',
      headers: headers(true),
      body: JSON.stringify({ status: status, updated_at: new Date().toISOString() })
    });
  } catch (e) {
    // nao bloqueia a resposta da validacao
  }
}

export function normalizarTelefone(valor) {
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
