-- Agente de Projetos — Supabase (PostgreSQL) schema
--
-- Run this once against your Supabase project: Dashboard → SQL Editor → paste
-- and run, or `supabase db push` / `psql "$DATABASE_URL" -f supabase/schema.sql`.
--
-- Column names keep the app's original camelCase (quoted identifiers) so the
-- API layer can map `select *` rows directly onto the frontend's TypeScript
-- types without a translation layer.
--
-- RLS is enabled on every table with NO policies attached. The API server
-- connects with the `postgres` role (via DATABASE_URL), which bypasses RLS,
-- so the app keeps working normally. If Supabase's auto-generated PostgREST
-- API is ever used with the anon/authenticated key, RLS blocks it by default
-- since no policies grant it access — the browser never talks to Supabase
-- directly in this app, so that's the safe default.

create table if not exists responsables (
  id text primary key,
  nome text not null,
  cargo text not null default '',
  area text not null default '',
  email text not null default '',
  telefone text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists projetos (
  id text primary key,
  nome text not null,
  descricao text not null default '',
  area text not null default 'Geral',
  "dataInicio" text not null default '',
  "dataPrevistaConclusao" text not null default '',
  prioridade text not null default 'Media',
  status text not null default 'Planejamento',
  created_at timestamptz not null default now()
);

create table if not exists demandas (
  id text primary key,
  titulo text not null,
  descricao text not null default '',
  solicitante text not null default 'Não informado',
  "dataRecebimento" text not null default '',
  prioridade text not null default 'Media',
  status text not null default 'Nova',
  "projetoCriadoId" text references projetos(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists atividades (
  id text primary key,
  "projetoId" text not null references projetos(id) on delete cascade,
  nome text not null,
  descricao text not null default '',
  "responsavelId" text not null default '',
  "dataInicio" text not null default '',
  "dataLimite" text not null default '',
  prioridade text not null default 'Media',
  status text not null default 'Pendente',
  created_at timestamptz not null default now()
);

create table if not exists comentarios (
  id text primary key,
  "atividadeId" text not null references atividades(id) on delete cascade,
  autor text not null default '',
  texto text not null default '',
  data text not null,
  created_at timestamptz not null default now()
);

create table if not exists anexos (
  id text primary key,
  "atividadeId" text not null references atividades(id) on delete cascade,
  "nomeArquivo" text not null,
  tipo text not null,
  tamanho text not null default '',
  "dataAnexo" text not null,
  created_at timestamptz not null default now()
);

create table if not exists historico (
  id text primary key,
  "atividadeId" text not null references atividades(id) on delete cascade,
  descricao text not null,
  data text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_atividades_projeto on atividades("projetoId");
create index if not exists idx_atividades_responsavel on atividades("responsavelId");
create index if not exists idx_comentarios_atividade on comentarios("atividadeId");
create index if not exists idx_anexos_atividade on anexos("atividadeId");
create index if not exists idx_historico_atividade on historico("atividadeId");
create index if not exists idx_projetos_status on projetos(status);
create index if not exists idx_atividades_status on atividades(status);
create index if not exists idx_atividades_prazo_aberta on atividades("dataLimite")
  where status not in ('Concluido', 'Cancelado');

insert into responsables (id, nome, cargo, area, email, telefone)
values ('r1', 'Vilar', 'Gerente de Inovação e Projetos', 'Inovação', 'vilar@empresa.com', '')
on conflict (id) do nothing;

alter table responsables enable row level security;
alter table projetos enable row level security;
alter table demandas enable row level security;
alter table atividades enable row level security;
alter table comentarios enable row level security;
alter table anexos enable row level security;
alter table historico enable row level security;
