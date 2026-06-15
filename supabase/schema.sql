-- =====================================================================
-- Fluxo de Ocorrencias - Schema do Supabase (Postgres)
-- Rode este script no Supabase: Dashboard > SQL Editor > New query > Run.
-- =====================================================================

-- Tabela principal (id gerado pelo app, em texto)
create table if not exists public.ocorrencias (
  id                     text primary key,
  status                 text not null default 'aberta',
  aberta_em              timestamptz not null default now(),
  finalizada_em          timestamptz,
  carro                  text,
  carro_segue            text,
  motorista              text,
  matricula              text,
  linha                  text,
  local_socorro          text,
  data_viagem            text,
  horario_viagem         text,
  qtd_clientes           text,
  encomendas             text,
  alimentacao_fornecida  text,
  defeito_motorista      text,
  responsavel_manutencao text,
  saida_socorro          text,
  gerente_regional       text,
  coordenador            text,
  obs                    text,
  regional               text,
  placa                  text,
  modelo                 text,
  capacidade             text,
  servico                text,
  data_ocorrencia        text,
  hora_quebra            text,
  inicio_em              timestamptz,
  termino_socorro        text,
  duracao_ms             bigint,
  eventos                jsonb not null default '[]'::jsonb,
  atualizado_em          timestamptz not null default now()
);

-- Indices uteis
create index if not exists idx_ocorrencias_status on public.ocorrencias (status);
create index if not exists idx_ocorrencias_aberta_em on public.ocorrencias (aberta_em);

-- Realtime: publica mudancas desta tabela para os clientes conectados
alter publication supabase_realtime add table public.ocorrencias;

-- =====================================================================
-- SEGURANCA: este projeto foi definido SEM login (rede interna confiavel).
-- A policy abaixo libera leitura/gravacao para o papel anon (chave anon).
-- ATENCAO: qualquer pessoa com a URL + anon key tem acesso total.
-- Para travar depois: troque por policies com auth (Supabase Auth) ou
-- restrinja o acesso por rede. Veja SETUP-SUPABASE.md.
-- =====================================================================
alter table public.ocorrencias enable row level security;

drop policy if exists "acesso_anon_total" on public.ocorrencias;
create policy "acesso_anon_total" on public.ocorrencias
  for all
  to anon
  using (true)
  with check (true);

-- Atualiza atualizado_em a cada UPDATE
create or replace function public.touch_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_atualizado_em on public.ocorrencias;
create trigger trg_touch_atualizado_em
  before update on public.ocorrencias
  for each row execute function public.touch_atualizado_em();

-- =====================================================================
-- Cadastro de Gerentes Regionais (compartilhado, com telefone)
-- =====================================================================
create table if not exists public.gerentes (
  nome     text primary key,
  telefone text default ''
);
alter table public.gerentes enable row level security;
drop policy if exists "gerentes_anon_total" on public.gerentes;
create policy "gerentes_anon_total" on public.gerentes
  for all to anon using (true) with check (true);
insert into public.gerentes (nome) values
  ('Carlos Passos'), ('EXPRESSO GUANABARA'), ('Jose Anderson'), ('Junior'),
  ('Miguel'), ('Mozart'), ('Nathan'), ('Nelio'), ('Thiago'), ('Vicente'), ('Zerbato')
on conflict (nome) do nothing;
