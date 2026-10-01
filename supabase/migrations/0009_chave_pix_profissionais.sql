-- Chave Pix de cada profissional (Tami/Stefania e freelancers
-- recorrentes), pra ter à mão na hora de repassar o sinal/saldo que é
-- dela. "Recorrente" marca quem trabalha com a gente com frequência
-- (só essas precisam de chave Pix cadastrada).
alter table perfis add column if not exists chave_pix text;
alter table profissionais_externos
  add column if not exists recorrente boolean not null default false,
  add column if not exists chave_pix text;
