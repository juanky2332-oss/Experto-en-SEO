// «Qué publicar»: filtros y prioridad CALCULADA EN CÓDIGO (la IA solo propone candidatos).
// Módulo puro (sin server-only ni base de datos) para poder probarlo con `node --test`.
import { normalizar } from "../guia-base.ts";

export type Destino = "articulo" | "ampliar_pagina" | "pagina_sector" | "pagina_local" | "faq";
export const DESTINOS: Destino[] = ["articulo", "ampliar_pagina", "pagina_sector", "pagina_local", "faq"];
export type Senal = "radar" | "hueco_pilar" | "canibalizacion" | "huerfano" | "sin_trafico" | "plazo" | "conversion" | "tema_favor";
export const SENALES: Senal[] = ["radar", "hueco_pilar", "canibalizacion", "huerfano", "sin_trafico", "plazo", "conversion", "tema_favor"];
export type PorQue = { senal: Senal; detalle: string };

export type Candidato = {
  titulo: string; keyword: string; secundarias: string[]; intencion: string; publico: string;
  pilar: string; tipo: string; destino: Destino; destino_ref: string;
  enlaces: { url: string; ancla: string }[]; cta: string; por_que: PorQue[]; esfuerzo: string; radar_id: number | null;
};

/** Pesos aprendidos de los votos (ver aprender.ts). Cada valor ya viene acotado a ±15. */
export type Pesos = { pilar: Record<string, number>; destino: Record<string, number>; tipo: Record<string, number>; fuente: Record<string, number>; palabra: Record<string, number> };
export const PESOS_VACIOS: Pesos = { pilar: {}, destino: {}, tipo: {}, fuente: {}, palabra: {} };

// ---------------------------------------------------------------- filtros
/** Herramientas internas y marcas de IA que nunca salen en texto público. */
export const RE_MARCAS = /\b(n8n|openai|chat ?gpt|gpt[- ]?\d[\w.]*|gpt|claude|anthropic|gemini|copilot|cursor|zapier|make\.com|mcp|flownexion|perplexity|mistral|deepseek|notebooklm|codex|sora|midjourney)\b/i;
/** Cifras de volumen de búsqueda: no hay dato real (Search Console sin conectar), así que no se aceptan. */
export const RE_VOLUMEN = /(\d[\d.,]*\s*(k\s*)?(b[uú]squedas|busquedas|visitas|clics)(\s*(al|\/|por)\s*mes|\s*mensuales)?)|(volumen[^.]{0,20}\d)/i;
// Palabras con mayúscula que no son nombres de persona (lugares, normativa, producto)
const NO_PERSONA = new Set(["region", "murcia", "molina", "segura", "cartagena", "lorca", "alcantarilla", "elche", "albacete", "espana", "europa", "union", "europea", "ai", "act", "kit", "digital", "consulting", "cheque", "tic", "verifactu", "transformaconia", "gestion", "transforma", "con", "ia", "erp", "borm", "boe", "aeat", "hacienda", "pyme", "pymes", "industria", "excel", "sap", "info", "camara", "comercio", "next", "generation", "fondos", "feder", "cdti", "enisa", "rgpd", "iso", "ce", "la", "el", "los", "las", "de", "del", "y", "en", "qr"]);
const NOMBRES = new Set(["juan", "carlos", "jose", "maria", "antonio", "manuel", "francisco", "david", "javier", "daniel", "pedro", "miguel", "ana", "laura", "carmen", "pablo", "jesus", "alejandro", "luis", "sergio", "fernando", "raul", "marta", "lucia", "elena", "isabel", "sara", "paula", "bautista", "wilson", "fredi", "maikel", "ros"]);

