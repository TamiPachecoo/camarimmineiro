-- Cada cliente adicional no grupo passa a ter sinal e saldo próprios e
-- editáveis (igual à cliente principal), em vez de um único "valor
-- cobrado" genérico — o depósito por pessoa raramente é 20% do total.
alter table evento_participantes
  drop column if exists valor,
  drop column if exists pago,
  drop column if exists metodo_pagamento;

alter table evento_participantes
  add column if not exists valor_sinal numeric not null default 0,
  add column if not exists sinal_pago boolean not null default false,
  add column if not exists sinal_metodo text check (sinal_metodo = ANY (ARRAY['pix'::text, 'transferencia'::text, 'dinheiro'::text, 'cartao'::text])),
  add column if not exists valor_saldo numeric not null default 0,
  add column if not exists saldo_pago boolean not null default false,
  add column if not exists saldo_metodo text check (saldo_metodo = ANY (ARRAY['pix'::text, 'transferencia'::text, 'dinheiro'::text, 'cartao'::text]));
