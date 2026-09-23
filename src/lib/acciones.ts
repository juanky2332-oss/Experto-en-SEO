import "server-only";
import { sql } from "./db";
import { telegram, esc } from "./gateway";
import { obtener, actualizar, aPapelera, indexNow, type Cambios, type Entrada, SITE } from "./wp";

export type Origen = "app" | "telegram" | "sistema" | "n8n";

export async function registrar(a: {
  origin: Origen; action: string; target_type?: string; target_id?: string | number; summary: string;
  before?: unknown; after?: unknown; status?: "done" | "failed" | "pending"; error?: string;
}) {
  const [r] = await sql<{ id: number }[]>`
    insert into seo.actions (origin, action, target_type, target_id, summary, before, after, status, error)
    values (${a.origin}, ${a.action}, ${a.target_type ?? null}, ${a.target_id != null ? String(a.target_id) : null}, ${a.summary},
      ${a.before === undefined ? null : sql.json(a.before as never)}, ${a.after === undefined ? null : sql.json(a.after as never)},
      ${a.status ?? "done"}, ${a.error ?? null})
    returning id`;
  return r.id;
}

const ETIQUETA_CAMPO: Record<string, string> = {
  title: "título", content: "contenido", excerpt: "extracto", slug: "URL", status: "estado", categories: "categoría",
  tags: "etiquetas", featured_media: "imagen destacada", meta: "SEO (Rank Math)",
};
const ESTADO: Record<string, string> = { publish: "publicado", draft: "borrador", pending: "pendiente", private: "privado", future: "programado", trash: "papelera" };

function antesDe(e: Entrada, c: Cambios): Cambios {
  const b: Cambios = {};
  for (const k of Object.keys(c) as (keyof Cambios)[]) {
    if (k === "meta") {
      b.meta = Object.fromEntries(Object.keys(c.meta ?? {}).map((m) => [m, (e.meta as Record<string, string>)[m] ?? ""]));
    } else (b as Record<string, unknown>)[k] = (e as unknown as Record<string, unknown>)[k];
  }
  return b;
}

/** Edita una entrada guardando el estado anterior para poder deshacer, y avisa por Telegram. */
export async function editar(id: number, cambios: Cambios, o: { origin: Origen; motivo?: string; tipo?: "post" | "page"; avisar?: boolean }) {
  const tipo = o.tipo ?? "post";
  const antes = await obtener(id, tipo);
  const before = antesDe(antes, cambios);
  const despues = await actualizar(id, cambios, tipo);
  const campos = Object.keys(cambios).map((k) => ETIQUETA_CAMPO[k] ?? k).join(", ");
  const summary = `${o.motivo ? o.motivo + " · " : ""}${campos} de «${despues.title}»`;
  const accion = await registrar({ origin: o.origin, action: "editar", target_type: tipo, target_id: id, summary, before, after: cambios });
  // si cambia a publicado, avisamos a IndexNow (Bing / ChatGPT Search)
  if (cambios.status === "publish" && antes.status !== "publish") await indexNow(despues.link);
  if (o.avisar !== false && o.origin !== "telegram") {
    await telegram(
      `✏️ <b>Cambio desde la ${o.origin === "app" ? "app" : "automatización"}</b>\n${esc(summary)}\n${esc(despues.link)}` +
        (cambios.status ? `\nEstado: ${ESTADO[antes.status] ?? antes.status} → <b>${ESTADO[despues.status] ?? despues.status}</b>` : ""),
      [{ text: "↩️ Deshacer", data: `app:undo:${accion}` }],
    );
  }
  return { entrada: despues, accion };
}

export async function enviarAPapelera(id: number, o: { origin: Origen; tipo?: "post" | "page" }) {
  const tipo = o.tipo ?? "post";
  const antes = await obtener(id, tipo);
  await aPapelera(id, tipo);
  const accion = await registrar({ origin: o.origin, action: "papelera", target_type: tipo, target_id: id, summary: `A la papelera: «${antes.title}»`, before: { status: antes.status } });
  if (o.origin !== "telegram")
    await telegram(`🗑 <b>Enviado a la papelera</b> desde la app\n«${esc(antes.title)}»\n(Se puede recuperar 30 días)`, [{ text: "↩️ Recuperar", data: `app:undo:${accion}` }]);
  return accion;
}

/** Revierte una acción guardada (edición o papelera). */
export async function deshacer(accionId: number, origin: Origen) {
  const [a] = await sql<{ action: string; target_type: string; target_id: string; before: Cambios | null; summary: string; status: string }[]>`
    select action, target_type, target_id, before, summary, status from seo.actions where id = ${accionId}`;
  if (!a) throw new Error("No encuentro esa acción");
  if (a.status === "cancelled") throw new Error("Esa acción ya estaba deshecha");
  if (!a.before) throw new Error("Esa acción no se puede deshacer");
  const tipo = a.target_type === "page" ? "page" : "post";
  const r = await actualizar(Number(a.target_id), a.before, tipo);
  await sql`update seo.actions set status = 'cancelled' where id = ${accionId}`;
  await registrar({ origin, action: "deshacer", target_type: tipo, target_id: a.target_id, summary: `Deshecho: ${a.summary}`, after: a.before });
  return r;
}

// ---------------------------------------------------------------- arreglos automáticos sin IA
export function limpiarContenido(html: string) {
  let c = html;
  const cambios: string[] = [];
  // bloques JSON-LD Article/BreadcrumbList que duplican a Rank Math (y con la miga hacia /blog/ = Contacto)
  c = c.replace(/\s*<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi, (m, j: string) => {
    if (/"@type"\s*:\s*"(Article|BreadcrumbList|NewsArticle)"/.test(j) && !/FAQPage/.test(j)) {
      cambios.push("schema duplicado eliminado");
      return "";
    }
    return m;
  });
  if (/Ros Bautista/.test(c)) {
    c = c.replace(/Juan Carlos Ros Bautista/g, "Juan Carlos Ros");
    cambios.push("firma del autor abreviada");
  }
  // enlaces a /contacto/ que no existe
  const antes = c;
  c = c.replace(/href=["']https?:\/\/transformaconia\.com\/(contacto|contactar|hablemos)\/?["']/gi, 'href="mailto:info@transformaconia.com"');
  if (c !== antes) cambios.push("enlace de contacto roto → correo");
  return { contenido: c, cambios: [...new Set(cambios)] };
}

export const urlPost = (slug: string) => `${SITE}/${slug}/`;
