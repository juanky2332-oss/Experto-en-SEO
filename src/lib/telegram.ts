import "server-only";
import crypto from "node:crypto";
import { sql } from "./db";
import { telegram, esc, publicador, lanzarRadar, type Boton } from "./gateway";
import { obtener, listar, categorias, type Cambios } from "./wp";
import { editar, enviarAPapelera, deshacer, limpiarContenido, registrar } from "./acciones";
import { analizar } from "./seo/analizar";
import { inventario, anioActual } from "./seo/inventario";
import { agente, type LlamadaHerramienta } from "./ai";
import { investigarTema } from "./temas";
import { getRadarConfig, guardarRadarConfig, describirRadar, pedirCambioGuia } from "./guia";

const APP = process.env.APP_URL ?? "https://experto-en-seo.vercel.app";
type Respuesta = { text: string; buttons?: Boton[] };

// ---------------------------------------------------------------- utilidades
async function recordar(postId: number) {
  await sql`insert into seo.settings (key, value) values ('tg_contexto', ${sql.json({ post_id: postId })})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
}
async function ultimoPost(): Promise<number | null> {
  const [r] = await sql<{ value: { post_id?: number } }[]>`select value from seo.settings where key = 'tg_contexto'`;
  return r?.value?.post_id ?? null;
}

async function ficha(id: number): Promise<Respuesta> {
  const inv = await inventario();
  const p = inv.posts.find((x) => x.id === id) ?? inv.paginas.find((x) => x.id === id);
  if (!p) return { text: `No encuentro la entrada #${id}.` };
  await recordar(id);
  const a = p.analisis;
  const icon = a.score >= 85 ? "🟢" : a.score >= 70 ? "🟡" : a.score >= 50 ? "🟠" : "🔴";
  const probs = a.problemas.slice(0, 6).map((x) => `• ${esc(x.titulo)}`).join("\n");
  return {
    text: `${icon} <b>${esc(p.title)}</b> (#${p.id})\n${esc(p.link)}\n\nSEO <b>${a.score}/100</b> · ${a.metricas.palabras} palabras · ${a.metricas.internos} enlaces internos · keyword: <code>${esc(a.keyword || "sin definir")}</code>\n\n${probs || "Sin problemas 🎉"}\n\nEditar en la app: ${APP}/articulos/${p.id}${p.type === "page" ? "?tipo=page" : ""}`,
    buttons: [{ text: "🔧 Arreglos seguros", data: `app:fix:${p.id}` }, p.status === "publish" ? { text: "↩️ Pasar a borrador", data: `app:borrador:${p.id}` } : { text: "🌐 Publicar", data: `app:publicar:${p.id}` }],
  };
}

async function cambiar(id: number, cambios: Cambios, motivo: string): Promise<Respuesta> {
  const e = await obtener(id).catch(() => null);
  const tipo = e ? "post" : "page";
  const r = await editar(id, cambios, { origin: "telegram", tipo, motivo });
  await recordar(id);
  const a = analizar(r.entrada, { anio: anioActual() });
  return { text: `✅ ${esc(motivo)} en «${esc(r.entrada.title)}»\nSEO ahora: <b>${a.score}/100</b>\n${esc(r.entrada.link)}`, buttons: [{ text: "↩️ Deshacer", data: `app:undo:${r.accion}` }] };
}

async function pedirConfirmacion(payload: Record<string, unknown>, texto: string): Promise<Respuesta> {
  const token = crypto.randomBytes(6).toString("hex");
  await sql`insert into seo.pending_confirmations (token, payload) values (${token}, ${sql.json(payload as never)})`;
  return { text: texto, buttons: [{ text: "✅ Sí, adelante", data: `app:confirm:${token}` }, { text: "Cancelar", data: `app:cancel:${token}` }] };
}

