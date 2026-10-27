import "server-only";
import { json, MODELO } from "@/lib/ai";

// Control de calidad ANTES de subir nada a Instagram (decidido el 27-10-2026: «antes de subir nada, piénsalo bien, que no sea
// repetitivo y que el conjunto de la cuenta quede bien»). Guía completa: agente-ig/ESTILO-CUENTA.md.
//  1) Reglas fijas de la marca (se comprueban con código, nunca las decide la IA).
//  2) Un editor IA compara el texto con las últimas publicaciones y, si repite gancho, estructura, emojis o llamada a la
//     acción, lo reescribe conservando los datos. Lo reescrito vuelve a pasar las reglas fijas; si no las pasa, se queda el original.
//  Si el original incumple las reglas fijas, NO se publica.

const PROHIBIDO: [RegExp, string][] = [
  [/demo gratis|pru[eé]balo gratis/i, "«demo gratis / pruébalo gratis» (el gancho es el diagnóstico gratis)"],
  [/flownexion/i, "Flownexion"],
  [/solo por escrito|sin llamadas/i, "«solo por escrito / sin llamadas» (se dice en positivo: «te lo enviamos por escrito»)"],
  [/para el metal\b/i, "«para el metal» (IndunexIA es para la industria)"],
  [/\b(n8n|openai|chatgpt|anthropic|claude)\b|\bgpt[-\s]?\d/i, "herramientas internas por su marca"],
  // «IndunexIA cumple Verifactu», «adaptado a Verifactu», «Verifactu: homologado»… (en cualquier orden, dentro de la misma frase)
  [/(cumple|cumplimos|homologad\w*|adaptad\w*)[^.\n]{0,60}verifactu|verifactu[^.\n]{0,60}(cumple|cumplimos|homologad\w*|adaptad\w*)/i, "afirmar que cumplimos Verifactu"],
];

const hashtags = (t: string) => t.match(/#[\p{L}\p{N}_]+/gu) ?? [];
// cifras del texto (sin los emojis numerados 1️⃣ 2️⃣…, que son forma y no datos)
const numeros = (t: string) => (t.replace(/\d️?⃣/g, "").match(/\d+(?:[.,]\d+)?/g) ?? []).sort().join("|");

/** Problemas de reglas fijas. `noticia`: el texto viene del blog ya revisado; ahí se permite nombrar herramientas (es actualidad). */
export function reglasFijas(texto: string, tipo: string): string[] {
  const p: string[] = [];
  for (const [re, que] of PROHIBIDO) {
    if (tipo === "noticia" && que === "herramientas internas por su marca") continue;
    if (re.test(texto)) p.push(`Incluye ${que}`);
  }
  if (hashtags(texto).length > 5) p.push("Más de 5 hashtags");
  if (texto.length > 2200) p.push("Más de 2.200 caracteres");
  return p;
}

/** Arreglos mecánicos que no cambian el sentido: como mucho 5 hashtags y terminar en espacio (para que Instagram no autocomplete). */
function pulir(texto: string) {
  let t = texto;
  const hs = hashtags(t);
  if (hs.length > 5) for (const h of hs.slice(5)) t = t.replace(new RegExp(`\\s*${h}(?![\\p{L}\\p{N}_])`, "u"), "");
  return t.trimEnd() + " ";
}

// Repeticiones que se miden con código (el editor IA, solo, tiende a decir que todo está bien)
const empiezaPregunta = (t: string) => /^\s*\S{0,3}\s*¿/.test(t);
const tieneLista = (t: string) => /(^|\n)\s*(1[.)]|1\uFE0F?\u20E3)/.test(t);
const ctaDiagnostico = (t: string) => /diagn[oó]stico/i.test(t.split("\n").slice(-4).join(" "));
const flechas = (t: string) => /👇/.test(t) && /👉/.test(t);

function repeticiones(t: string, recientes: string[]) {
  const r: string[] = [];
  const [a, b] = recientes;
  if (ctaDiagnostico(t) && a && b && ctaDiagnostico(a) && ctaDiagnostico(b)) r.push("termina con la misma llamada al diagnóstico que las 2 últimas: usa otra de la lista");
  if (ctaDiagnostico(t) && a && ctaDiagnostico(a)) r.push("la última ya terminaba con el diagnóstico: usa otra llamada a la acción");
  if (empiezaPregunta(t) && recientes.slice(0, 4).filter(empiezaPregunta).length >= 2) r.push("otra vez arranca con una pregunta: arranca con una afirmación, una situación concreta o un ejemplo");
  if (tieneLista(t) && a && tieneLista(a)) r.push("la última ya era una lista numerada: cuéntalo de otra forma (párrafo corto, antes/después o 2-3 frases)");
  if (flechas(t) && recientes.slice(0, 3).filter(flechas).length >= 2) r.push("repite los 👇 y 👉 de las últimas: quítalos o usa otros");
  return [...new Set(r)];
}

