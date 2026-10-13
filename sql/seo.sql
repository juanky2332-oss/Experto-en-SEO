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
-- Atribución del contacto (página de entrada, procedencia y utm_* de la sesión) y seguimiento (2026-10-13)
alter table seo.contactos add column if not exists entrada text;
alter table seo.contactos add column if not exists procedencia text;
alter table seo.contactos add column if not exists utm_source text;
alter table seo.contactos add column if not exists utm_medium text;
alter table seo.contactos add column if not exists utm_campaign text;
alter table seo.contactos add column if not exists estado text not null default 'nuevo';  -- nuevo | respondido | diagnostico | no_encaja
alter table seo.contactos add column if not exists respondido_en timestamptz;
alter table seo.contactos add column if not exists token text;                              -- enlace de los botones de Telegram
alter table seo.contactos add column if not exists avisado_en timestamptz;               -- aviso de «sin respuesta» ya enviado
create index if not exists contactos_estado on seo.contactos (estado, created_at);
create index if not exists contactos_token on seo.contactos (token);
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

-- Web: medición propia sin cookies ni IP (visitas, clics en botones clave y contactos enviados)
create table if not exists seo.visitas (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  evento text not null default 'visita',   -- visita | clic | contacto
  ruta text not null,
  etiqueta text,                            -- texto o destino del botón pulsado
  ref text,                                 -- dominio de procedencia (google.com, linkedin.com…) o vacío si es directo
  disp text                                 -- movil | pc
);
create index if not exists visitas_fecha on seo.visitas (created_at);

-- Web: reservas del diagnóstico gratuito (30 min) en el calendario.
-- ip_hash = HMAC-SHA256 de la IP con una sal aleatoria DIARIA que vive solo en seo.settings ('sal_ip'); nunca la IP.
-- La sal se regenera al cambiar el día y la del día anterior se borra, así que la huella deja de poder recalcularse
-- (ni por fuerza bruta) y además el flujo web-visitas la pone a null a las 48 h.
create table if not exists seo.reservas (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  nombre text, empresa text, email text, telefono text,
  modalidad text,                           -- videollamada | en tu empresa
  localidad text,
  hueco timestamptz not null,               -- inicio de los 30 min
  estado text not null default 'confirmada', -- confirmada | anulada | cancelada
  evento_id text, meet text, ip_hash text, origen text
);
create unique index if not exists reservas_hueco_unico on seo.reservas (hueco) where estado = 'confirmada';
create index if not exists reservas_email_fecha on seo.reservas (email, created_at);
create index if not exists reservas_ip_fecha on seo.reservas (ip_hash, created_at);

-- Límite de eventos por minuto del webhook de visitas: huella de IP (HMAC con la sal diaria), se borra a los 10 minutos (nunca se guarda en seo.visitas)
create table if not exists seo.visitas_limite (
  huella text not null,
  created_at timestamptz not null default now()
);
create index if not exists visitas_limite_h on seo.visitas_limite (huella, created_at);

-- Huella de IP (2026-10-13): HMAC-SHA256 con sal aleatoria diaria (día de Madrid), guardada solo aquí, nunca en el repo.
-- seo.settings 'sal_ip' = {fecha, sal}; se regenera sola cuando cambia la fecha y la limpieza de madrugada borra la del día anterior.
-- Sin la sal vieja, las huellas antiguas ya no se pueden revertir ni comparar.
create extension if not exists pgcrypto;
create or replace function seo.huella(ip text, ambito text) returns text language plpgsql set search_path = seo, public, pg_temp as $$
declare f text := to_char(now() at time zone 'Europe/Madrid', 'YYYY-MM-DD'); s text;
begin
  if coalesce(ip, '') = '' then return null; end if;
  -- se lee primero; solo se escribe cuando falta la sal del día (no se toca settings en cada visita)
  select value->>'sal' into s from seo.settings where key = 'sal_ip' and value->>'fecha' = f;
  if s is null then
    insert into seo.settings (key, value) values ('sal_ip', jsonb_build_object('fecha', f, 'sal', encode(gen_random_bytes(32), 'hex')))
      on conflict (key) do update set value = excluded.value, updated_at = now() where seo.settings.value->>'fecha' is distinct from f;
    select value->>'sal' into s from seo.settings where key = 'sal_ip';
  end if;
  return encode(hmac(convert_to(ambito || '|' || ip, 'UTF8'), convert_to(s, 'UTF8'), 'sha256'), 'hex');
