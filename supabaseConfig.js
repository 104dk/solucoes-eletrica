// =============================================
// SOLUCOES ELETRICA - Configuracao Compartilhada
// =============================================

var SE_CONFIG = {
  SUPABASE_URL: 'https://hamsvtciocwsfrmrsphk.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhbXN2dGNpb2N3c2ZybXJzcGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTU5MDUsImV4cCI6MjEwMDc3MTkwNX0.yK_O98XfvQhwEc6S90j2ZjDmE2jrdQSN2-BEWnmaraw',
  APP_VERSION: '1.0.0'
};

var supabaseClient = window.supabase.createClient(SE_CONFIG.SUPABASE_URL, SE_CONFIG.SUPABASE_ANON_KEY);

// =============================================
// Utilitarios Compartilhados
// =============================================

function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function showToast(message, type) {
  type = type || 'success';
  var existing = document.querySelector('.se-toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'se-toast se-toast-' + type;
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;padding:14px 24px;border-radius:12px;font-size:0.9rem;font-weight:600;font-family:Inter,sans-serif;animation:toastIn .3s ease;box-shadow:0 4px 20px rgba(0,0,0,0.15);' +
    (type === 'success' ? 'background:#065f46;color:#d1fae5;' :
     type === 'error' ? 'background:#991b1b;color:#fee2e5;' :
     'background:#1e40af;color:#dbeafe;');

  document.body.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity .3s';
    setTimeout(function() { toast.remove(); }, 300);
  }, 3000);
}

function debounce(fn, delay) {
  var timer;
  return function() {
    var args = arguments;
    var ctx = this;
    clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
  };
}
