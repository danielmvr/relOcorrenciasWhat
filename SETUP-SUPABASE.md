# Modo compartilhado em tempo real (Supabase)

Por padrao o app roda em **modo local** (dados so no navegador). Seguindo os passos abaixo ele passa para o **modo compartilhado**: varios coordenadores veem o mesmo painel ao vivo, e cada abertura/alteracao/finalizacao aparece na hora para todos.

O que fica compartilhado: as **ocorrencias** (painel ao vivo + historico). Os cadastros (frota, localidades, pontos de apoio) continuam vindo do arquivo `assets/data.seed.js`, iguais para todos.

## Passo a passo

1. **Criar o projeto**
   Acesse supabase.com, crie uma conta e um projeto novo (escolha uma regiao no Brasil, ex.: South America - Sao Paulo). Guarde a senha do banco.

2. **Criar a tabela**
   No projeto: menu **SQL Editor > New query**. Cole todo o conteudo de `supabase/schema.sql` e clique em **Run**. Isso cria a tabela `ocorrencias`, habilita o tempo real e define o acesso.

3. **Pegar as chaves**
   Menu **Project Settings > API**. Copie:
   - **Project URL** (ex.: `https://abcxyz.supabase.co`)
   - **anon public** (a chave publica)

4. **Configurar o app**
   Abra `assets/supabase-config.js` e preencha:
   ```js
   window.SUPABASE_CONFIG = {
     url: "https://abcxyz.supabase.co",
     anonKey: "cole-a-chave-anon-aqui"
   };
   ```

5. **Distribuir**
   Coloque a pasta do app (com o `supabase-config.js` ja preenchido) onde os coordenadores acessam — pasta de rede, OneDrive compartilhado, ou um servidor web interno. Ao abrir o `index.html`, o rodape deve mostrar **"Tempo real"**. Todos que abrirem essa mesma versao veem e atualizam o mesmo painel ao vivo.

## Cadastro de gerentes (telefone)

Rode tambem `supabase/migration-02-gerentes.sql` (SQL Editor > Run). Isso cria a tabela `gerentes` e ja insere os nomes do mapa. Depois, em **Cadastros > Gerentes**, preencha os telefones — eles passam a aparecer no texto de WhatsApp das ocorrencias e vao alimentar os alertas automaticos na proxima etapa.

## Migrar o historico que ja existe (modo local)

Se voce ja usou em modo local e quer levar as ocorrencias para o compartilhado: no modo local, va em **Historico > Backup completo** (gera um JSON). Depois, com o app ja em modo compartilhado, use **Historico > Restaurar backup** e selecione esse JSON — os registros serao enviados ao Supabase.

## Seguranca (importante)

Este projeto foi configurado **sem login** (rede interna confiavel). Na pratica:

- Qualquer pessoa com a **URL + anon key** consegue ler e gravar ocorrencias. Trate esses dados como internos e nao publique o `supabase-config.js` fora da empresa.
- A policy de acesso esta em `supabase/schema.sql` (acesso liberado ao papel `anon`).
- Para travar depois, sem refazer o app: ativar o **Supabase Auth** (login) e trocar a policy para exigir usuario autenticado; ou restringir o acesso ao projeto por rede. Posso implementar o login quando quiser (era a opcao "Login simples por usuario").

## Voltar para o modo local

Basta deixar `url` e `anonKey` vazios em `assets/supabase-config.js`. O app volta a usar os dados do proprio navegador.

## Como funciona por dentro

- `assets/store.remote.js` mantem um cache em memoria das ocorrencias, sincronizado pelo **Realtime** do Supabase (mudancas de qualquer coordenador chegam na hora).
- As leituras continuam sincronas (a interface nao muda); as gravacoes sao otimistas (aparecem na hora e sao enviadas ao banco).
- `assets/store.boot.js` decide entre local e remoto conforme o `supabase-config.js`.