end $$;

-- Límites diarios ATÓMICOS (respuestas automáticas, reservas, altas de boletín). La clave lleva una huella con la sal del día,
-- nunca el correo ni la IP en claro; las filas de días anteriores las borra la limpieza de madrugada de web-visitas.
create table if not exists seo.limite_auto (
  clave text primary key,
  dia date not null,
  n int not null
);
-- Devuelve true y cuenta 1 si aún no se ha llegado al tope de hoy; false (sin contar) si ya se alcanzó. Seguro ante peticiones simultáneas.
create or replace function seo.limite(p_clave text, p_tope int) returns boolean language plpgsql set search_path = seo, public, pg_temp as $$
declare d date := (now() at time zone 'Europe/Madrid')::date; r int;
begin
  insert into seo.limite_auto as l (clave, dia, n) values (p_clave, d, 1)
  on conflict (clave) do update set n = case when l.dia = excluded.dia then l.n + 1 else 1 end, dia = excluded.dia
    where l.dia <> excluded.dia or l.n < p_tope
  returning n into r;
  return r is not null;
end $$;

-- Cierra el acceso por la API pública de Supabase/PostgREST si existieran esos roles (no falla si no existen)
do $$ begin
  revoke all on seo.settings from public;
  revoke all on seo.limite_auto from public;
  if exists (select 1 from pg_roles where rolname = 'anon') then revoke all on seo.settings, seo.limite_auto from anon; end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then revoke all on seo.settings, seo.limite_auto from authenticated; end if;
end $$;

-- Contactos: huella de IP (a null a las 48 h) y si se envió la respuesta automática (límite 3/día por correo, 10/día por IP)
alter table seo.contactos add column if not exists ip_hash text;
alter table seo.contactos add column if not exists auto_resp boolean not null default false;
create index if not exists contactos_email_fecha on seo.contactos (email, created_at);
create index if not exists contactos_ip_fecha on seo.contactos (ip_hash, created_at);
alter table seo.contactos add column if not exists email_norm text;   -- correo sin +etiqueta (y sin puntos en gmail), para los límites
create index if not exists contactos_email_norm on seo.contactos (email_norm, created_at);
alter table seo.suscriptores add column if not exists confirm_enviada_en timestamptz;   -- última confirmación enviada (máx. 1 cada 24 h)

-- Tanda 5 (2026-10-13): pruebas fuera de los recuentos y conversiones medibles.
-- es_prueba = true si el correo es info@transformaconia.com o el nombre empieza por «PRUEBA» (lo rellenan los flujos web-contacto y web-reserva).
-- Los eventos de conversión se guardan en seo.visitas con evento = 'conversion' y ruta '/evento/contacto-enviado' o '/evento/reserva-hecha'
-- (etiqueta = página de entrada, ref = procedencia; sin datos personales y nunca para pruebas).
alter table seo.contactos add column if not exists es_prueba boolean not null default false;
alter table seo.reservas add column if not exists es_prueba boolean not null default false;
alter table seo.reservas add column if not exists entrada text;
alter table seo.reservas add column if not exists procedencia text;
update seo.contactos set es_prueba = true where not es_prueba and (lower(email) = 'info@transformaconia.com' or nombre ilike 'prueba%');
update seo.reservas set es_prueba = true where not es_prueba and (lower(email) = 'info@transformaconia.com' or nombre ilike 'prueba%');
create index if not exists visitas_evento_fecha on seo.visitas (evento, created_at);
