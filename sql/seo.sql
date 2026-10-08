-- Esquema "seo" completo (Postgres). Idempotente: se puede ejecutar varias veces.
-- Crear la base desde cero: node --env-file=.env.local n8n/crear-bd.mjs
create schema if not exists seo;

create table if not exists seo.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Historial de todo lo que se cambia (con estado anterior para deshacer)
create table if not exists seo.actions (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  origin text not null,
  action text not null,
  target_type text,
  target_id text,
  summary text not null default '',
  before jsonb,
  after jsonb,
  status text not null default 'done',
  error text
);
create index if not exists actions_created_idx on seo.actions (created_at desc);
create index if not exists actions_target_idx on seo.actions (target_id);

-- Noticias del radar
create table if not exists seo.radar (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  url text not null unique,
  title text,
  source text,
  published_at timestamptz,
  snippet text,
  resumen text,
  score int,
  motivo text,
  keyword text,
  categoria text,
  cluster text,
  tipo text,
  status text not null default 'new',
  digest_date date
);
create index if not exists radar_created_idx on seo.radar (created_at desc);

-- Resumen diario del radar
create table if not exists seo.digests (
  fecha date primary key,
  resumen_md text,
  data jsonb,
  created_at timestamptz not null default now()
);

-- Propuestas de artículo (brief) del publicador
create table if not exists seo.briefs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  origin text,
  source_url text,
  source_title text,
  source_name text,
  source_text text,
  brief jsonb,
  radar_id bigint,
  status text not null default 'pending',
  post_id int,
  post_url text,
  seo_score int,
  error text
);
create index if not exists briefs_created_idx on seo.briefs (created_at desc);

create table if not exists seo.recommendations (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  tipo text,
  prioridad text,
  titulo text,
  detalle text,
  post_id int,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'open',
  resolved_at timestamptz
);

create table if not exists seo.audits (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  kind text not null,
  target text,
  score int,
  data jsonb
);
create index if not exists audits_kind_idx on seo.audits (kind, created_at desc);

create table if not exists seo.post_scores (
  post_id int primary key,
  title text,
  url text,
  score int,
  issues jsonb,
  metrics jsonb,
  updated_at timestamptz not null default now()
);

-- Foto diaria de la puntuación (post_id = 0 es la salud media del sitio)
create table if not exists seo.score_history (
  fecha date not null,
  post_id int not null,
  score int,
  primary key (fecha, post_id)
);

-- Confirmaciones pendientes de Telegram (botones «Sí, adelante»)
create table if not exists seo.pending_confirmations (
  token text primary key,
  payload jsonb not null,
  used boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '1 hour'
);

-- Web: contactos del formulario y suscriptores del boletín semanal (doble confirmación)
create table if not exists seo.contactos (
  id bigserial primary key,
  tipo text not null default 'contacto',
  nombre text, empresa text, sector text, email text, mensaje text, origen text,
  created_at timestamptz not null default now()
);
create table if not exists seo.suscriptores (
  email text primary key,
  token text not null,
  confirmado boolean not null default false,
  baja boolean not null default false,
  origen text,
  created_at timestamptz not null default now(),
  confirmado_at timestamptz,
  ultimo_envio timestamptz
);