async function estado(): Promise<Respuesta> {
  const inv = await inventario();
  const pub = inv.posts.filter((p) => p.status === "publish");
  const crit = pub.filter((p) => p.analisis.problemas.some((x) => x.gravedad === "critica")).length;
  const [radar] = await sql<{ n: number }[]>`select count(*)::int n from seo.radar where status in ('sent','new') and score >= 70 and created_at > now() - interval '3 days'`;
  const [pend] = await sql<{ n: number }[]>`select count(*)::int n from seo.briefs where status = 'pending'`;
  const peores = [...pub].sort((a, b) => a.analisis.score - b.analisis.score).slice(0, 3).map((p) => `• ${p.analisis.score} · ${esc(p.title)} (/post ${p.id})`).join("\n");
  return {
    text: `📊 <b>Estado SEO de transformaconia.com</b>\n\nSalud media: <b>${inv.salud}/100</b>\n${pub.length} publicados · ${inv.posts.length - pub.length} borradores\n${crit} artículos con problemas críticos\n${radar.n} temas del radar para publicar · ${pend.n} propuestas esperando aprobación\n\n<b>Necesitan ayuda:</b>\n${peores}\n\nPanel: ${APP}`,
  };
}

// ---------------------------------------------------------------- comandos
async function comando(texto: string): Promise<Respuesta> {
  const [cmdRaw, ...resto] = texto.trim().split(/\s+/);
  const cmd = cmdRaw.toLowerCase().replace(/@.*$/, "");
  const arg = resto.join(" ");
  const id = Number(resto[0]);
  const trasId = resto.slice(1).join(" ").trim();
  switch (cmd) {
    case "/start":
    case "/ayuda":
    case "/help":
      return { text: `🤖 <b>Experto en SEO</b>\n\n/tema texto · /radar on|off|diario|semanal|panel|ahora · /guia cambio · /estado · /articulos · /post ID · /titulo ID texto · /meta ID texto · /keyword ID texto · /arreglar ID · /publicar ID · /borrador ID · /borrar ID · /radar · /recomendaciones · /buscar texto\n\nTambién me puedes escribir normal («mejora la meta del artículo de GPT-6») o pegar el enlace de una noticia para publicarla.\n\nPanel: ${APP}` };
    case "/estado":
      return estado();
    case "/articulos": {
      const inv = await inventario();
      const l = inv.posts.filter((p) => p.status === "publish").sort((a, b) => a.analisis.score - b.analisis.score).slice(0, 10);
      return { text: `📉 <b>Los 10 que más ayuda necesitan</b>\n\n${l.map((p) => `${p.analisis.score} · ${esc(p.title.slice(0, 70))} — /post ${p.id}`).join("\n")}` };
    }
    case "/post":
      return Number.isInteger(id) ? ficha(id) : { text: "Uso: /post 6807" };
    case "/titulo":
      return Number.isInteger(id) && trasId ? cambiar(id, { title: trasId }, "Título cambiado") : { text: "Uso: /titulo 6807 Nuevo título" };
    case "/meta":
      return Number.isInteger(id) && trasId ? cambiar(id, { meta: { rank_math_description: trasId } }, "Meta description cambiada") : { text: "Uso: /meta 6807 Nueva descripción" };
    case "/keyword":
      return Number.isInteger(id) && trasId ? cambiar(id, { meta: { rank_math_focus_keyword: trasId } }, "Keyword cambiada") : { text: "Uso: /keyword 6807 palabra clave" };
    case "/publicar":
      return Number.isInteger(id) ? cambiar(id, { status: "publish" }, "Publicado") : { text: "Uso: /publicar 6807" };
    case "/borrador":
      return Number.isInteger(id) ? cambiar(id, { status: "draft" }, "Pasado a borrador") : { text: "Uso: /borrador 6807" };
    case "/arreglar":
      return Number.isInteger(id) ? arreglar(id) : { text: "Uso: /arreglar 6807" };
    case "/borrar": {
      if (!Number.isInteger(id)) return { text: "Uso: /borrar 6807" };
      const e = await obtener(id).catch(() => null);
      if (!e) return { text: `No encuentro #${id}` };
      return pedirConfirmacion({ accion: "papelera", id }, `🗑 ¿Envío a la papelera «${esc(e.title)}»?\n(Se puede recuperar 30 días.)`);
    }
    case "/radar": {
      const op = arg.trim().toLowerCase();
      const cambios: Record<string, Parameters<typeof guardarRadarConfig>[0]> = {
        on: { activo: true }, encender: { activo: true }, off: { activo: false }, apagar: { activo: false },
        diario: { frecuencia: "diario", activo: true }, semanal: { frecuencia: "semanal", activo: true }, panel: { frecuencia: "panel", activo: true },
      };
      if (cambios[op]) {
        const c = await guardarRadarConfig(cambios[op], { origin: "telegram" });
        return { text: `📡 ${esc(describirRadar(c))}\n\nMás opciones (temas, tipos, hora): ${APP}/radar` };
      }
      if (op === "ahora") {
        await lanzarRadar();
        return { text: "📡 Radar en marcha: en 1-3 minutos te llega el resumen." };
      }
      if (op === "estado" || op === "config") return { text: `📡 ${esc(describirRadar(await getRadarConfig()))}\n\n/radar on · off · diario · semanal · panel · ahora` };
      const [d] = await sql<{ resumen_md: string; fecha: string }[]>`select resumen_md, to_char(fecha,'DD/MM') fecha from seo.digests order by fecha desc limit 1`;
      if (!d) return { text: "Todavía no hay radar. Lánzalo con /radar ahora." };
      const txt = d.resumen_md.replace(/^# (.*)$/m, "<b>$1</b>").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\(\[fuente\]\((.+?)\)\)/g, '(<a href="$1">fuente</a>)');
      return { text: `🧠 Radar IA ${d.fecha}\n\n${txt}` };
    }
    case "/guia": {
      if (arg.trim().length < 5) return { text: `📘 Guía editorial: ${APP}/guia\n\nPara cambiarla: /guia más trucos de Claude Code y menos noticias de financiación` };
      await telegram("📘 Ajustando la guía editorial… (20-60 s)");
      const r = await pedirCambioGuia(arg, "telegram");
      return { text: `📘 <b>Guía editorial v${r.guia.version}</b>\n${esc(r.resumen)}\n\n${APP}/guia`, buttons: [{ text: "↩️ Deshacer", data: `app:undo:${r.accion}` }] };
    }
    case "/recomendaciones": {
      const l = await sql<{ titulo: string; prioridad: string; tipo: string; post_id: number | null }[]>`
        select titulo, prioridad, tipo, post_id from seo.recommendations where status = 'open'
        order by case prioridad when 'alta' then 0 when 'media' then 1 else 2 end, id limit 8`;
      if (!l.length) return { text: `No hay recomendaciones abiertas. Genera el plan en ${APP}/estrategia` };
      return { text: `🧭 <b>Lo más urgente</b>\n\n${l.map((r) => `• [${r.prioridad}] ${esc(r.titulo)}${r.post_id ? ` (/post ${r.post_id})` : ""}`).join("\n")}\n\nPlan completo: ${APP}/estrategia` };
    }
    case "/tema": {
      if (arg.trim().length < 3) return { text: "Uso: /tema tendencias Claude" };
      await telegram(`🔎 Buscando en la web lo mejor sobre «${esc(arg)}»… (30-90 s)`);
      const r = await investigarTema(arg, "telegram");
      const top = r.items.slice(0, 3);
      for (const x of top) {
        const icono = x.interes >= 75 ? "🟢" : x.interes >= 55 ? "🟡" : "🔴";
        const aviso = x.ya_cubierto ? `\n⚠️ Ya lo cubre: «${esc(x.ya_cubierto)}»` : "";
        await telegram(
          `📌 <b>${esc(x.titulo)}</b>\n<i>${esc(x.fuente)}</i> · ${esc(x.url)}\n\n${esc(x.resumen)}\n\n${icono} Interés ${x.interes}/100 — ${esc(x.por_que)}\n🔑 <code>${esc(x.keyword)}</code>${aviso}`,
          [{ text: "📝 Preparar artículo", data: `prep:${x.id}` }, { text: "🙈 Descartar", data: `skip:${x.id}` }],
        );
      }
      const ideas = r.ideas.map((i) => `• ${esc(i.titulo_articulo)} — <code>${esc(i.keyword)}</code>`).join("\n");
      return {
        text: `🧭 <b>${esc(r.consulta)}</b>\n\n${esc(r.panorama)}\n\n<b>Artículos que escribiría:</b>\n${ideas}\n\n${r.items.length} fuentes en el Radar de la app: ${APP}/radar`,
      };
    }
    case "/buscar": {
      const q = arg.toLowerCase();
      const l = (await listar("post")).filter((p) => `${p.title} ${p.slug}`.toLowerCase().includes(q)).slice(0, 10);
      return { text: l.length ? l.map((p) => `• ${esc(p.title)} — /post ${p.id}`).join("\n") : "Nada encontrado." };
    }
    default:
      return { text: "No conozco ese comando. Escribe /ayuda." };
  }
}

async function arreglar(id: number): Promise<Respuesta> {
  const e = await obtener(id);
  const { contenido, cambios } = limpiarContenido(e.content);
  if (!cambios.length) return { text: `«${esc(e.title)}» no tiene arreglos automáticos pendientes. Los de IA (meta, título, contenido) hazlos desde la app o pídemelos en texto.` };
  return cambiar(id, { content: contenido }, cambios.join(", "));
}

// ---------------------------------------------------------------- botones
async function boton(data: string): Promise<Respuesta | null> {
  const [, accion, valor] = data.split(":");
  const id = Number(valor);
  switch (accion) {
    case "undo": {
      const r = await deshacer(id, "telegram");
      return { text: r ? `↩️ Deshecho. «${esc(r.title)}» vuelve a como estaba.` : "↩️ Deshecho. El ajuste vuelve a como estaba." };
    }
    case "auditar":
      return ficha(id);
    case "fix":
      return arreglar(id);
    case "borrador":
      return cambiar(id, { status: "draft" }, "Pasado a borrador");
    case "publicar":
      return cambiar(id, { status: "publish" }, "Publicado");
    case "cancel":
      await sql`update seo.pending_confirmations set used = true where token = ${valor}`;
      return { text: "Cancelado, no he tocado nada." };
    case "confirm": {
      const [c] = await sql<{ payload: { accion: string; id: number } }[]>`
        update seo.pending_confirmations set used = true where token = ${valor} and not used and expires_at > now() returning payload`;
      if (!c) return { text: "Esa confirmación ya se usó o ha caducado." };
      if (c.payload.accion === "papelera") {
        const accionId = await enviarAPapelera(c.payload.id, { origin: "telegram" });
        return { text: "🗑 Enviado a la papelera.", buttons: [{ text: "↩️ Recuperar", data: `app:undo:${accionId}` }] };
      }
      return { text: "Acción desconocida." };
    }
  }
  return null;
}

// ---------------------------------------------------------------- lenguaje natural (agente con herramientas)
const HERRAMIENTAS = [
  { type: "function", name: "buscar_articulos", description: "Busca artículos del blog por texto (título, tema, keyword). Devuelve id, título, estado y puntuación SEO.", strict: true,
    parameters: { type: "object", additionalProperties: false, required: ["texto"], properties: { texto: { type: "string" } } } },
  { type: "function", name: "ver_articulo", description: "Ficha SEO completa de un artículo: título, meta, keyword, puntuación y problemas.", strict: true,
    parameters: { type: "object", additionalProperties: false, required: ["id"], properties: { id: { type: "integer" } } } },
  { type: "function", name: "cambiar_articulo", description: "Cambia campos de un artículo (solo los que no sean cadena vacía). Queda en el historial y se puede deshacer.", strict: true,
    parameters: { type: "object", additionalProperties: false, required: ["id", "titulo", "titulo_seo", "meta_description", "keyword", "extracto", "categoria_slug", "motivo"],
      properties: { id: { type: "integer" }, titulo: { type: "string" }, titulo_seo: { type: "string" }, meta_description: { type: "string" }, keyword: { type: "string" }, extracto: { type: "string" },
        categoria_slug: { type: "string", description: "noticias-ia | servicios-y-herramientas-de-ia | automatizacion | guias-ia | sobre-la-ia | vacío" }, motivo: { type: "string" } } } },
  { type: "function", name: "cambiar_estado", description: "Publica o pasa a borrador un artículo.", strict: true,
    parameters: { type: "object", additionalProperties: false, required: ["id", "estado"], properties: { id: { type: "integer" }, estado: { type: "string", enum: ["publish", "draft"] } } } },
  { type: "function", name: "pedir_borrado", description: "Pide confirmación para enviar un artículo a la papelera (nunca borra sin que el usuario pulse el botón).", strict: true,
    parameters: { type: "object", additionalProperties: false, required: ["id"], properties: { id: { type: "integer" } } } },
  { type: "function", name: "arreglos_seguros", description: "Aplica los arreglos automáticos sin IA (schema duplicado, firma, enlaces de contacto).", strict: true,
    parameters: { type: "object", additionalProperties: false, required: ["id"], properties: { id: { type: "integer" } } } },
  { type: "function", name: "estado_web", description: "Resumen de la salud SEO del sitio.", strict: true, parameters: { type: "object", additionalProperties: false, required: [], properties: {} } },
  { type: "function", name: "investigar_tema", description: "Busca en la web las mejores noticias y publicaciones recientes sobre un tema para decidir qué publicar (envía al usuario las mejores fuentes con botón para preparar el artículo).", strict: true,
    parameters: { type: "object", additionalProperties: false, required: ["tema"], properties: { tema: { type: "string" } } } },
  { type: "function", name: "preparar_noticia", description: "Prepara el brief de una noticia (URL) para publicarla.", strict: true,
    parameters: { type: "object", additionalProperties: false, required: ["url"], properties: { url: { type: "string" } } } },
];

async function ejecutarHerramienta(l: LlamadaHerramienta, botones: Boton[]): Promise<string> {
  const a = JSON.parse(l.arguments || "{}");
  try {
    switch (l.name) {
      case "buscar_articulos": {
        const inv = await inventario();
        const q = String(a.texto).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
        const palabras = q.split(/\s+/).filter((w: string) => w.length > 2);
        const r = inv.posts.map((p) => {
          const t = `${p.title} ${p.analisis.keyword} ${p.slug}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
          return { p, s: palabras.filter((w: string) => t.includes(w)).length };
        }).filter((x) => x.s > 0).sort((x, y) => y.s - x.s).slice(0, 8);
        return JSON.stringify(r.map(({ p }) => ({ id: p.id, titulo: p.title, estado: p.status, seo: p.analisis.score, keyword: p.analisis.keyword })));
      }
      case "ver_articulo": {
        const e = await obtener(a.id);
        await recordar(a.id);
        const an = analizar(e, { anio: anioActual() });
        return JSON.stringify({ id: e.id, titulo: e.title, estado: e.status, url: e.link, titulo_seo: e.meta.rank_math_title, meta: e.meta.rank_math_description, keyword: e.meta.rank_math_focus_keyword, extracto: e.excerpt, seo: an.score, problemas: an.problemas.map((x) => x.titulo), palabras: an.metricas.palabras });
      }
      case "cambiar_articulo": {
        const c: Cambios = {};
        if (a.titulo) c.title = a.titulo;
        if (a.extracto) c.excerpt = a.extracto;
        const meta: Record<string, string> = {};
        if (a.titulo_seo) meta.rank_math_title = a.titulo_seo;
        if (a.meta_description) meta.rank_math_description = a.meta_description;
        if (a.keyword) meta.rank_math_focus_keyword = a.keyword;
        if (Object.keys(meta).length) c.meta = meta;
        if (a.categoria_slug) {
          const cat = (await categorias()).find((x) => x.slug === a.categoria_slug);
          if (cat) c.categories = [cat.id];
        }
        if (!Object.keys(c).length) return "No había nada que cambiar.";
        const r = await editar(a.id, c, { origin: "telegram", motivo: a.motivo || "Cambio por Telegram" });
        botones.splice(0, botones.length, { text: "↩️ Deshacer", data: `app:undo:${r.accion}` });
        return `Hecho. Nuevo SEO: ${analizar(r.entrada, { anio: anioActual() }).score}/100`;
      }
      case "cambiar_estado": {
        const r = await editar(a.id, { status: a.estado }, { origin: "telegram", motivo: a.estado === "publish" ? "Publicado" : "Pasado a borrador" });
        botones.splice(0, botones.length, { text: "↩️ Deshacer", data: `app:undo:${r.accion}` });
        return `Hecho: ${a.estado === "publish" ? "publicado" : "en borrador"}.`;
      }
      case "pedir_borrado": {
        const e = await obtener(a.id);
        const c = await pedirConfirmacion({ accion: "papelera", id: a.id }, "");
        botones.splice(0, botones.length, ...(c.buttons ?? []));
        return `Confirmación pedida para borrar «${e.title}». El usuario debe pulsar el botón.`;
      }
      case "arreglos_seguros": {
        const r = await arreglar(a.id);
        if (r.buttons) botones.splice(0, botones.length, ...r.buttons);
        return r.text.replace(/<[^>]+>/g, "");
      }
      case "estado_web":
        return (await estado()).text.replace(/<[^>]+>/g, "");
      case "investigar_tema": {
        const r = await comando("/tema " + a.tema);
        await telegram(r.text, r.buttons ?? []);
        return "Búsqueda hecha y enviada al usuario con las fuentes y botones. Resume en una frase y no repitas la lista.";
      }
      case "preparar_noticia":
        await publicador({ action: "brief_url", url: a.url });
        return "Enviada al publicador: el brief llegará en ~1 minuto con botones para aprobar.";
    }
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : e}`;
  }
  return "Herramienta desconocida";
}

async function conversar(texto: string): Promise<Respuesta> {
  const ultimo = await ultimoPost();
  const sistema = `Eres el asistente SEO de transformaconia.com en Telegram. Hablas con Juan Carlos (el dueño), en español de España, breve y claro. Usas las herramientas para consultar y cambiar artículos de WordPress. Antes de cambiar algo, si no sabes el id, búscalo. Para borrar SIEMPRE usas pedir_borrado (nunca borras directamente). Los cambios se pueden deshacer con el botón que aparece. Cuando propongas textos SEO: título ≤60 caracteres, meta 130-155 con la keyword, sin inventar datos ni años. ${ultimo ? `El último artículo del que se habló es el #${ultimo}; si dice "este" o "el artículo" se refiere a ese.` : ""} Responde en texto plano (sin Markdown).`;
  const input: unknown[] = [{ role: "user", content: texto }];
  const botones: Boton[] = [];
  for (let vuelta = 0; vuelta < 5; vuelta++) {
    const r = await agente(input, HERRAMIENTAS, sistema);
    if (!r.llamadas.length) return { text: esc(r.texto || "Hecho."), buttons: botones };
    input.push(...r.output);
    for (const l of r.llamadas) input.push({ type: "function_call_output", call_id: l.call_id, output: await ejecutarHerramienta(l, botones) });
  }
  return { text: "He hecho varias cosas; revisa el historial en la app.", buttons: botones };
}

// ---------------------------------------------------------------- entrada
type Update = { message?: { text?: string; voice?: unknown; photo?: unknown }; callback_query?: { data?: string } };

export async function atender(update: Update) {
  let r: Respuesta | null = null;
  try {
    if (update.callback_query?.data?.startsWith("app:")) r = await boton(update.callback_query.data);
    else if (update.message?.text?.startsWith("/")) r = await comando(update.message.text);
    else if (update.message?.text) r = await conversar(update.message.text);
    else if (update.message?.voice) r = { text: "De momento solo entiendo texto. Escríbemelo y lo hago 🙂" };
  } catch (e) {
    r = { text: `⚠️ No he podido hacerlo: ${esc(e instanceof Error ? e.message : String(e))}` };
    await registrar({ origin: "telegram", action: "error", summary: "Error atendiendo Telegram", status: "failed", error: String(e) }).catch(() => null);
  }
  if (r) await telegram(r.text, r.buttons ?? []);
  return r;
}
