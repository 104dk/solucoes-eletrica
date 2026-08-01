// =============================================
// SOLUCOES ELETRICA - Cliente Supabase (service role)
// Usado pelas serverless functions (Vercel).
// NUNCA expor SERVICE_KEY no frontend.
//
// Env vars (configurar no Vercel):
//   SUPABASE_URL              - URL do projeto
//   SUPABASE_SERVICE_ROLE_KEY - Service Role Key (bypassa RLS)
// =============================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export { SUPABASE_URL, SERVICE_KEY };

export function headers(comBody) {
  return {
    apikey: SERVICE_KEY,
    Authorization: 'Bearer ' + SERVICE_KEY,
    ...(comBody ? { 'Content-Type': 'application/json' } : {})
  };
}
