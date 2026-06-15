-- =====================================================================
-- Migration 03 - Novos campos da ocorrencia
-- Rode no Supabase: SQL Editor > New query > cole tudo > Run.
-- (Acrescenta colunas a tabela ocorrencias ja existente.)
--   servico         = numero do servico (8 digitos, ou 8/8 para Double Deck)
--   data_ocorrencia = data da ocorrencia (texto yyyy-mm-dd)
--   hora_quebra     = hora da quebra (texto HH:MM) - base da contagem de tempo
--   inicio_em       = data+hora da quebra (timestamp; usado no cronometro)
--   termino_socorro = hora de finalizacao (texto HH:MM; preenchido ao finalizar)
-- =====================================================================

alter table public.ocorrencias
  add column if not exists servico         text,
  add column if not exists data_ocorrencia text,
  add column if not exists hora_quebra     text,
  add column if not exists inicio_em       timestamptz,
  add column if not exists termino_socorro text;
