# Changelog

Todas as mudanças relevantes do site (Soluções Elétrica / Gelo Mix) serão registradas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento é semântico (`X.Y.Z`). A versão atual é definida em `supabaseConfig.js` → `SE_CONFIG.APP_VERSION`.

## [1.0.0] - 2026-08-01

Baseline do projeto publicado.

### Adicionado
- Páginas públicas: `index.html` (Soluções Elétrica) e `gelomix.html` (Gelo Mix - pedidos de gelo).
- Painel administrativo `admin.html` com abas: Pedidos, Clientes, Produtos, Rotas, Pedidos Registrados, Configurações e Super Config.
- Seção **Gelo Mix** no painel: aba "Página Pública" (resumo/prévia do cardápio) e aba "Gelo - Config" (edição de WhatsApp, endereço e cardápio salvos na tabela `configuracoes`).
- Impressão de pedido em PDF (jsPDF) na lista de Pedidos Registrados.
- Seletor para alterar status do pedido (Pendente, Confirmado, Em andamento, Concluído, Cancelado).
- Gestão de senhas no Super Config: cadastrar usuário com senha, alterar senha e reenviar convite.
- Login por email/senha e Google OAuth, aceitando usuários registrados (nivel nv2/nv3 e role admin/super).
- Integração **WhatsApp Cloud API** (Meta):
  - Envio de notificação de pedido via `api/notify-whatsapp.js` (Graph API v25.0).
  - Webhook `api/whatsapp-webhook.js` para verificação e recebimento de eventos (`messages`, `message_statuses`).
  - Variáveis de ambiente no Vercel: `WHATSAPP_PHONE_ID`, `WHATSAPP_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Controle de versão: `APP_VERSION` em `supabaseConfig.js`, versão exibida nos rodapés e neste `CHANGELOG.md`.

### Corrigido
- Login recusava usuários registrados (nv2/nv3) no `index.html` e `gelomix.html`, inclusive via OAuth Google.
- Notificação WhatsApp usava Graph API `v21.0` (deprecada) → atualizada para `v25.0`.

---

## Como lançar uma nova versão (fluxo manual)

1. Atualize `SE_CONFIG.APP_VERSION` em `supabaseConfig.js`.
2. Adicione uma seção `[X.Y.Z] - YYYY-MM-DD` neste arquivo com as mudanças.
3. Commit: `git add -A && git commit -m "chore: bump vX.Y.Z"`
4. Deploy automático: `git push origin master`
5. Tag: `git tag -a vX.Y.Z -m "vX.Y.Z" && git push origin vX.Y.Z`

Rollback: "Instant Rollback" no dashboard da Vercel (deploy anterior) ou `git revert` do commit.
