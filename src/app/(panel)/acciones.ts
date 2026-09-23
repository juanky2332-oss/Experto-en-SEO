"use server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { editar, enviarAPapelera, deshacer, limpiarContenido, registrar } from "@/lib/acciones";
import { obtener, listar, medio, actualizarMedio, crearEtiqueta, olvidarCache, type Cambios } from "@/lib/wp";
import { subirMedio, publicador, lanzarRadar, telegram, esc } from "@/lib/gateway";
import { sugerirMeta, mejorarContenido, altDeImagen, generarImagen, promptImagen, planEstrategico } from "@/lib/ai";
import { inventario, guardarFoto } from "@/lib/seo/inventario";

type Tipo = "post" | "page";
export type Resultado<T = unknown> = { ok: true; data?: T; mensaje?: string } | { ok: false; error: string };

async function seguro<T>(fn: () => Promise<T>, mensaje?: string): Promise<Resultado<T>> {
  try {
    const data = await fn();
    return { ok: true, data, mensaje };
  } catch (e) {
    console.error(e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

const refrescar = (id?: number) => {
  olvidarCache();
  revalidatePath("/", "layout");
  if (id) revalidatePath(`/articulos/${id}`);
};

// ---------------------------------------------------------------- edición
export async function guardarEntrada(id: number, tipo: Tipo, cambios: Cambios & { etiquetasTexto?: string[] }) {
  return seguro(async () => {
    const { etiquetasTexto, ...resto } = cambios;
    if (etiquetasTexto) resto.tags = await Promise.all(etiquetasTexto.filter(Boolean).map(crearEtiqueta));
    const r = await editar(id, resto, { origin: "app", tipo });
    refrescar(id);
    return { modified: r.entrada.modified, accion: r.accion };
  }, "Guardado en WordPress");
}

export async function cambiarEstado(id: number, tipo: Tipo, status: "publish" | "draft") {
  return seguro(async () => {
    await editar(id, { status }, { origin: "app", tipo, motivo: status === "publish" ? "Publicado" : "Pasado a borrador" });
    refrescar(id);
  }, status === "publish" ? "Publicado" : "Pasado a borrador");
}

export async function mandarAPapelera(id: number, tipo: Tipo) {
  return seguro(async () => {
    await enviarAPapelera(id, { origin: "app", tipo });
    refrescar(id);
  }, "Enviado a la papelera (recuperable 30 días)");
}

export async function deshacerAccion(accionId: number) {
  return seguro(async () => {
    const r = await deshacer(accionId, "app");
    await telegram(`↩️ <b>Deshecho desde la app</b>: «${esc(r.title)}»`);
    refrescar(r.id);
  }, "Cambio deshecho");
}

export async function arreglosSeguros(id: number, tipo: Tipo) {
  return seguro(async () => {
    const e = await obtener(id, tipo);
    const { contenido, cambios } = limpiarContenido(e.content);
    if (!cambios.length) return [];
    await editar(id, { content: contenido }, { origin: "app", tipo, motivo: cambios.join(", ") });
    refrescar(id);
    return cambios;
  }, "Arreglos aplicados");
}

// ---------------------------------------------------------------- IA (devuelven propuestas: nada se guarda sin tu clic)
export async function iaMeta(id: number, tipo: Tipo) {
  return seguro(async () => {
    const e = await obtener(id, tipo);
    return sugerirMeta(e);
  });
}

export async function iaMejorar(id: number, tipo: Tipo, instruccion: string, contenidoActual?: string) {
  return seguro(async () => {
    const e = await obtener(id, tipo);
    const posts = (await listar("post", "publish")).filter((p) => p.id !== id).map((p) => ({ title: p.title, link: p.link }));
    return mejorarContenido({ ...e, content: contenidoActual ?? e.content }, instruccion, posts, e.meta.rank_math_focus_keyword?.split(",")[0] ?? "");
  });
}

export async function iaAlts(id: number, tipo: Tipo, contenidoActual?: string) {
  return seguro(async () => {
    const e = await obtener(id, tipo);
    let html = contenidoActual ?? e.content;
    let n = 0;
    const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]).filter((t) => !/\salt=["'][^"']{5,}["']/i.test(t));
    for (const tag of imgs.slice(0, 8)) {
      const src = tag.match(/src=["']([^"']+)["']/i)?.[1];
      if (!src) continue;
      const alt = (await altDeImagen(src, e.title)).replace(/"/g, "'");
      const nuevo = /\salt=["'][^"']*["']/i.test(tag) ? tag.replace(/\salt=["'][^"']*["']/i, ` alt="${alt}"`) : tag.replace(/<img/i, `<img alt="${alt}"`);
      html = html.replace(tag, nuevo);
      const idMedio = Number(tag.match(/wp-image-(\d+)/)?.[1]);
      if (idMedio) await actualizarMedio(idMedio, { alt_text: alt }).catch(() => null);
      n++;
    }
    if (e.featured_media) {
      const m = await medio(e.featured_media).catch(() => null);
      if (m && !m.alt_text) { await actualizarMedio(m.id, { alt_text: await altDeImagen(m.source_url, e.title) }); n++; }
    }
    return { contenido: html, n };
  });
}

export async function iaNuevaPortada(id: number, tipo: Tipo) {
  return seguro(async () => {
    const e = await obtener(id, tipo);
    const p = await promptImagen(e);
    const b64 = await generarImagen(p.prompt);
    const m = await subirMedio(`${e.slug.slice(0, 60)}-portada-${Date.now().toString(36)}.webp`, "image/webp", b64);
    await actualizarMedio(m.id, { alt_text: p.alt, title: e.title.slice(0, 60) });
    await editar(id, { featured_media: m.id }, { origin: "app", tipo, motivo: "Nueva imagen destacada (gpt-image-2)" });
    refrescar(id);
    return { id: m.id, url: m.source_url };
  }, "Nueva portada generada y asignada");
}

// ---------------------------------------------------------------- publicación y radar
export async function prepararUrl(url: string) {
  return seguro(async () => {
    if (!/^https?:\/\//.test(url)) throw new Error("Pega una URL completa (https://…)");
    await publicador({ action: "brief_url", url });
    await registrar({ origin: "app", action: "preparar_brief", target_type: "url", target_id: url, summary: `Noticia enviada a preparar: ${url}` });
  }, "Leyendo la noticia… te llega el resumen a Telegram y aparece aquí en ~1 minuto");
}

export async function prepararRadar(radarId: number) {
  return seguro(async () => {
    await publicador({ action: "brief_radar", radar_id: radarId });
  }, "Preparando el resumen… llegará a Telegram y a Publicar");
}

export async function descartarRadar(radarId: number) {
  return seguro(async () => {
    await sql`update seo.radar set status = 'skipped' where id = ${radarId}`;
    revalidatePath("/radar");
  });
}

export async function publicarBrief(briefId: string) {
  return seguro(async () => {
    await publicador({ action: "publish", brief_id: briefId });
    revalidatePath("/publicar");
  }, "Redactando… en 4-7 minutos estará publicado y te aviso por Telegram");
}

export async function rechazarBrief(briefId: string) {
  return seguro(async () => {
    await publicador({ action: "reject", brief_id: briefId });
    await new Promise((r) => setTimeout(r, 1500));
    revalidatePath("/publicar");
  });
}

export async function radarAhora() {
  return seguro(async () => {
    await lanzarRadar();
  }, "Radar en marcha: en 1-2 minutos tendrás el resumen en Telegram");
}

// ---------------------------------------------------------------- análisis y estrategia
export async function reanalizar() {
  return seguro(async () => {
    olvidarCache();
    const inv = await inventario();
    await guardarFoto(inv);
    refrescar();
    return inv.salud;
  }, "Sitio reanalizado");
}

export async function generarPlan() {
  return seguro(async () => {
    const inv = await inventario();
    const radar = await sql<{ title: string; score: number; keyword: string }[]>`
      select title, score, keyword from seo.radar where score is not null and created_at > now() - interval '7 days' order by score desc limit 15`;
    const datos = [
      `SALUD SEO MEDIA: ${inv.salud}/100 · ${inv.posts.filter((p) => p.status === "publish").length} publicados · ${inv.posts.filter((p) => p.status === "draft").length} borradores`,
      `CATEGORÍAS: ${inv.categorias.map((c) => `${c.name} (${c.count})`).join(", ")}`,
      "INVENTARIO (id | estado | fecha | categoría | score | palabras | keyword | título | problemas principales):",
      ...inv.posts.map((p) => `${p.id} | ${p.status} | ${p.date.slice(0, 10)} | ${p.categories.map((c) => inv.categorias.find((x) => x.id === c)?.name).join("/")} | ${p.analisis.score} | ${p.analisis.metricas.palabras} | ${p.analisis.keyword || "-"} | ${p.title} | ${p.analisis.problemas.slice(0, 3).map((x) => x.titulo).join("; ")}`),
      "PÁGINAS: " + inv.paginas.map((p) => `${p.id} ${p.status} /${p.slug}/ «${p.title}»`).join(" · "),
      "RADAR DE NOTICIAS (últimos 7 días, puntuación):",
      ...radar.map((r) => `- ${r.score} · ${r.title} (${r.keyword})`),
    ].join("\n");
    const plan = await planEstrategico(datos);
    await sql`update seo.recommendations set status = 'dismissed', resolved_at = now() where status = 'open' and payload->>'fuente' = 'ia'`;
    for (const r of plan.recomendaciones) {
      await sql`insert into seo.recommendations (tipo, prioridad, titulo, detalle, post_id, payload)
        values (${r.tipo}, ${r.prioridad}, ${r.titulo}, ${r.detalle}, ${r.post_id || null}, ${sql.json({ fuente: "ia", cambio_titulo: r.cambio_titulo })})`;
    }
    await sql`insert into seo.audits (kind, target, score, data) values ('plan', 'sitio', ${inv.salud}, ${sql.json(plan as never)})`;
    await registrar({ origin: "app", action: "plan_estrategico", target_type: "site", summary: `Plan SEO generado: ${plan.recomendaciones.length} recomendaciones` });
    revalidatePath("/estrategia");
    return plan.recomendaciones.length;
  }, "Plan estratégico generado");
}

export async function resolverRecomendacion(id: number, estado: "applied" | "dismissed") {
  return seguro(async () => {
    const [r] = await sql<{ post_id: number | null; payload: { cambio_titulo?: string }; titulo: string }[]>`select post_id, payload, titulo from seo.recommendations where id = ${id}`;
    if (estado === "applied" && r?.post_id && r.payload?.cambio_titulo) {
      await editar(r.post_id, { title: r.payload.cambio_titulo }, { origin: "app", motivo: "Recomendación aplicada" });
    }
    await sql`update seo.recommendations set status = ${estado}, resolved_at = now() where id = ${id}`;
    revalidatePath("/estrategia");
  });
}

export async function guardarAjustes(modo: "publicar" | "borrador", scoreMinimo: number) {
  return seguro(async () => {
    const v = { modo, score_minimo: Math.max(50, Math.min(100, Math.round(scoreMinimo))), imagenes: "gpt-image-2" };
    await sql`update seo.settings set value = ${sql.json(v)}, updated_at = now() where key = 'publicacion'`;
    await registrar({ origin: "app", action: "ajustes", target_type: "site", summary: `Publicación: ${modo === "publicar" ? "automática" : "siempre en borrador"}, mínimo ${v.score_minimo}/100` });
    revalidatePath("/ajustes");
  }, "Ajustes guardados");
}

export async function probarTelegram() {
  return seguro(async () => {
    const r = await telegram("👋 Prueba desde la app <b>Experto en SEO</b>. Todo conectado.");
    if (!r.ok) throw new Error("Telegram no respondió");
  }, "Mensaje enviado");
}

export async function velocidad(url: string) {
  return seguro(async () => {
    const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=seo&category=accessibility&category=best-practices&locale=es${process.env.PAGESPEED_KEY ? `&key=${process.env.PAGESPEED_KEY}` : ""}`;
    const r = await fetch(api, { signal: AbortSignal.timeout(90_000) });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error?.message ?? `PageSpeed ${r.status}`);
    const c = j.lighthouseResult.categories;
    const a = j.lighthouseResult.audits;
    const data = {
      url,
      rendimiento: Math.round(c.performance.score * 100), seo: Math.round(c.seo.score * 100),
      accesibilidad: Math.round(c.accessibility.score * 100), practicas: Math.round(c["best-practices"].score * 100),
      lcp: a["largest-contentful-paint"]?.displayValue, cls: a["cumulative-layout-shift"]?.displayValue, tbt: a["total-blocking-time"]?.displayValue, fcp: a["first-contentful-paint"]?.displayValue,
      campo: j.loadingExperience?.overall_category ?? null,
      oportunidades: Object.values(a as Record<string, { id: string; title: string; score: number | null; details?: { type?: string; overallSavingsMs?: number } }>)
        .filter((x) => x.details?.type === "opportunity" && (x.details.overallSavingsMs ?? 0) > 150)
        .sort((x, y) => (y.details!.overallSavingsMs ?? 0) - (x.details!.overallSavingsMs ?? 0)).slice(0, 6)
        .map((x) => ({ titulo: x.title, ahorroMs: Math.round(x.details!.overallSavingsMs ?? 0) })),
    };
    await sql`insert into seo.audits (kind, target, score, data) values ('speed', ${url}, ${data.rendimiento}, ${sql.json(data)})`;
    revalidatePath("/auditoria");
    return data;
  });
}

export async function limpiezaMasiva() {
  return seguro(async () => {
    const posts = await listar("post");
    const hechos: string[] = [];
    for (const p of posts) {
      const { contenido, cambios } = limpiarContenido(p.content);
      if (cambios.length) {
        await editar(p.id, { content: contenido }, { origin: "app", motivo: cambios.join(", "), avisar: false });
        hechos.push(`#${p.id}`);
      }
    }
    if (hechos.length) await telegram(`🧹 <b>Limpieza masiva desde la app</b>: ${hechos.length} artículos corregidos (schema duplicado, firma, enlaces de contacto). Todo queda en el historial con opción de deshacer.`);
    refrescar();
    return hechos.length;
  }, "Limpieza completada");
}

export async function borrarEtiquetasVacias() {
  return seguro(async () => {
    const { etiquetas } = await import("@/lib/wp");
    const { wp } = await import("@/lib/gateway");
    const vacias = (await etiquetas()).filter((t) => t.count === 0);
    for (const t of vacias) await wp("DELETE", `wp/v2/tags/${t.id}?force=true`);
    if (vacias.length) await registrar({ origin: "app", action: "borrar_etiquetas", target_type: "tag", summary: `Eliminadas ${vacias.length} etiquetas vacías: ${vacias.map((t) => t.name).join(", ")}`, before: vacias });
    revalidatePath("/auditoria");
    return vacias.length;
  }, "Etiquetas vacías eliminadas");
}
