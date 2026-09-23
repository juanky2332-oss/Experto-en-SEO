import "server-only";

// La app nunca tiene las claves de WordPress ni de Telegram: se las guarda n8n.
// Todo pasa por el flujo "SEO PASARELA" (webhook con cabecera X-Seo-Key).
const BASE = process.env.N8N_BASE ?? "https://paneln8n.transformaconia.com";
const KEY = process.env.SEO_GATEWAY_KEY ?? "";

async function call<T>(path: string, body: unknown, timeoutMs = 90_000): Promise<T> {
  const r = await fetch(`${BASE}/webhook/${path}`, {
    method: "POST",
    headers: { "X-Seo-Key": KEY, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Pasarela n8n ${path} → ${r.status}: ${text.slice(0, 300)}`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Respuesta no JSON de la pasarela: ${text.slice(0, 200)}`);
  }
}

export type WpResp<T> = { status: number; total: string | null; totalPages: string | null; data: T };

export class WpError extends Error {
  constructor(public status: number, public data: unknown) {
    const msg = (data as { message?: string })?.message ?? JSON.stringify(data).slice(0, 200);
    super(`WordPress ${status}: ${msg}`);
  }
}

export async function wp<T = unknown>(method: string, path: string, body?: unknown): Promise<WpResp<T>> {
  const r = await call<WpResp<T>>("seo-pasarela", { action: "wp", method, path, body });
  if (r.status >= 400) throw new WpError(r.status, r.data);
  return r;
}

export async function subirMedio(filename: string, mime: string, base64: string) {
  const r = await call<WpResp<{ id: number; source_url: string }>>("seo-pasarela", { action: "media", filename, mime, base64 }, 180_000);
  if (r.status >= 400) throw new WpError(r.status, r.data);
  return r.data;
}

export type Boton = { text: string; data: string };

/** Mensaje a Telegram (HTML). Nunca rompe el flujo si Telegram falla. */
export async function telegram(text: string, buttons: Boton[] = []) {
  try {
    return await call<{ ok: boolean }>("seo-pasarela", { action: "tg", text: text.slice(0, 4000), buttons: buttons.slice(0, 2) });
  } catch (e) {
    console.error("telegram", e);
    return { ok: false };
  }
}

/** Dispara el publicador de n8n (brief de una URL, brief de una noticia del radar, publicar o descartar). */
export async function publicador(body:
  | { action: "brief_url"; url: string }
  | { action: "brief_radar"; radar_id: number }
  | { action: "publish"; brief_id: string }
  | { action: "reject"; brief_id: string }) {
  return call<{ ok: boolean }>("seo-publicador", body, 30_000);
}

export async function lanzarRadar() {
  return call<{ ok: boolean }>("seo-radar", {}, 30_000);
}

export const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** OpenAI con la credencial de n8n (una sola cuenta de OpenAI para todo el sistema). */
export async function openaiN8n(endpoint: "responses" | "images/generations", body: unknown, timeoutMs = 280_000) {
  let ultimo: { status: number; data: unknown } = { status: 0, data: null };
  for (let intento = 0; intento < 3; intento++) {
    ultimo = await call<{ status: number; data: unknown }>("seo-pasarela", { action: "openai", endpoint, body }, timeoutMs);
    if (ultimo.status !== 429 && ultimo.status < 500) return ultimo;
    await new Promise((s) => setTimeout(s, 4000 * (intento + 1)));
  }
  return ultimo;
}
