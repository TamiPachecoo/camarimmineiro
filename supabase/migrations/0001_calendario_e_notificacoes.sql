-- ============================================================
-- Google Calendar (por perfil) + Notificações push
-- Aplicar com: supabase db push  (ou via apply_migration no MCP)
-- ============================================================

-- Tokens do Google, um por perfil (Tami / Stefania). Fica com RLS
-- ativado e SEM policies — só as Edge Functions (service role)
-- conseguem ler/escrever. O navegador nunca vê o refresh_token.
create table if not exists integracoes_google (
  perfil_id uuid primary key references perfis(id) on delete cascade,
  refresh_token text not null,
  calendar_id text not null default 'primary',
  email_google text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table integracoes_google enable row level security;

-- Inscrições de push (1 por dispositivo/navegador). Cada perfil pode
-- ter várias (celular + computador).
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid references perfis(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);
alter table push_subscriptions enable row level security;

-- App usa um único login compartilhado (Supabase Auth) + seleção de
-- perfil por PIN, então qualquer sessão autenticada pode gerenciar
-- suas próprias inscrições de push.
create policy "autenticados podem inserir suas inscrições"
  on push_subscriptions for insert
  to authenticated
  with check (true);

create policy "autenticados podem remover inscrições"
  on push_subscriptions for delete
  to authenticated
  using (true);

create policy "autenticados podem ver inscrições"
  on push_subscriptions for select
  to authenticated
  using (true);

-- Rastreio de sincronismo com Google Calendar + lembrete já enviado
alter table eventos_calendario
  add column if not exists google_event_id text,
  add column if not exists lembrete_enviado boolean not null default false;
