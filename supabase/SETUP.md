# Setup — Google Calendar + Notificações push

Checklist para ativar o que já está no código. Nada disto roda sozinho até
estes passos serem feitos — o app funciona normalmente sem eles.

## 1. Banco de dados

```
supabase link --project-ref llhccvbovuzifsikvekz
supabase db push
```

(ou aplicar `supabase/migrations/0001_calendario_e_notificacoes.sql` direto
pelo SQL Editor do painel Supabase / pelo MCP com `apply_migration`).

## 2. Google Cloud — credenciais OAuth

1. https://console.cloud.google.com → criar (ou reaproveitar) um projeto.
2. **APIs e serviços → Biblioteca** → ativar "Google Calendar API".
3. **APIs e serviços → Tela de consentimento OAuth**: tipo "Externo", modo
   "Teste" é suficiente (só Tami e Stefania vão logar), adicionar os dois
   e-mails do Google como usuários de teste.
4. **APIs e serviços → Credenciais → Criar credenciais → ID do cliente
   OAuth**, tipo "Aplicativo da Web".
   - URI de redirecionamento autorizado:
     `https://llhccvbovuzifsikvekz.supabase.co/functions/v1/google-oauth-callback`
5. Copiar o **Client ID** e o **Client Secret**.

## 3. Deploy das Edge Functions + segredos

```
supabase functions deploy google-oauth-callback google-freebusy google-sync-event send-notification reminder-cron

supabase secrets set \
  GOOGLE_CLIENT_ID=xxx \
  GOOGLE_CLIENT_SECRET=xxx \
  APP_URL_SUCESSO=https://SEU-DOMINIO/integracoes.html?google=ok \
  APP_URL_ERRO=https://SEU-DOMINIO/integracoes.html?google=erro \
  VAPID_PUBLIC_KEY=BCCqcyl2oLJf3hE0rNNlg-i-eWuSFLwDN9D3OZ9Gay3N6J7Ki4yJqVOfJYeAtGnM4rDSBq4KQhNUz1VL_maymEs \
  VAPID_PRIVATE_KEY=xxx \
  VAPID_SUBJECT=mailto:pachecootami@gmail.com
```

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem automaticamente em
toda Edge Function — não precisa configurar.

A `VAPID_PRIVATE_KEY` foi gerada e entregue à parte (não fica em nenhum
arquivo do repositório). `VAPID_PUBLIC_KEY` já está hardcoded em
`integracoes.html` porque é uma chave pública — não é segredo.

## 4. Frontend

Editar `integracoes.html` e preencher `GOOGLE_CLIENT_ID` (linha perto do
topo do `<script>`) com o Client ID do passo 2.

## 5. Notificações automáticas (Database Webhooks)

Painel Supabase → **Database → Webhooks → Create a new hook**:

- Hook 1: tabela `eventos_calendario`, evento `INSERT` → HTTP request para
  `https://llhccvbovuzifsikvekz.supabase.co/functions/v1/send-notification`
  (header `Authorization: Bearer <anon key>`).
- Hook 2: tabela `clientes`, evento `UPDATE` → mesma URL.

## 6. Lembrete do dia anterior (pg_cron)

Painel Supabase → **Database → Extensions** → ativar `pg_cron` e `pg_net`.
Depois, no SQL Editor:

```sql
select cron.schedule(
  'lembrete-compromissos',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := 'https://llhccvbovuzifsikvekz.supabase.co/functions/v1/reminder-cron',
    headers := jsonb_build_object('Authorization', 'Bearer ANON_KEY_AQUI')
  );
  $$
);
```

## 7. Testar

1. Em `integracoes.html`, clicar "Conectar" no perfil e autorizar no Google.
2. Voltar deve mostrar o toast "Google Calendar conectado!".
3. Clicar "Ativar notificações neste dispositivo" e aceitar a permissão do
   navegador.
4. Criar um compromisso na Agenda com esse profissional como responsável →
   deve aparecer no Google Calendar dela e disparar uma notificação.
5. Em "Verificar disponibilidade" na Agenda, marcar um horário que colida
   com algo já agendado (interno ou no Google) → deve mostrar o aviso.
