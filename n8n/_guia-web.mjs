// Ajuste de la guía editorial al rediseño de la web (2026-10-08): más peso al decisor de empresa y reglas de títulos.
import postgres from 'postgres';
import { guiaATexto } from '../src/lib/guia-base.ts';
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const [{ value: g }] = await sql`select value from seo.settings where key='guia'`;

g.posicionamiento = 'Transforma con IA es un medio de actualidad de inteligencia artificial explicada para empresas y, a la vez, el servicio que la aplica: automatizaciones, agentes y herramientas a medida para pymes e industria. Cada artículo cuenta qué ha cambiado y qué significa para un negocio, con criterio de quien lo monta en empresas reales. El blog demuestra que sabemos hacerlo; las empresas nos contratan para que lo hagamos por ellas.';
g.audiencias[0].peso = '≈50 % de los artículos';
g.audiencias[1].peso = '≈50 % de los artículos';
g.audiencias[1].como_ganarla = 'Artículos de «IA en la empresa» y de automatización con casos por sector (industria, distribución, servicios técnicos), cuánto cuesta y por dónde empezar; y en cada artículo técnico un apartado «qué significa para tu empresa». Enlazar cuando encaje a /soluciones/, /automatizacion-procesos-ia/, /agentes-chatbots-ia/ o /sectores-industriales/.';
const reglas = [
  'Títulos con mayúsculas correctas: la primera letra siempre en mayúscula y los nombres propios bien escritos (OpenAI, ChatGPT, Claude, Gemini, n8n), aunque la keyword vaya en minúscula.',
  'No citar en los artículos cuántos artículos ha publicado el blog.',
];
for (const r of reglas) { if (!g.reglas_seo.includes(r)) g.reglas_seo.push(r); if (!g.notas.includes(r)) g.notas.push(r); }
g.texto = guiaATexto(g);
g.actualizada = new Date().toISOString();
await sql`update seo.settings set value = ${sql.json(g)}, updated_at = now() where key = 'guia'`;
console.log('guía actualizada', g.audiencias.map((a) => a.peso).join(' / '));
await sql.end();
