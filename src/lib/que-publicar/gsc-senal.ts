// Señales de Search Console para «Qué publicar». Módulo puro (sin base de datos) para poder probarlo con `node --test`.
// Solo usa datos reales de Google: nunca se estima ni se inventa nada.
import { normalizar } from "../guia-base.ts";
import { tokens } from "./prioridad.ts";

export type FilaConsulta = { pagina: string; consulta: string; clics: number; impresiones: number; posicion: number };
export type OportunidadGsc = { consulta: string; pagina: string; clics: number; impresiones: number; posicion: number };

export const GSC_POS_MIN = 8;
export const GSC_POS_MAX = 30;
export const GSC_IMPR_CERCA = 5; // impresiones en 28 días para considerar «casi en página 1»
export const GSC_IMPR_SIN_PAGINA = 10; // impresiones en 28 días para pedir una página/artículo propio

const RE_MARCA_PROPIA = /\btransforma ?(con)? ?ia\b/;

/** Une las filas de una misma consulta en varias páginas: impresiones y clics sumados, posición ponderada, página principal = la de más impresiones. */
export function agruparConsultas(filas: FilaConsulta[]): OportunidadGsc[] {
  const m = new Map<string, { f: FilaConsulta[] }>();
  for (const f of filas) {
    if (!f.consulta) continue;
    const k = normalizar(f.consulta);
    if (!m.has(k)) m.set(k, { f: [] });
    m.get(k)!.f.push(f);
  }
  return [...m.values()].map(({ f }) => {
    const impresiones = f.reduce((a, x) => a + x.impresiones, 0);
    const principal = [...f].sort((a, b) => b.impresiones - a.impresiones)[0];
    const posicion = impresiones ? f.reduce((a, x) => a + x.posicion * x.impresiones, 0) / impresiones : principal.posicion;
    return { consulta: principal.consulta, pagina: principal.pagina, clics: f.reduce((a, x) => a + x.clics, 0), impresiones, posicion };
  }).filter((x) => !RE_MARCA_PROPIA.test(normalizar(x.consulta)));
}

/** «Casi en página 1»: posición 8-30 con impresiones suficientes. Orden: más impresiones primero. */
export function casiPagina1(filas: FilaConsulta[]): OportunidadGsc[] {
  return agruparConsultas(filas)
    .filter((x) => x.posicion >= GSC_POS_MIN && x.posicion <= GSC_POS_MAX && x.impresiones >= GSC_IMPR_CERCA)
    .sort((a, b) => b.impresiones - a.impresiones);
}

/**
 * «Consulta sin página dedicada»: muchas impresiones y la página que posiciona no está centrada en la consulta
 * (alguna palabra significativa de la consulta no aparece en su título, keyword ni dirección).
 * `textoPagina` da el texto de una ruta (título + keyword + slug) o undefined si no se conoce.
 */
export function sinPaginaDedicada(filas: FilaConsulta[], textoPagina: (ruta: string) => string | undefined): OportunidadGsc[] {
  return agruparConsultas(filas)
    .filter((x) => {
      if (x.impresiones < GSC_IMPR_SIN_PAGINA) return false;
      const texto = textoPagina(x.pagina);
      if (texto === undefined) return false;
      const t = new Set(tokens(texto));
      const q = tokens(x.consulta);
      return q.length >= 2 && q.some((w) => !t.has(w));
    })
    .sort((a, b) => b.impresiones - a.impresiones);
}

export const redondea = (n: number) => Math.round(n * 10) / 10;

/** Texto para el chip y el «por qué ahora»; sin las palabras «búsquedas», «visitas» ni «clics» (el filtro las toma por volumen inventado). */
export const chipGsc = (o: Pick<OportunidadGsc, "impresiones" | "posicion">) => `GSC: ${o.impresiones} impresiones · posición ${redondea(o.posicion).toString().replace(".", ",")}`;

/** ¿La consulta de Google trata del mismo tema que la keyword del candidato? Todas las palabras de la consulta en la keyword o al revés. */
export function mismaConsulta(keyword: string, consulta: string): boolean {
  const a = tokens(keyword), b = tokens(consulta);
  if (!a.length || !b.length) return false;
  const A = new Set(a), B = new Set(b);
  return b.every((w) => A.has(w)) || a.every((w) => B.has(w));
}
