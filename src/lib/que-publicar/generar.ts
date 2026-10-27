import "server-only";
import { createHash } from "node:crypto";
import { sql } from "../db";
import { json, MODELO_RAPIDO, type Uso } from "../ai";
import { registrar, type Origen } from "../acciones";
import { guiaATexto, normalizar, TIPO_CLAVES } from "../guia";
import { recogerSenales, type Senales } from "./senales";
import { DESTINOS, SENALES, motivoDescarte, puntuar, mismoTema, tokens, PESOS_VACIOS, type Candidato, type Contexto, type PorQue, type Pesos } from "./prioridad";
import { calcularPesos, type Feedback } from "./aprender";
import { mismaConsulta, redondea } from "./gsc-senal";

// Tarifa aproximada de gpt-5.4-mini (USD por millón de tokens) para mostrar el coste; revisar si cambia.
const PRECIO = { entrada: 0.75, cacheada: 0.075, salida: 4.5 };
const USD_EUR = 0.92;
export const COSTE_ESTIMADO = "0,02-0,04 €";

export function costeEuros(u: Uso) {
  const cache = u.input_tokens_details?.cached_tokens ?? 0;
  const usd = (((u.input_tokens ?? 0) - cache) * PRECIO.entrada + cache * PRECIO.cacheada + (u.output_tokens ?? 0) * PRECIO.salida) / 1e6;
  return Math.round(usd * USD_EUR * 10000) / 10000;
}

type Cache = { hash: string; lote: string; fecha: string; candidatos: Candidato[]; coste_eur: number; tokens?: Uso };

// ---------------------------------------------------------------- pesos aprendidos (seo.settings 'qp_pesos')
export async function recalcularPesos(): Promise<Pesos> {
  const fb = await sql<Feedback[]>`select created_at, voto, pilar, destino, tipo, fuente, tokens from seo.qp_feedback where created_at > now() - interval '365 days'`;
  const pesos = calcularPesos(fb);
  await sql`insert into seo.settings (key, value) values ('qp_pesos', ${sql.json(pesos as never)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  return pesos;
}

// ---------------------------------------------------------------- la llamada a la IA
const SISTEMA = `Eres el estratega SEO de Transforma con IA (transformaconia.com), un grupo de expertos en IA de Murcia que hace consultoría de inteligencia artificial y automatización para la industria. Decides QUÉ PUBLICAR a continuación en la web: artículos del blog, ampliaciones de páginas existentes, páginas de sector, páginas locales o preguntas frecuentes.

Prioridades del negocio, por este orden: 1) IA y automatización para empresas INDUSTRIALES de toda España (talleres, mantenimiento, instaladoras, fabricación, distribución técnica; procesos de facturas y documentos, presupuestos, partes y albaranes, ERP, stock y repuestos, calidad, informes); 2) Murcia y Región de Murcia; 3) IA general sin diluir el foco.

Reglas obligatorias:
- Nunca nombres herramientas internas ni marcas de IA (n8n, OpenAI, ChatGPT, GPT, Claude, Anthropic, Gemini, Copilot, Zapier, Make, MCP…) ni Flownexion en título, keyword, secundarias ni CTA: se habla del proceso y del resultado.
- Nunca nombres de persona, clientes, testimonios ni cifras inventadas.
- No hay datos de volumen de búsqueda: NO escribas cifras de búsquedas, visitas ni clics estimados.
- Verifactu: el programa de gestión no lo cumple todavía y la fecha de obligación no está confirmada; no afirmes fechas que no estén en PLAZOS.
- Nada que ya esté PROGRAMADO o PUBLICADO con la misma intención de búsqueda. Si una página existente ya trata el tema, propón «ampliar_pagina» con su ruta en destino_ref.
- Search Console (GSC_CERCA y GSC_SIN_PAGINA) son datos reales de Google de los últimos 28 días. Para cada oportunidad de GSC_CERCA (hasta 3, las primeras) propón «ampliar_pagina» sobre la página indicada, con la consulta como keyword; para cada una de GSC_SIN_PAGINA (hasta 3, las primeras) propón un artículo nuevo o una página con la consulta como keyword. Cita la señal gsc_cerca o gsc_sin_pagina, pero NO escribas cifras de GSC: el sistema las añade.
- Usa solo rutas que aparezcan en PÁGINAS o ARTÍCULOS para destino_ref y enlaces.

