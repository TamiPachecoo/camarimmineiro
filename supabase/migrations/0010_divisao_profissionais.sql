-- Quando mais de uma profissional atende o mesmo compromisso, o valor
-- devido a cada uma nem sempre é 50/50 (uma pode ter feito mais do
-- trabalho que a outra). Esta tabela guarda, por compromisso, quanto
-- cada profissional responsável deve receber — editável na agenda,
-- usado como projeção/fechamento no financeiro em vez de uma divisão
-- igualitária automática.
create table if not exists evento_profissionais_valores (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos_calendario(id) on delete cascade,
  profissional_nome text not null,
  valor numeric not null default 0,
  criado_em timestamptz not null default now(),
  unique (evento_id, profissional_nome)
);
alter table evento_profissionais_valores enable row level security;
create policy "acesso_total_autenticado" on evento_profissionais_valores for all to public
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
