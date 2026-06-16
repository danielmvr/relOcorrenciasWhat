-- =====================================================================
-- Migration 04 - "Finalizar S.O.S. Passageiros"
-- Rode no Supabase: SQL Editor > New query > cole tudo > Run.
--   socorro_em = momento em que o S.O.S. de passageiros foi concluido
--                (o cronometro congela aqui; o termino fica gravado neste horario)
-- =====================================================================
alter table public.ocorrencias
  add column if not exists socorro_em timestamptz;