Campos de cada candidato:
- titulo: H1 de 45-65 caracteres, en español de España, primera letra en mayúscula.
- keyword: lo que se teclea en Google España (2-6 palabras, minúsculas). secundarias: 2-4 variantes.
- intencion: informacional, comercial, transaccional o local. publico: a quién va (1 frase corta).
- pilar: nombre EXACTO de un pilar de la guía. tipo: ${TIPO_CLAVES.join(", ")}.
- destino: articulo (post nuevo), ampliar_pagina (añadir sección a una página existente), pagina_sector, pagina_local o faq (preguntas frecuentes en una página existente). destino_ref: ruta /slug/ de la página afectada o, si es artículo, la página comercial a la que debe llevar.
- enlaces: 2-4 enlaces internos {url: ruta /slug/, ancla}. cta: llamada a la acción (diagnóstico gratis, /erp-industria/…).
- por_que: 1-3 señales «por qué ahora» de esta lista, citando el dato concreto que te doy: radar (noticia del radar, con su id en radar_id), hueco_pilar (pilar con 0-1 artículos), canibalizacion o huerfano (hueco de la auditoría), sin_trafico (la página destino no tiene visitas), plazo (un plazo de PLAZOS), conversion (la página destino convierte), tema_favor (coincide con un tema preferido), gsc_cerca o gsc_sin_pagina (oportunidades de Search Console). No inventes señales.
- esfuerzo: bajo (FAQ o ampliar con 1 sección), medio (artículo normal) o alto (página nueva o pilar).
- radar_id: id de la noticia del radar o 0.

Devuelve 12-15 candidatos variados (al menos 4 de procesos industriales, 2 de sectores, 2 de Murcia o local y al menos 3 que no sean artículos nuevos).
NOTICIAS: si el RADAR trae noticias, al menos 5 candidatos deben ser ARTÍCULOS que partan de una noticia concreta (señal radar con su radar_id), aterrizada a lo que significa para una empresa industrial española o de Murcia (qué cambia, qué hacer, ejemplo práctico). Los dos mejores candidatos de todos deben ser de noticia si hay alguna con puntuación alta. Nunca copies el titular de la noticia: el titular es nuestro y responde a lo que buscaría un gerente.`;

const str = { type: "string" } as const;
const ESQUEMA = {
  type: "object", additionalProperties: false, required: ["candidatos"],
  properties: {
    candidatos: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        required: ["titulo", "keyword", "secundarias", "intencion", "publico", "pilar", "tipo", "destino", "destino_ref", "enlaces", "cta", "por_que", "esfuerzo", "radar_id"],
        properties: {
          titulo: str, keyword: str, secundarias: { type: "array", items: str },
          intencion: { type: "string", enum: ["informacional", "comercial", "transaccional", "local"] }, publico: str, pilar: str,
          tipo: { type: "string", enum: TIPO_CLAVES }, destino: { type: "string", enum: DESTINOS }, destino_ref: str,
          enlaces: { type: "array", items: { type: "object", additionalProperties: false, required: ["url", "ancla"], properties: { url: str, ancla: str } } },
          cta: str,
          por_que: { type: "array", items: { type: "object", additionalProperties: false, required: ["senal", "detalle"], properties: { senal: { type: "string", enum: SENALES }, detalle: str } } },
          esfuerzo: { type: "string", enum: ["bajo", "medio", "alto"] }, radar_id: { type: "integer" },
        },
      },
    },
  },
};

function textoSenales(s: Senales) {
  const l = (xs: string[]) => (xs.length ? xs.join("\n") : "- (ninguno)");
  return [
    `PILARES Y COBERTURA (artículos publicados · último):\n${l(s.pilares.map((p) => `- ${p.nombre} [${p.categoria}]: ${p.total}${p.ultimo ? ` · ${p.ultimo.slice(0, 10)}` : " · nunca"}`))}`,
    `PROGRAMADOS O YA REDACTADOS EN BORRADOR (no repetir):\n${l(s.programados.map((p) => `- ${p.fecha} · ${p.titulo} · ${p.keyword}`))}`,
    `ARTÍCULOS PUBLICADOS (ruta · título · keyword):\n${l(s.publicados.map((p) => `- /${p.slug}/ · ${p.titulo} · ${p.keyword.split(",")[0]}`))}`,
    `PÁGINAS (ruta · título · keyword · visitas 30 días · conversiones):\n${l(s.paginas.map((p) => `- ${p.ruta} · ${p.titulo} · ${p.keyword} · ${p.visitas30} · ${p.conversiones}`))}`,
    `PÁGINAS SIN VISITAS EN 30 DÍAS${s.medicionDesde ? ` (medición desde ${s.medicionDesde})` : ""}: ${s.sinVisitas.join(" ") || "ninguna"}`,
    `AUDITORÍA · canibalización:\n${l(s.canibalizacion.slice(0, 10).map((c) => `- ${c.titulo} ↔ ${c.con}`))}`,
    `AUDITORÍA · artículos huérfanos (nadie los enlaza):\n${l(s.huerfanos.slice(0, 15).map((h) => `- /${h.slug}/ · ${h.titulo}`))}`,
    `PLAZOS:\n${l(s.plazos.map((p) => `- ${p.titulo}: ${p.fecha ?? "fecha por confirmar"} (${p.estado.replace("_", " ")}). ${p.nota}`))}`,
    `RADAR (últimos 14 días, id · puntuación · titular · keyword):\n${s.radar.length ? s.radar.map((r) => `- ${r.id} · ${r.score} · ${r.titulo} · ${r.keyword}`).join("\n") : "- sin noticias recientes: no uses la señal «radar»"}`,
    `SEARCH CONSOLE${s.gsc.fecha ? ` (28 días hasta ${s.gsc.fecha})` : " (sin datos)"}
