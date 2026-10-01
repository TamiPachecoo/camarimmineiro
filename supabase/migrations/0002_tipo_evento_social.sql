-- Adiciona "social" como tipo de compromisso (o mais comum no dia a dia,
-- diferente das provas/casamentos que são esporádicos).
alter table eventos_calendario drop constraint eventos_calendario_tipo_evento_check;
alter table eventos_calendario add constraint eventos_calendario_tipo_evento_check
  check (tipo_evento = ANY (ARRAY['social'::text, 'prova'::text, 'dia_casamento'::text, 'consulta'::text, 'outro'::text]));
