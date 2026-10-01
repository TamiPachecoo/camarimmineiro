-- "Sinal" vira dois valores: um pro negócio (destino já existente) e
-- um que vai direto pra profissional — além do saldo final (também
-- direto pra profissional, pago no dia). Três valores rastreados por
-- compromisso/participante, em vez de dois.
alter table pagamentos drop constraint pagamentos_tipo_check;
alter table pagamentos add constraint pagamentos_tipo_check
  check (tipo = ANY (ARRAY['sinal'::text, 'sinal_profissional'::text, 'parcela'::text, 'saldo_final'::text, 'integral'::text]));

alter table eventos_calendario
  add column if not exists valor_sinal_profissional numeric,
  add column if not exists sinal_profissional_pago boolean not null default false,
  add column if not exists sinal_profissional_metodo text check (sinal_profissional_metodo = ANY (ARRAY['pix'::text, 'transferencia'::text, 'dinheiro'::text, 'cartao'::text]));

alter table evento_participantes
  add column if not exists valor_sinal_profissional numeric not null default 0,
  add column if not exists sinal_profissional_pago boolean not null default false,
  add column if not exists sinal_profissional_metodo text check (sinal_profissional_metodo = ANY (ARRAY['pix'::text, 'transferencia'::text, 'dinheiro'::text, 'cartao'::text]));
