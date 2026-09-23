// Cliente de la SEO PASARELA para scripts locales (mantenimiento del sitio).
import './lib.mjs';
export async function gw(body) {
  const r = await fetch(process.env.N8N_BASE + '/webhook/seo-pasarela', {
    method: 'POST', headers: { 'X-Seo-Key': process.env.SEO_GATEWAY_KEY, 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body),
  });
  const t = await r.text(); try { return JSON.parse(t); } catch { return { status: r.status, raw: t }; }
}
export const wp = (method, path, body) => gw({ action: 'wp', method, path, body });
