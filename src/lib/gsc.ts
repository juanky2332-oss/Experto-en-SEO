import "server-only";
import { SignJWT, importPKCS8 } from "jose";
import { sql } from "./db";

// Google Search Console con cuenta de servicio (permiso completo desde 11-11-2026: lectura, envío de sitemaps e inspección). Sin GSC_CLIENT_EMAIL / GSC_PRIVATE_KEY / GSC_SITE
// todo devuelve null y nada se rompe. La clave nunca se escribe en el repositorio (solo variables de entorno).

export type FilaGsc = { pagina: string; consulta: string; clics: number; impresiones: number; ctr: number; posicion: number };
export type FotoGsc = { fecha: string; desde: string; consultas: FilaGsc[]; paginas: FilaGsc[] };

const SCOPE = "https://www.googleapis.com/auth/webmasters";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

let cache: { token: string; caduca: number } | null = null;

export function gscConfigurado() {
  return !!(process.env.GSC_CLIENT_EMAIL && process.env.GSC_PRIVATE_KEY && process.env.GSC_SITE);
}

async function token(): Promise<string | null> {
  if (!gscConfigurado()) return null;
  if (cache && cache.caduca > Date.now() + 60_000) return cache.token;
  const clave = await importPKCS8(process.env.GSC_PRIVATE_KEY!.replace(/\\n/g, "\n"), "RS256");
  const jwt = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(process.env.GSC_CLIENT_EMAIL!).setSubject(process.env.GSC_CLIENT_EMAIL!).setAudience(TOKEN_URL)
    .setIssuedAt().setExpirationTime("55m").sign(clave);
  const r = await fetch(TOKEN_URL, {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const j = (await r.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!r.ok || !j.access_token) throw new Error(`Search Console: token rechazado (${r.status}) ${j.error_description ?? ""}`.trim());
  cache = { token: j.access_token, caduca: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return cache.token;
}

const dia = (d: Date) => d.toISOString().slice(0, 10);
const ruta = (u: string) => (u.replace(/^https?:\/\/[^/]+/, "").replace(/[?#].*$/, "") || "/");

type RespuestaGsc = { rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[] };

async function consultar(t: string, startDate: string, endDate: string, dimensions: string[]): Promise<RespuestaGsc> {
  const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(process.env.GSC_SITE!)}/searchAnalytics/query`, {
    method: "POST", headers: { authorization: `Bearer ${t}`, "content-type": "application/json" },
    body: JSON.stringify({ startDate, endDate, dimensions, rowLimit: 1000, dataState: "final" }),
  });
  if (!r.ok) throw new Error(`Search Console: consulta rechazada (${r.status}) ${(await r.text()).slice(0, 200)}`);
  return (await r.json()) as RespuestaGsc;
}

/** Últimos 28 días hasta hace 2 días (los datos de Google llegan con retraso). null si no está configurado. */
export async function fotoGsc(): Promise<FotoGsc | null> {
  const t = await token();
  if (!t) return null;
  const fin = new Date(Date.now() - 2 * 86_400_000);
  const ini = new Date(fin.getTime() - 27 * 86_400_000);
  const [qp, p] = await Promise.all([consultar(t, dia(ini), dia(fin), ["query", "page"]), consultar(t, dia(ini), dia(fin), ["page"])]);
  const fila = (k: string, q: string, x: NonNullable<RespuestaGsc["rows"]>[number]): FilaGsc =>
    ({ pagina: ruta(k), consulta: q, clics: x.clicks, impresiones: x.impressions, ctr: x.ctr, posicion: x.position });
  return {
    fecha: dia(fin), desde: dia(ini),
    consultas: (qp.rows ?? []).map((x) => fila(x.keys[1], x.keys[0].toLowerCase(), x)),
    paginas: (p.rows ?? []).map((x) => fila(x.keys[0], "", x)),
  };
}

/** Guarda la foto de hoy en seo.gsc (la fecha es el final del rango) y borra lo de más de 120 días. Devuelve filas guardadas. */
export async function guardarGsc(): Promise<number | null> {
  const f = await fotoGsc();
  if (!f) return null;
  const filas = [...f.consultas, ...f.paginas];
  await sql.begin(async (tx) => {
    for (let i = 0; i < filas.length; i += 200) {
      const lote = filas.slice(i, i + 200).map((x) => ({ fecha: f.fecha, pagina: x.pagina, consulta: x.consulta, clics: x.clics, impresiones: x.impresiones, ctr: x.ctr, posicion: x.posicion }));
      await tx`insert into seo.gsc ${tx(lote)}
        on conflict (fecha, pagina, consulta) do update set clics = excluded.clics, impresiones = excluded.impresiones, ctr = excluded.ctr, posicion = excluded.posicion`;
    }
    await tx`delete from seo.gsc where fecha < current_date - 120`;
  });
  return filas.length;
}

export type ResumenGsc = { fecha: string; consultas: FilaGsc[]; paginas: FilaGsc[]; clics: number; impresiones: number };

/** Última foto guardada (consulta+página y solo página). null si aún no hay datos. */
export async function ultimaGsc(): Promise<ResumenGsc | null> {
  const [u] = await sql<{ fecha: string }[]>`select to_char(max(fecha), 'YYYY-MM-DD') fecha from seo.gsc`;
  if (!u?.fecha) return null;
  const rows = await sql<(FilaGsc & { fecha: string })[]>`
    select pagina, consulta, clics, impresiones, ctr, posicion from seo.gsc where fecha = ${u.fecha}::date`;
  const paginas = rows.filter((r) => r.consulta === "");
  const consultas = rows.filter((r) => r.consulta !== "");
  return { fecha: u.fecha, consultas, paginas, clics: paginas.reduce((a, r) => a + r.clics, 0), impresiones: paginas.reduce((a, r) => a + r.impresiones, 0) };
}

// ---------------------------------------------------------------- indexación (11-11-2026)
export type EstadoIndex = { estado: string; indexada: boolean; desde: string; rastreo: string | null };
const SITEMAP = "https://transformaconia.com/sitemap_index.xml";

/** Reenvía el mapa del sitio (Google lo vuelve a leer y descubre lo nuevo). */
export async function enviarSitemap(): Promise<boolean> {
  const t = await token();
  if (!t) return false;
  const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(process.env.GSC_SITE!)}/sitemaps/${encodeURIComponent(SITEMAP)}`, { method: "PUT", headers: { authorization: `Bearer ${t}` } });
  return r.ok;
}

/**
 * Inspecciona las URL clave y guarda desde cuándo está cada una sin indexar (seo.settings.indexacion).
 * Devuelve las que llevan 7 días o más fuera de Google (las noindex a propósito no cuentan).
 */
export async function vigilarIndexacion(urls: string[]): Promise<{ revisadas: number; fuera: { url: string; estado: string; dias: number }[] }> {
  const t = await token();
  if (!t) return { revisadas: 0, fuera: [] };
  const [fila] = await sql<{ value: Record<string, EstadoIndex> }[]>`select value from seo.settings where key = 'indexacion'`;
  const antes = fila?.value ?? {};
  const ahora: Record<string, EstadoIndex> = {};
  const hoy = dia(new Date());
  for (const url of [...new Set(urls)].slice(0, 120)) {
    try {
      const r = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
        method: "POST", headers: { authorization: `Bearer ${t}`, "content-type": "application/json" },
        body: JSON.stringify({ inspectionUrl: url, siteUrl: process.env.GSC_SITE, languageCode: "es" }),
      });
      if (!r.ok) continue;
      const s = ((await r.json()) as { inspectionResult?: { indexStatusResult?: { verdict?: string; coverageState?: string; indexingState?: string; lastCrawlTime?: string } } }).inspectionResult?.indexStatusResult ?? {};
      if (s.indexingState === "BLOCKED_BY_META_TAG" || s.indexingState === "BLOCKED_BY_ROBOTS_TXT") continue; // fuera a propósito
      const indexada = s.verdict === "PASS";
      const previo = antes[url];
      ahora[url] = { estado: s.coverageState ?? "desconocido", indexada, desde: indexada ? hoy : previo && !previo.indexada ? previo.desde : hoy, rastreo: s.lastCrawlTime ?? null };
    } catch (e) {
      console.error("inspección", url, e);
    }
  }
  await sql`insert into seo.settings (key, value) values ('indexacion', ${sql.json({ ...antes, ...ahora } as never)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  const fuera = Object.entries(ahora).filter(([, e]) => !e.indexada)
    .map(([url, e]) => ({ url, estado: e.estado, dias: Math.round((Date.parse(hoy) - Date.parse(e.desde)) / 864e5) }))
    .filter((x) => x.dias >= 7);
  return { revisadas: Object.keys(ahora).length, fuera };
}
