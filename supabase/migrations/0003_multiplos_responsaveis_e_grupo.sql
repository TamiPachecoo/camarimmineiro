-- Múltiplos profissionais num mesmo compromisso
alter table eventos_calendario add column if not exists responsaveis text[];
update eventos_calendario set responsaveis = array[responsavel_nome] where responsavel_nome is not null and responsaveis is null;

-- Clientes adicionais no mesmo horário (atendimento em grupo), cada uma
-- com seu próprio valor cobrado
create table if not exists evento_participantes (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos_calendario(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete cascade,
  valor numeric not null default 0,
  pago boolean not null default false,
  metodo_pagamento text check (metodo_pagamento = ANY (ARRAY['pix'::text, 'transferencia'::text, 'dinheiro'::text, 'cartao'::text])),
  criado_em timestamptz not null default now()
);
alter table evento_participantes enable row level security;
create policy "acesso_total_autenticado" on evento_participantes for all to public
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Um compromisso pode agora sincronizar com o Google Calendar de mais de
-- um profissional, então o id do evento no Google precisa ser por perfil.
alter table eventos_calendario add column if not exists google_event_ids jsonb not null default '{}'::jsonb;
