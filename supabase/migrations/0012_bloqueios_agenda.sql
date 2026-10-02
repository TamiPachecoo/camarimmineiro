-- Dias/horários em que Tami ou Stefania não estão disponíveis (viagem,
-- compromisso pessoal, folga etc). Cada uma vê os bloqueios da outra
-- na agenda, pra não marcar atendimento em cima.
create table if not exists bloqueios_agenda (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references perfis(id) on delete cascade,
  data_inicio timestamptz not null,
  data_fim timestamptz not null,
  dia_inteiro boolean not null default true,
  motivo text,
  criado_por uuid references perfis(id) on delete set null,
  criado_em timestamptz not null default now()
);
alter table bloqueios_agenda enable row level security;
create policy "acesso_total_autenticado" on bloqueios_agenda for all to public
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