/** Detecta nombres de persona: un nombre propio conocido o dos palabras seguidas con mayúscula que no son lugar ni marca. */
export function pareceNombrePersona(texto: string): boolean {
  const palabras = texto.split(/[\s,.;:()«»"¿?¡!/-]+/).filter(Boolean);
  for (let i = 0; i < palabras.length; i++) {
    const n = normalizar(palabras[i]);
    if (NOMBRES.has(n) && /^[A-ZÁÉÍÓÚÑ]/.test(palabras[i])) return true;
    if (i === 0 || i + 1 >= palabras.length) continue; // la primera palabra del título va en mayúscula siempre
    const a = palabras[i], b = palabras[i + 1];
    const mayus = (w: string) => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñü]{2,}$/.test(w);
    if (mayus(a) && mayus(b) && !NO_PERSONA.has(normalizar(a)) && !NO_PERSONA.has(normalizar(b))) return true;
  }
  return false;
}

const textoPublico = (c: Pick<Candidato, "titulo" | "keyword" | "secundarias" | "cta">) => [c.titulo, c.keyword, ...c.secundarias, c.cta].join(" · ");

/** Motivo por el que un candidato no puede salir, o null si vale. */
export function motivoDescarte(c: Candidato): string | null {
  const t = textoPublico(c);
  const m = t.match(RE_MARCAS);
  if (m) return `marca interna «${m[0]}»`;
  if (pareceNombrePersona(c.titulo) || pareceNombrePersona(c.cta)) return "nombre de persona";
  if (RE_VOLUMEN.test(t) || c.por_que.some((p) => RE_VOLUMEN.test(p.detalle))) return "cifra de volumen sin dato";
  if (c.keyword.trim().length < 3 || c.titulo.trim().length < 10) return "incompleto";
  return null;
}

// ---------------------------------------------------------------- parecido entre temas
const VACIAS = new Set(["de", "la", "el", "en", "para", "con", "por", "los", "las", "un", "una", "unos", "unas", "y", "o", "u", "del", "al", "que", "como", "sin", "su", "sus", "tu", "tus", "se", "lo", "es", "mas", "ia", "a", "e", "qué", "que", "cual", "cuanto", "cuando", "donde", "hoy", "mejor", "guia", "empresa", "empresas", "pyme", "pymes", "industrial", "industriales", "cambia", "cambio", "cambios", "verdad", "necesita", "debe", "tener", "hacer", "tu", "nuestra"]);
/** Palabras significativas de un texto (para comparar y para aprender). */
export function tokens(s: string): string[] {
  return [...new Set(normalizar(s).split(" ").filter((w) => w.length >= 3 && !VACIAS.has(w)))];
}
/** true si dos temas son prácticamente el mismo (keyword contenida o ≥60 % de palabras en común). */
export function mismoTema(a: string, b: string): boolean {
  const na = normalizar(a), nb = normalizar(b);
  if (!na || !nb) return false;
  if (na === nb || (na.length > 8 && nb.includes(na)) || (nb.length > 8 && na.includes(nb))) return true;
  const A = tokens(a), B = new Set(tokens(b));
  if (A.length < 2 || B.size < 2) return false;
  const comunes = A.filter((w) => B.has(w)).length;
  return comunes / Math.min(A.length, B.size) >= 0.6;
}
/** ¿Coincide el candidato con alguna entrada (título + keywords de Rank Math separadas por comas)? */
export function coincideCon(c: Pick<Candidato, "titulo" | "keyword">, e: { titulo: string; keyword: string }): boolean {
  const kws = e.keyword.split(",").map((k) => k.trim()).filter(Boolean);
  return mismoTema(c.keyword, e.titulo) || kws.some((k) => mismoTema(c.keyword, k)) || mismoTema(c.titulo, e.titulo);
}

// ---------------------------------------------------------------- prioridad
const RE_MURCIA = /\b(murcia|murciano|cartagena|lorca|molina de segura|alcantarilla|elche|albacete|region de murcia|mar menor|totana|yecla|jumilla|cieza|aguilas|mazarron)\b/;
const RE_INDUSTRIA = /\b(industri\w*|taller\w*|fabrica\w*|mecaniz\w*|mantenimiento|instalador\w*|instaladora\w*|distribu\w*|erp|albaran\w*|parte\w* de trabajo|factura\w*|stock|repuesto\w*|presupuesto\w*|calidad|almacen\w*|maquina\w*|produccion|caldereria|compras|verifactu|pedido\w*|ordenes de trabajo|averia\w*|trazabilidad)\b/;

export type Contexto = {
  /** categoría de cada pilar (nombre → slug) */
  categoriaPilar: Record<string, string>;
  programados: { titulo: string; keyword: string }[];
  publicados: { titulo: string; keyword: string }[];
  /** conversiones por página de entrada (/slug/ → n) */
  conversiones: Record<string, number>;
  pesos: Pesos;
};

/** Encaje con el posicionamiento: industria 40 · Murcia 25 · IA general 10 (industria + Murcia = 45). */
export function encaje(c: Pick<Candidato, "titulo" | "keyword" | "pilar" | "destino">, categoriaPilar: Record<string, string>): number {
  const t = normalizar(`${c.titulo} ${c.keyword} ${c.pilar}`);
  const cat = categoriaPilar[c.pilar] ?? "";
  const murcia = RE_MURCIA.test(t) || c.destino === "pagina_local";
  const industria = RE_INDUSTRIA.test(t) || (cat !== "" && cat !== "actualidad-ia" && !/murcia/i.test(c.pilar));
  if (industria && murcia) return 45;
  if (industria) return 40;
  if (murcia) return 25;
  return 10;
}

const VALOR_SENAL: Record<Senal, number> = { radar: 10, hueco_pilar: 12, canibalizacion: 8, huerfano: 6, sin_trafico: 10, plazo: 12, conversion: 0, tema_favor: 6 };
/** Puntos por las señales comprobadas (tope 35). Conversiones de la página destino: hasta +5 con 30 conversiones. */
export function puntosSenal(c: Pick<Candidato, "por_que" | "destino_ref">, conversiones: Record<string, number>, radarScore?: number): number {
  let p = 0;
  for (const s of new Set(c.por_que.map((x) => x.senal))) {
    p += VALOR_SENAL[s] ?? 0;
    if (s === "radar" && radarScore) p += Math.max(0, Math.min(10, Math.round((radarScore - 60) / 4)));
  }
  const conv = c.destino_ref ? conversiones[c.destino_ref] ?? 0 : 0;
  p += Math.min(5, (conv / 30) * 5);
  return Math.min(35, p);
}

/** Ajuste por lo aprendido de los votos (tope ±15). */
export function ajusteAprendido(c: Pick<Candidato, "pilar" | "destino" | "tipo" | "keyword" | "por_que">, pesos: Pesos): number {
  const fuente = c.por_que[0]?.senal ?? "guia";
  const pal = tokens(c.keyword).reduce((a, w) => a + (pesos.palabra[w] ?? 0), 0);
  // el pilar manda; destino, tipo y fuente los comparten casi todas las recomendaciones y pesan poco
  const bruto = 2.5 * (pesos.pilar[c.pilar] ?? 0) + 0.25 * ((pesos.destino[c.destino] ?? 0) + (pesos.tipo[c.tipo] ?? 0) + (pesos.fuente[fuente] ?? 0)) + pal;
  return Math.max(-15, Math.min(15, Math.round(bruto)));
}

export type Puntuacion = { prioridad: number; encaje: number; senal: number; aprendido: number; penalizacion: number; descartar: string | null };

/** Prioridad 0-100 = encaje + señal + aprendido − penalización. Coincidir con un programado lo descarta. */
export function puntuar(c: Candidato, ctx: Contexto, radarScore?: number): Puntuacion {
  const e = encaje(c, ctx.categoriaPilar);
  const s = puntosSenal(c, ctx.conversiones, radarScore);
  const a = ajusteAprendido(c, ctx.pesos);
  const prog = ctx.programados.find((p) => coincideCon(c, p));
  if (prog) return { prioridad: 0, encaje: e, senal: s, aprendido: a, penalizacion: 100, descartar: `ya programado: «${prog.titulo}»` };
  const pub = c.destino === "articulo" || c.destino === "faq" ? ctx.publicados.find((p) => coincideCon(c, p)) : undefined;
  const pen = pub ? 25 : 0;
  return { prioridad: Math.max(0, Math.min(100, Math.round(e + s + a - pen))), encaje: e, senal: s, aprendido: a, penalizacion: pen, descartar: null };
}
