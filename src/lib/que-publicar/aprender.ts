// «Qué publicar»: aprende de los votos del usuario. Módulo puro (se prueba con `node --test`).
// interesa +1 · más como esto +2 · no interesa −2 · ya publicado +1, con vida media de 60 días y tope ±15 por clave.
import { tokens, type Pesos } from "./prioridad.ts";

export type Voto = "interesa" | "no_interesa" | "publicado" | "mas_como_esto";
export const VOTOS: Voto[] = ["interesa", "no_interesa", "publicado", "mas_como_esto"];
export const VALOR_VOTO: Record<Voto, number> = { interesa: 1, mas_como_esto: 2, no_interesa: -2, publicado: 1 };
export const VIDA_MEDIA_DIAS = 60;
export const TOPE = 15;

export type Feedback = { created_at: Date | string; voto: Voto; pilar: string | null; destino: string | null; tipo: string | null; fuente: string | null; tokens: string[] };

const acotar = (x: number) => Math.max(-TOPE, Math.min(TOPE, Math.round(x * 100) / 100));

/** Pesos por pilar, destino, tipo, fuente y palabra de la keyword. */
export function calcularPesos(fb: Feedback[], ahora = Date.now()): Pesos {
  const p: Pesos = { pilar: {}, destino: {}, tipo: {}, fuente: {}, palabra: {} };
  const sumar = (m: Record<string, number>, k: string | null | undefined, v: number) => { if (k) m[k] = (m[k] ?? 0) + v; };
  for (const f of fb) {
    const edad = Math.max(0, (ahora - new Date(f.created_at).getTime()) / 864e5);
    const v = (VALOR_VOTO[f.voto] ?? 0) * Math.pow(0.5, edad / VIDA_MEDIA_DIAS);
    sumar(p.pilar, f.pilar, v);
    sumar(p.destino, f.destino, v);
    sumar(p.tipo, f.tipo, v);
    sumar(p.fuente, f.fuente, v);
    for (const w of f.tokens ?? []) sumar(p.palabra, w, v);
  }
  for (const m of Object.values(p) as Record<string, number>[]) for (const k of Object.keys(m)) m[k] = acotar(m[k]);
  return p;
}

/** Palabras con tres o más «no interesa»: se PROPONEN para «temas en contra» (no se añaden solas). */
export function proponerExclusiones(fb: Feedback[], yaExcluidas: string[] = []): string[] {
  const ya = new Set(yaExcluidas.flatMap((e) => tokens(e)));
  const n = new Map<string, number>();
  for (const f of fb) if (f.voto === "no_interesa") for (const w of f.tokens ?? []) n.set(w, (n.get(w) ?? 0) + 1);
  return [...n.entries()].filter(([w, c]) => c >= 3 && !ya.has(w)).sort((a, b) => b[1] - a[1]).map(([w]) => w);
}

/** Estado en que queda la recomendación tras el voto. */
export function estadoTrasVoto(v: Voto): "interesa" | "descartada" | "publicada" {
  return v === "no_interesa" ? "descartada" : v === "publicado" ? "publicada" : "interesa";
}
