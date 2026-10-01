-- Profissionais que ajudam em atendimentos mas não têm login no app
-- (freelancers, assistentes) — só nome + WhatsApp, pra poder marcá-los
-- como responsáveis num compromisso e mandar lembrete.
create table if not exists profissionais_externos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  whatsapp text,
  criado_em timestamptz not null default now()
);
alter table profissionais_externos enable row level security;
create policy "acesso_total_autenticado" on profissionais_externos for all to public
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