GSC_CERCA (consulta · página que posiciona · posición · impresiones; casi en página 1):
${l(s.gsc.cerca.slice(0, 8).map((o) => `- ${o.consulta} · ${o.pagina} · ${redondea(o.posicion)} · ${o.impresiones}`))}
GSC_SIN_PAGINA (consulta · página que posiciona · impresiones; ninguna página centrada en ella):
${l(s.gsc.sinPagina.slice(0, 8).map((o) => `- ${o.consulta} · ${o.pagina} · ${o.impresiones}`))}`,
    `TEMAS PREFERIDOS: ${s.radarCfg.temas.join(", ") || "ninguno"}`,
    `TEMAS EN CONTRA (no proponer): ${s.radarCfg.excluir.join(", ") || "ninguno"}`,
  ].join("\n\n");
}

function huella(s: Senales) {
  const datos = {
    v: s.guia.version, pil: s.pilares.map((p) => [p.nombre, p.total]), prog: s.programados.map((p) => [p.id, p.keyword]),
    pub: s.publicados.map((p) => p.keyword), pag: s.paginas.map((p) => [p.slug, p.keyword, p.visitas30 > 0, p.conversiones]),
    radar: s.radar.map((r) => r.id), plazos: s.plazos, temas: s.radarCfg.temas, excluir: s.radarCfg.excluir,
    canib: s.canibalizacion.length, huerf: s.huerfanos.length,
    gsc: [s.gsc.cerca.map((o) => [o.consulta, o.pagina]), s.gsc.sinPagina.map((o) => [o.consulta, o.pagina])],
  };
  return createHash("sha256").update(JSON.stringify(datos)).digest("hex").slice(0, 16);
}

// ---------------------------------------------------------------- validación en código
const rutaInterna = (u: string) => {
  const r = u.trim().replace(/^https?:\/\/(www\.)?transformaconia\.com/i, "");
  if (!r.startsWith("/")) return "";
  return r.replace(/[?#].*$/, "").replace(/\/?$/, "/");
};

function validar(c: Candidato, s: Senales, rutas: Set<string>): Candidato {
  const pilar = s.guia.pilares.find((p) => normalizar(p.nombre) === normalizar(c.pilar));
  let ref = rutaInterna(c.destino_ref);
  if (!rutas.has(ref)) ref = pilar?.destinos?.find((d) => rutas.has(d)) ?? "";
  const enlaces = c.enlaces.map((e) => ({ url: rutaInterna(e.url), ancla: e.ancla.trim() })).filter((e) => rutas.has(e.url) && e.ancla).slice(0, 4);
  const texto = `${c.titulo} ${c.keyword} ${c.secundarias.join(" ")}`;
  const total = s.pilares.find((p) => p.nombre === pilar?.nombre)?.total ?? 99;
  // cada keyword del plazo es una expresión concreta («cheque tic», «verifactu»), no una palabra suelta como «murcia»
  const plazo = s.plazos.find((p) => p.keywords.some((k) => normalizar(k).length > 4 && normalizar(texto).includes(normalizar(k))));
  const radar = s.radar.find((r) => r.id === c.radar_id) ?? s.radar.find((r) => mismoTema(c.keyword, r.keyword));
  const comprobada = (x: PorQue) => {
    switch (x.senal) {
      case "radar": return !!radar;
      case "hueco_pilar": return total <= 1;
      case "canibalizacion": return s.canibalizacion.length > 0;
      case "huerfano": return s.huerfanos.length > 0;
      case "sin_trafico": return s.sinVisitas.includes(ref);
      case "plazo": return !!plazo;
      case "conversion": return (s.conversiones[ref] ?? 0) > 0;
      case "gsc_cerca": case "gsc_sin_pagina": return false; // se calculan en código más abajo, nunca las da la IA
      case "tema_favor": return s.radarCfg.temas.some((t) => mismoTema(texto, t) || tokens(t).every((w) => tokens(texto).includes(w)));
    }
  };
  const por_que = c.por_que.filter(comprobada).filter((x, i, a) => a.findIndex((y) => y.senal === x.senal) === i);
  // señales que se comprueban en código aunque la IA no las cite
  const tiene = (k: string) => por_que.some((x) => x.senal === k);
  if (!tiene("hueco_pilar") && total === 0 && pilar) por_que.push({ senal: "hueco_pilar", detalle: `El pilar «${pilar.nombre}» aún no tiene artículos.` });
  if (!tiene("sin_trafico") && ref && s.sinVisitas.includes(ref)) por_que.push({ senal: "sin_trafico", detalle: `${ref} no ha tenido visitas en 30 días.` });
  if (!tiene("plazo") && plazo) por_que.push({ senal: "plazo", detalle: `${plazo.titulo} (${plazo.fecha ?? "fecha por confirmar"}).` });
  // Search Console: dato real, calculado aquí (nunca el texto de la IA)
  const cerca = s.gsc.cerca.find((o) => mismaConsulta(c.keyword, o.consulta));
  const sinPag = cerca ? undefined : s.gsc.sinPagina.find((o) => mismaConsulta(c.keyword, o.consulta));
  const gscPorQue: PorQue[] = [];
  if (cerca) gscPorQue.push({ senal: "gsc_cerca", detalle: `«${cerca.consulta}» sale en Google en la posición ${redondea(cerca.posicion).toString().replace(".", ",")} con ${cerca.impresiones} impresiones en 28 días (página ${cerca.pagina}): ampliarla puede llevarla a la primera página.`, gsc: { impresiones: cerca.impresiones, posicion: redondea(cerca.posicion) } });
  if (sinPag) gscPorQue.push({ senal: "gsc_sin_pagina", detalle: `«${sinPag.consulta}» tiene ${sinPag.impresiones} impresiones en 28 días y la página que sale (${sinPag.pagina}) no está centrada en esa búsqueda.`, gsc: { impresiones: sinPag.impresiones, posicion: redondea(sinPag.posicion) } });
  por_que.unshift(...gscPorQue);
  // una «página de sector/local» cuya ruta ya existe es, en realidad, ampliar esa página
  // una consulta casi en página 1 se resuelve ampliando la página que ya posiciona, no con un artículo duplicado
  if (cerca && rutas.has(cerca.pagina) && (c.destino === "articulo" || c.destino === "faq")) ref = cerca.pagina;
  const destino = cerca && rutas.has(cerca.pagina) && (c.destino === "articulo" || c.destino === "faq") ? "ampliar_pagina" : (c.destino === "pagina_sector" || c.destino === "pagina_local") && ref && s.paginas.some((p) => p.ruta === ref) ? "ampliar_pagina" : c.destino;
  return {
    ...c, destino, titulo: c.titulo.trim(), keyword: c.keyword.trim().toLowerCase(), secundarias: c.secundarias.map((x) => x.trim()).filter(Boolean).slice(0, 4),
    pilar: pilar?.nombre ?? c.pilar, destino_ref: ref, enlaces, por_que: por_que.slice(0, 4), radar_id: radar?.id ?? null,
  };
}

export type ResultadoLote = { lote: string; n: number; descartados: { titulo: string; motivo: string }[]; coste_eur: number; reutilizado: boolean };

/**
 * Genera un lote de recomendaciones. Una sola llamada a gpt-5.4-mini (sin búsqueda web);
 * si las señales no han cambiado desde el último lote, reutiliza los candidatos y solo recalcula la prioridad (0 €).
 */
export async function generarQuePublicar(o: { origin: Origen; forzar?: boolean }): Promise<ResultadoLote> {
  const s = await recogerSenales();
  const [[cacheRow], pesos, previas] = await Promise.all([
    sql<{ value: Cache }[]>`select value from seo.settings where key = 'qp_cache'`,
    recalcularPesos().catch(() => PESOS_VACIOS),
    sql<{ keyword: string; estado: string }[]>`select keyword, estado from seo.qp_recs where estado <> 'abierta'`,
  ]);
  const hash = huella(s);
  let candidatos: Candidato[];
  let coste = 0;
  let uso: Uso | undefined;
  const reutilizado = !o.forzar && cacheRow?.value?.hash === hash && (cacheRow.value.candidatos?.length ?? 0) > 0;
  if (reutilizado) candidatos = cacheRow.value.candidatos;
  else {
    const r = await json<{ candidatos: (Omit<Candidato, "radar_id"> & { radar_id: number })[] }>({
      nombre: "que_publicar", modelo: MODELO_RAPIDO, esfuerzo: "low", maxTokens: 12000,
      sistema: `${SISTEMA}\n\nGUÍA EDITORIAL:\n${guiaATexto(s.guia)}`,
      usuario: `Hoy es ${new Date().toISOString().slice(0, 10)}. Estas son las señales de la web:\n\n${textoSenales(s)}`,
      esquema: ESQUEMA, alUsar: (u) => { uso = u; },
    });
    coste = uso ? costeEuros(uso) : 0;
    candidatos = r.candidatos.map((c) => ({ ...c, radar_id: c.radar_id || null }));
  }

  const rutas = new Set(["/blog/", ...s.paginas.map((p) => p.ruta), ...s.publicados.map((p) => `/${p.slug}/`), "/contacto/", "/industria/", "/casos/", "/soluciones/"]);
  const ctx: Contexto = {
    categoriaPilar: Object.fromEntries(s.guia.pilares.map((p) => [p.nombre, p.categoria])),
    programados: s.programados, publicados: s.publicados, conversiones: s.conversiones, pesos,
  };
  const descartados: ResultadoLote["descartados"] = [];
  const validos: (Candidato & { prioridad: number })[] = [];
  for (const bruto of candidatos) {
    const c = validar(bruto, s, rutas);
    const motivo = motivoDescarte(c)
      ?? (s.radarCfg.excluir.find((e) => normalizar(`${c.titulo} ${c.keyword}`).includes(normalizar(e))) ? "tema en contra" : null)
      ?? (previas.find((p) => ["descartada", "publicada", "interesa", "saltada", "en_brief"].includes(p.estado) && mismoTema(c.keyword, p.keyword)) ? "ya votada antes" : null)
      ?? (validos.find((v) => mismoTema(v.keyword, c.keyword)) ? "repetida en el lote" : null);
    if (motivo) { descartados.push({ titulo: c.titulo, motivo }); continue; }
    const p = puntuar(c, ctx, s.radar.find((r) => r.id === c.radar_id)?.score);
    if (p.descartar) { descartados.push({ titulo: c.titulo, motivo: p.descartar }); continue; }
    validos.push({ ...c, prioridad: p.prioridad });
  }
  validos.sort((a, b) => b.prioridad - a.prioridad);
  const lote = `${new Date().toISOString().slice(0, 10)}-${hash.slice(0, 6)}`;

  // las abiertas sin votar de lotes anteriores se sustituyen (los votos y lo que interesa se conservan)
  // En una transacción y con un candado: si coinciden el cron del lunes y un clic, no se duplica ni queda a medias.
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(4242001)`;
    await tx`delete from seo.qp_recs where estado = 'abierta' and id not in (select rec_id from seo.qp_feedback where rec_id is not null)`;
    // Sin fecha: no se programa nada para más adelante (se publica cuando él lo decide, 24-10-2026).
    for (const v of validos) {
      await tx`insert into seo.qp_recs (lote, titulo, keyword, secundarias, intencion, publico, pilar, tipo, destino, destino_ref, enlaces, cta, por_que, esfuerzo, prioridad, radar_id, fecha_plan)
        values (${lote}, ${v.titulo}, ${v.keyword}, ${v.secundarias}, ${v.intencion}, ${v.publico}, ${v.pilar}, ${v.tipo}, ${v.destino}, ${v.destino_ref || null},
          ${sql.json(v.enlaces as never)}, ${v.cta}, ${sql.json(v.por_que as never)}, ${v.esfuerzo}, ${v.prioridad}, ${v.radar_id}, null)`;
    }
  });
  const cache: Cache = { hash, lote, fecha: new Date().toISOString(), candidatos, coste_eur: reutilizado ? cacheRow.value.coste_eur : coste, tokens: reutilizado ? cacheRow.value.tokens : uso };
  await sql`insert into seo.settings (key, value) values ('qp_cache', ${sql.json(cache as never)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  await registrar({
    origin: o.origin, action: "que_publicar", target_type: "site", target_id: lote,
    summary: `Qué publicar: ${validos.length} recomendaciones (${descartados.length} descartadas por filtros)${reutilizado ? ", sin llamar a la IA porque nada había cambiado" : `, coste ${coste.toFixed(3).replace(".", ",")} €`}`,
    after: { descartados },
  });
  return { lote, n: validos.length, descartados, coste_eur: coste, reutilizado };
}
