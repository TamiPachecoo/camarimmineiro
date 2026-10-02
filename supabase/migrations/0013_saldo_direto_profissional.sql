-- Antes, todo "saldo" (dinheiro do dia) e "sinal-profissional" eram
-- tratados como indo direto pra conta da profissional, sem passar pela
-- empresa. Na prática isso só é verdade pra atendimentos sociais
-- avulsos — em atendimentos de grupo, diárias e noivas, todo o
-- dinheiro (sinal e saldo) entra pela conta da empresa, que depois
-- repassa pra cada profissional. Esse campo deixa isso explícito por
-- compromisso, editável, em vez de adivinhado pelo tipo/título.
alter table eventos_calendario add column if not exists saldo_direto_profissional boolean not null default true;