export type Revision = { ok: boolean; texto: string; cambios: string[]; problemas: string[]; nota?: string };

export async function revisarTexto(texto: string, tipo: string, recientes: string[]): Promise<Revision> {
  const original = pulir(texto);
  const problemas = reglasFijas(original, tipo);
  if (problemas.length) return { ok: false, texto: original, cambios: [], problemas };
  if (!recientes.length || tipo === "historia") return { ok: true, texto: original, cambios: [], problemas: [], nota: "sin publicaciones con las que comparar" };

  const obligatorio = repeticiones(original, recientes);
  try {
    const r = await json<{ repetitivo: boolean; motivos: string[]; texto: string }>({
      nombre: "editor_instagram",
      modelo: MODELO,
      esfuerzo: "medium",
      maxTokens: 4000,
      sistema:
        "Eres el editor de la cuenta de Instagram de Transforma con IA (Murcia): IA y automatización para talleres, industria y pymes; producto estrella IndunexIA (programa de gestión). " +
        "Te paso el texto que se va a publicar y los de las últimas publicaciones. Tu trabajo: que la cuenta NO se vea repetitiva. " +
        "Marca repetitivo=true solo si el texto nuevo repite claramente lo de las anteriores: el mismo tipo de gancho de arranque (p. ej. otra pregunta «¿Sabes…?» tras varias), la misma estructura (gancho + lista con emojis + «👇»), la misma llamada a la acción final que las 2 últimas, o los mismos emojis. " +
        "Si es repetitivo, reescríbelo cambiando SOLO la forma: otro tipo de gancho (una afirmación rotunda, una situación concreta del taller, un «Ejemplo:», un antes/después), otra estructura y otra llamada a la acción de esta lista, la que no se haya usado en las 2 últimas: " +
        "«Pide tu diagnóstico gratis en transformaconia.com (enlace en el perfil)» · «Guárdalo para cuando lo necesites» · «Cuéntanos en comentarios cómo lo hacéis vosotros» · «Mándaselo a quien lleva los papeles en tu empresa» · «Te lo enviamos por escrito: enlace en el perfil». " +
        "Reglas: castellano de España natural, como se habla en Murcia; cercano y profesional; mismos datos, precios, cifras y nombres que el original (no inventes nada ni quites un precio); 3-5 hashtags específicos al final; 0-4 emojis; nada de «demo gratis»; nunca nombres de herramientas internas; el diagnóstico siempre gratis y por escrito, dicho en positivo. " +
        "Si no es repetitivo, devuelve el texto original tal cual.",
      usuario: `${obligatorio.length ? `REPETICIONES DETECTADAS (tienes que corregirlas: repetitivo=true y reescríbelo):\n- ${obligatorio.join("\n- ")}\n\n` : ""}TEXTO NUEVO (${tipo}):\n${original}\n\nÚLTIMAS PUBLICACIONES (de la más reciente a la más antigua):\n${recientes.map((t, i) => `--- ${i + 1}\n${t.slice(0, 700)}`).join("\n")}`,
      esquema: {
        type: "object", additionalProperties: false, required: ["repetitivo", "motivos", "texto"],
        properties: { repetitivo: { type: "boolean" }, motivos: { type: "array", items: { type: "string" } }, texto: { type: "string" } },
      },
    });
    if ((!r.repetitivo && !obligatorio.length) || !r.texto.trim() || r.texto.trim() === original.trim()) return { ok: true, texto: original, cambios: [], problemas: [], nota: `editor: no lo ve repetitivo (${r.motivos.join("; ") || "sin motivos"})` };
    const nuevo = pulir(r.texto);
    // lo reescrito tiene que cumplir las reglas y conservar todas las cifras del original
    if (reglasFijas(nuevo, tipo).length || numeros(nuevo) !== numeros(original)) return { ok: true, texto: original, cambios: [], problemas: [], nota: "editor: su versión cambiaba cifras o rompía reglas; se queda el original" };
    return { ok: true, texto: nuevo, cambios: [...obligatorio, ...r.motivos].slice(0, 4), problemas: [] };
  } catch (e) {
    console.error("editor_instagram", e);
    return { ok: true, texto: original, cambios: [], problemas: [], nota: `editor con error: ${(e as Error).message}` }; // el editor es una mejora: si falla, vale el original (ya cumple las reglas)
  }
}
