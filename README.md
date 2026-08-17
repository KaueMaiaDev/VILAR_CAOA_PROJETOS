# Agente de Projetos by Vilar

Gestão inteligente de projetos e entregas: demandas, projetos, atividades (Kanban), responsáveis, calendário e relatórios.

Stack: React 19 + Vite no frontend, Express (como função serverless) no backend, PostgreSQL via [Supabase](https://supabase.com) como banco de dados, deploy na [Vercel](https://vercel.com).

## Rodando localmente

**Pré-requisitos:** Node.js 20+ e um projeto Supabase (gratuito) já criado.

1. Instale as dependências:
   ```
   npm install
   ```
2. Rode o schema `supabase/schema.sql` no seu projeto Supabase (Dashboard → SQL Editor → cole o conteúdo do arquivo → Run). Isso cria as tabelas, índices e o responsável padrão.
3. Copie `.env.example` para `.env` e preencha `DATABASE_URL` com a connection string do **Transaction pooler** do Supabase (Project Settings → Database → Connection string, porta `6543`).
4. Rode em modo desenvolvimento:
   ```
   npm run dev
   ```
   O app sobe em `http://localhost:3000`.

Para simular produção localmente:
```
npm run build
NODE_ENV=production npm start
```

## Banco de dados

Os dados ficam em um projeto Postgres gerenciado pelo Supabase. O schema (`supabase/schema.sql`) cria as tabelas `responsables`, `projetos`, `demandas`, `atividades`, `comentarios`, `anexos` e `historico`, com índices nas chaves estrangeiras/status e `ON DELETE CASCADE` entre projetos → atividades → comentários/anexos/histórico.

O servidor Express se conecta diretamente ao Postgres via `pg`, usando a role `postgres` (bypassa Row Level Security). RLS está habilitado em todas as tabelas sem policies — se a API REST automática do Supabase (PostgREST, chave anon) for usada no futuro, ela fica bloqueada por padrão, já que o browser nunca acessa o Supabase diretamente nesta aplicação.

## Deploy na Vercel

1. Crie um projeto no [Supabase](https://supabase.com/dashboard) e rode `supabase/schema.sql` (veja acima).
2. Importe este repositório na [Vercel](https://vercel.com/new). O `vercel.json` já configura o build (`vite build`, saída em `dist/`) e as rotas: `/api/*` vai para a função serverless em `api/index.ts`, e o restante cai no SPA (`index.html`).
3. Em **Project Settings → Environment Variables**, adicione:
   - `DATABASE_URL`: connection string do **Transaction pooler** do Supabase (porta `6543`) — necessária porque cada invocação da função serverless abre sua própria conexão, e o pgbouncer do Supabase foi feito para absorver esse padrão.
   - `ADMIN_RESET_TOKEN` (opcional): habilita `POST /api/reset-db` (apaga todos os dados e recria o responsável padrão) quando enviado no header `x-admin-token`. Deixe vazio para desabilitar o endpoint.
4. Deploy. A Vercel expõe uma URL pública (`https://<seu-projeto>.vercel.app`).

### Observação sobre rate limiting

O limite de requisições (`express-rate-limit`) usa armazenamento em memória por instância da função serverless — funciona bem para uso normal, mas não é um limite global exato sob alta concorrência com múltiplas instâncias frias. Para uma garantia mais forte, troque por um store compartilhado (ex.: Upstash Redis).

## Variáveis de ambiente

Veja `.env.example` para a lista completa (`PORT`, `DATABASE_URL`, `ADMIN_RESET_TOKEN`).
