-- Despesas gerais da empresa (produtos, deslocamento, assistente
-- freelancer avulsa, equipamento, marketing, outros) — pra ter a
-- visão completa da saúde financeira, não só o que entra. Separado do
-- MEI de propósito: o MEI não desconta despesa nenhuma (é regime de
-- valor fixo), mas pra entender o lucro de verdade do negócio,
-- despesa importa. (Esta tabela já existia no banco; migração aqui só
-- documenta a estrutura no repositório.)
create table if not exists despesas (
  id uuid primary key default gen_random_uuid(),
  categoria text not null default 'outro'
    check (categoria = any (array['produtos'::text, 'deslocamento'::text, 'assistente'::text, 'equipamento'::text, 'marketing'::text, 'outro'::text])),
  valor numeric not null,
  data_despesa date not null default current_date,
  cliente_id uuid references clientes(id) on delete set null,
  observacoes text,
  criado_por uuid references perfis(id),
  criado_em timestamptz not null default now()
);
alter table despesas enable row level security;
create policy if not exists "acesso_total_autenticado" on despesas for all to public
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Repasse: quando o dinheiro de um atendimento (grupo/diária/noiva)
-- entra pela empresa e precisa ser transferido depois pra cada
-- profissional, isso é uma saída de caixa — mas só conta como "paga"
-- quando a transferência realmente aconteceu, não quando o valor é só
-- combinado (que é o que evento_profissionais_valores já guardava).
alter table evento_profissionais_valores add column if not exists pago boolean not null default false;
alter table evento_profissionais_valores add column if not exists data_pagamento date;
alter table evento_profissionais_valores add column if not exists metodo_pagamento text check (metodo_pagamento = any (array['pix'::text, 'transferencia'::text, 'dinheiro'::text, 'cartao'::text]));
