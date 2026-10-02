-- O saldo da cliente principal nunca era salvo — só valor_total,
-- valor_sinal e valor_sinal_profissional existiam como colunas, e o
-- saldo era sempre recalculado como total - sinal - sinal_profissional
-- toda vez que o compromisso era reaberto. Isso apagava silenciosamente
-- qualquer ajuste manual feito no campo de saldo (necessário em
-- atendimentos de grupo, onde o total do compromisso é da turma toda
-- mas o saldo da cliente principal é só a parte dela).
alter table eventos_calendario add column if not exists valor_saldo numeric;
