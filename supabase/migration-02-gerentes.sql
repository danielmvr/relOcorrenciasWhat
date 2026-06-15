-- =====================================================================
-- Migration 02 - Cadastro de Gerentes Regionais (com telefone)
-- Rode no Supabase: SQL Editor > New query > cole tudo > Run.
-- (Seu projeto ja tem a tabela ocorrencias; isto apenas acrescenta gerentes.)
-- =====================================================================

create table if not exists public.gerentes (
  nome     text primary key,
  telefone text default ''
);

-- Acesso liberado ao papel anon (sem login, igual ao restante)
alter table public.gerentes enable row level security;
drop policy if exists "gerentes_anon_total" on public.gerentes;
create policy "gerentes_anon_total" on public.gerentes
  for all to anon using (true) with check (true);

-- Gerentes do mapa de coordenacao (telefone em branco para preencher no app)
insert into public.gerentes (nome) values
  ('Carlos Passos'), ('EXPRESSO GUANABARA'), ('Jose Anderson'), ('Junior'),
  ('Miguel'), ('Mozart'), ('Nathan'), ('Nelio'), ('Thiago'), ('Vicente'), ('Zerbato')
on conflict (nome) do nothing;
