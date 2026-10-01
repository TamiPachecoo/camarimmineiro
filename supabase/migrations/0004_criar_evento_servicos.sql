-- A tabela evento_servicos nunca existia neste projeto, apesar do app já
-- usá-la para salvar/carregar os serviços marcados em cada compromisso —
-- por isso o checklist de serviços sempre aparecia vazio ao reabrir um
-- evento (o total em R$ era salvo direto em eventos_calendario, mas o
-- detalhamento por serviço se perdia).
create table if not exists evento_servicos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos_calendario(id) on delete cascade,
  servico_id uuid references servicos(id),
  nome_servico text,
  quantidade numeric not null default 1,
  valor_unitario numeric not null default 0,
  criado_em timestamptz not null default now()
);
alter table evento_servicos enable row level security;
create policy "acesso_total_autenticado" on evento_servicos for all to public
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
