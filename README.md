# Agente de Projetos by Vilar

Gestão inteligente de projetos e entregas: demandas, projetos, atividades (Kanban), responsáveis, calendário e relatórios.

Stack: React 19 + Vite no frontend, Express no backend, SQLite (via `better-sqlite3`) como banco de dados persistente.

## Rodando localmente

**Pré-requisitos:** Node.js 20+

1. Instale as dependências:
   ```
   npm install
   ```
2. (Opcional) Copie `.env.example` para `.env` e ajuste as variáveis se quiser mudar a porta, o diretório de dados ou habilitar o endpoint de reset do banco.
3. Rode em modo desenvolvimento:
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

Os dados ficam em um arquivo SQLite (`data/database.sqlite` por padrão, configurável via `DATA_DIR`). O schema é criado automaticamente na primeira execução, com índices nas chaves estrangeiras e `ON DELETE CASCADE` entre projetos → atividades → comentários/anexos/histórico.

## Deploy no Render

O repositório já inclui `Dockerfile` e `render.yaml` prontos:

1. Crie um novo **Blueprint** no [Render](https://dashboard.render.com/blueprints) apontando para este repositório — o `render.yaml` configura o serviço automaticamente (build via Docker, health check em `/healthz`, disco persistente montado em `/data`).
2. O disco persistente exige um plano pago (`starter` ou superior). **No plano free do Render o disco não é anexado e os dados são perdidos a cada reinício/redeploy** — use o free apenas para testes rápidos.
3. A variável `ADMIN_RESET_TOKEN` é gerada automaticamente pelo blueprint. Guarde o valor se quiser usar o endpoint de manutenção `POST /api/reset-db` (requer o header `x-admin-token`); sem essa variável configurada, o endpoint fica desabilitado.
4. Após o primeiro deploy, o Render expõe uma URL pública (`https://<nome-do-serviço>.onrender.com`).

### Deploy manual (sem Blueprint)

Se preferir criar o serviço manualmente na dashboard do Render:
- **Runtime:** Docker (usa o `Dockerfile` da raiz do projeto)
- **Health Check Path:** `/healthz`
- **Disk:** monte um disco em `/data` (necessário para persistir o SQLite)
- **Env vars:** `NODE_ENV=production`, `DATA_DIR=/data`, e opcionalmente `ADMIN_RESET_TOKEN`

## Variáveis de ambiente

Veja `.env.example` para a lista completa (`PORT`, `DATA_DIR`, `ADMIN_RESET_TOKEN`).
