// RADAR IA — lee las fuentes de referencia de IA (y busca en la web los temas
// preferidos), descarta lo ya visto, un editor IA resume "qué está pasando",
// clasifica cada noticia por tipo (actualidad, truco, guía…) y puntúa qué merece artículo.
// Se configura desde la app (seo.settings 'radar'): interruptor, diario/semanal/solo panel,
// hora, temas preferidos, temas a excluir y tipos que interesan. Comprueba la
// configuración cada hora y solo trabaja a la hora elegida (una vez al día).
// Los avisos llevan botones "Preparar artículo" (prep:<id>) / "Descartar" (skip:<id>), que atiende el Publicador.
import { Flow, CRED, CHAT_ID, WP, n8n, code, OPENAI_HTTP, reqJs, checkExpr, PARSE_RESPONSES } from './lib.mjs';
import { CATEGORIAS } from './prompts.mjs';
import { RADAR_DEFECTO, TIPOS_BASE, TIPO_CLAVES, GUIA_INICIAL, guiaATexto } from '../src/lib/guia-base.ts';
import fs from 'node:fs';

const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'fVpdqBxFqgVrRyLZ';
const f = new Flow('RADAR IA DIARIO (Transformaconia)');
const X = (x, y) => [x * 220, y * 180];

export const FUENTES = [
  ['TechCrunch', 'https://techcrunch.com/category/artificial-intelligence/feed/'],
  ['The Verge', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml'],
  ['MIT Technology Review', 'https://www.technologyreview.com/topic/artificial-intelligence/feed'],
  ['OpenAI', 'https://openai.com/news/rss.xml'],
  ['Google', 'https://blog.google/technology/ai/rss/'],
  ['Google DeepMind', 'https://deepmind.google/blog/rss.xml'],
  ['Hugging Face', 'https://huggingface.co/blog/feed.xml'],
  ['Ars Technica', 'https://arstechnica.com/ai/feed/'],
  ['Xataka', 'https://www.xataka.com/tag/inteligencia-artificial/rss2.xml'],
  ['Genbeta', 'https://www.genbeta.com/tag/inteligencia-artificial/rss2.xml'],
  ['The Decoder', 'https://the-decoder.com/feed/'],
  ['MarkTechPost', 'https://www.marktechpost.com/feed/'],
  ['Wired', 'https://www.wired.com/feed/tag/ai/latest/rss'],
  ['Simon Willison', 'https://simonwillison.net/atom/everything/'],
  ['Latent Space', 'https://www.latent.space/feed'],
  ['Claude Code (versiones)', 'https://github.com/anthropics/claude-code/releases.atom'],
  ['n8n', 'https://blog.n8n.io/rss/'],
  ['Cursor', 'https://cursor.com/changelog/rss.xml'],
  ['GitHub Copilot', 'https://github.blog/changelog/label/copilot/feed/'],
];

const TIPOS_TXT = TIPOS_BASE.map((t) => `- ${t.clave}: ${t.nombre} — ${t.objetivo}`).join('\n');

const RADAR_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['titular_dia', 'puntos', 'tendencia', 'seleccion'],
  properties: {
    titular_dia: { type: 'string', description: 'la frase que resume el día en IA' },
    puntos: { type: 'array', description: '4-7 cosas que hay que saber hoy', items: { type: 'object', additionalProperties: false, required: ['titulo', 'explicacion', 'idx'], properties: { titulo: { type: 'string' }, explicacion: { type: 'string', description: '1-2 frases claras y concretas para alguien que ya usa IA' }, idx: { type: 'integer' } } } },
    tendencia: { type: 'string', description: 'qué patrón se ve esta semana y qué significa para quien construye con IA y para las empresas' },
    seleccion: { type: 'array', description: 'las noticias con potencial de artículo (máx. 15), agrupando duplicadas del mismo hecho en una sola', items: { type: 'object', additionalProperties: false, required: ['idx', 'score', 'tipo', 'motivo', 'resumen', 'keyword', 'categoria', 'cluster'], properties: {
      idx: { type: 'integer' }, score: { type: 'integer', description: '0-100 potencial para el blog' },
      tipo: { type: 'string', enum: TIPO_CLAVES, description: 'el tipo de artículo que más valor saca de esta noticia' },
      motivo: { type: 'string' }, resumen: { type: 'string', description: '2 frases en español' },
      keyword: { type: 'string', description: 'keyword de búsqueda en español' }, categoria: { type: 'string', enum: Object.keys(CATEGORIAS) }, cluster: { type: 'string', description: 'tema paraguas (p. ej. "Claude Code", "agentes de IA", "modelos de OpenAI")' } } } },
  },
};

const WEB_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['resultados'],
  properties: { resultados: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['titulo', 'url', 'fuente', 'fecha', 'resumen', 'tema'], properties: {
    titulo: { type: 'string' }, url: { type: 'string' }, fuente: { type: 'string' }, fecha: { type: 'string', description: 'AAAA-MM-DD o s/f' }, resumen: { type: 'string', description: '1-2 frases en español' }, tema: { type: 'string' } } } } },
};

const RADAR_SISTEMA = `Eres el editor jefe de Transformaconia (consultora española de IA y automatización). Cada mañana revisas lo publicado en las últimas horas y decides:
1) Qué tiene que saber hoy alguien que ya trabaja con IA (resumen claro y concreto, en español de España).
2) Qué merece un artículo en el blog para captar búsquedas en Google y citas en ChatGPT/Perplexity, y de qué TIPO.

LECTOR: ya usa ChatGPT/Claude a diario, ha tocado Claude Code, Cursor, n8n o la API y quiere ir más allá (novedades con impacto práctico, trucos, comandos, rutas, automatizaciones). Lector secundario: el directivo que decide contratar a una consultora de IA.

TIPOS DE ARTÍCULO:
${TIPOS_TXT}
Una misma noticia puede rendir más como truco o guía que como noticia (p. ej. una versión de Claude Code con un comando nuevo → truco).

Puntúa alto (75-100): lanzamientos o cambios relevantes de OpenAI, Anthropic, Google, Microsoft, Meta, Mistral, DeepSeek y similares; funciones nuevas de Claude Code, Codex, Cursor, n8n, MCP y agentes que se pueden usar ya; técnicas y configuraciones que un usuario avanzado puede copiar; regulación con efecto práctico (AI Act); estudios con datos sólidos sobre productividad.
Puntúa bajo (<50): rondas de financiación sin producto, papers muy académicos, opiniones, rumores, contenido para principiantes, noticias solo relevantes para EE. UU., versiones menores sin nada aprovechable (solo correcciones de errores).
Si varias noticias cuentan lo mismo, quédate con la mejor fuente y agrúpalas.
ANTICANIBALIZACIÓN: si el blog ya tiene un artículo sobre el mismo producto o el mismo anuncio (aunque el enfoque cambie un poco), puntúa por debajo de 50 y dilo en el motivo («ya cubierto en: …»); solo puntúa alto si hay un hecho nuevo importante que justifique actualizar ese artículo.
No inventes nada: usa solo lo que dicen los titulares y extractos.`;

const DEF = JSON.stringify(RADAR_DEFECTO);

// ---------- disparadores y configuración ----------
f.add('Cada hora', 'n8n-nodes-base.scheduleTrigger', 1.2, { rule: { interval: [{ field: 'cronExpression', expression: '0 6-22 * * *' }] } }, X(0, 0));
f.add('Lanzar desde la app', 'n8n-nodes-base.webhook', 2, { httpMethod: 'POST', path: 'seo-radar', authentication: 'headerAuth', responseMode: 'onReceived', options: { responseData: '{"ok":true}' } }, X(0, 1), { webhookId: 'seo-radar', credentials: CRED.gateway });
f.add('Leer config', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `select $1::text as origen,
  (select value from seo.settings where key='radar') as cfg,
  (select value from seo.settings where key='radar_estado') as estado,
  (select value->>'texto' from seo.settings where key='guia') as guia`,
  options: { queryReplacement: "={{ [ $json.headers ? 'manual' : 'auto' ] }}" } }, X(1, 0.5), { credentials: CRED.pg });
f.add('Decidir', 'n8n-nodes-base.code', 2, code(`
const r = $input.first().json;
const cfg = Object.assign(${DEF}, r.cfg || {});
const estado = r.estado || {};
const manual = r.origen === 'manual';
const ahora = new Date();
const hoy = ahora.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
const hora = +ahora.toLocaleString('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', hour12: false });
const dow = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(ahora.toLocaleDateString('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short' })) + 1;
if (!manual) {
  if (!cfg.activo) return [];                      // interruptor apagado
  if (hora !== +cfg.hora) return [];               // todavía no es la hora elegida
  if (estado.ultima_busqueda === hoy) return [];   // ya se hizo hoy
}
let aviso = 'ninguno';
if (manual) aviso = cfg.frecuencia === 'panel' ? 'ninguno' : 'diario';
else if (cfg.frecuencia === 'diario') aviso = 'diario';
else if (cfg.frecuencia === 'semanal' && dow === +cfg.dia_semana) aviso = 'semanal';
return [{ json: { cfg, hoy, manual, aviso, guia: r.guia || ${JSON.stringify(guiaATexto(GUIA_INICIAL))} } }];
`), X(2, 0.5));
f.add('Marcar ejecucion', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `insert into seo.settings (key, value) values ('radar_estado', jsonb_build_object('ultima_busqueda', $1::text, 'origen', $2::text, 'hora', now()))
on conflict (key) do update set value = seo.settings.value || excluded.value, updated_at = now() returning key`,
  options: { queryReplacement: "={{ [ $json.manual ? ($('Leer config').first().json.estado || {}).ultima_busqueda || '' : $json.hoy, $json.manual ? 'manual' : 'auto' ] }}" } }, X(3, 0.5), { credentials: CRED.pg });

// ---------- lectura de fuentes ----------
f.add('Fuentes', 'n8n-nodes-base.code', 2, code(`return ${JSON.stringify(FUENTES)}.map(([fuente, url]) => ({ json: { fuente, url } }));`), X(4, 0.5));
f.add('Leer RSS', 'n8n-nodes-base.rssFeedRead', 1.1, { url: '={{ $json.url }}', options: { ignoreSSL: false } }, X(5, 0.5), { onError: 'continueRegularOutput', alwaysOutputData: true });
f.add('Normalizar', 'n8n-nodes-base.code', 2, code(`
const fuentes = $('Fuentes').all().map(i => i.json);
const dominio = (u) => { try { return new URL(u).hostname.replace(/^www\\./, ''); } catch (e) { return ''; } };
const porDominio = Object.fromEntries(fuentes.map(x => [dominio(x.url), x.fuente]));
const deco = (t) => String(t || '').replace(/&#(\\d+);/g, (m, d) => String.fromCodePoint(+d)).replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const out = [];
for (const it of $input.all()) {
  const j = it.json; if (!j || j.error || !(j.link || j.guid)) continue;
  const link = String(j.link || j.guid).trim();
  const d = dominio(link);
  // la fuente sale del dominio del enlace (el pairedItem del lector RSS no es fiable)
  const fuente = porDominio[d] || Object.entries(porDominio).find(([k]) => d.endsWith(k) || k.endsWith(d))?.[1] || d;
  const fecha = j.isoDate || j.pubDate || j.published || j.updated || null;
  let title = deco(j.title).trim();
  if (fuente === 'Claude Code (versiones)' && /^v?\\d/.test(title)) title = 'Claude Code ' + title;
  out.push({ url: link.split('#')[0], title, source: fuente, published_at: fecha ? new Date(fecha).toISOString() : null,
    snippet: deco(j.contentSnippet || j.summary || j.content || '').replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim().slice(0, 400) });
}
return [{ json: { items: out } }];
`), X(6, 0.5));
f.add('Anthropic', 'n8n-nodes-base.httpRequest', 4.2, { url: 'https://www.anthropic.com/news', options: { timeout: 30000, response: { response: { responseFormat: 'text', outputPropertyName: 'html' } } } }, X(7, 0.5), { onError: 'continueRegularOutput' });
f.add('Anthropic Engineering', 'n8n-nodes-base.httpRequest', 4.2, { url: 'https://www.anthropic.com/engineering', options: { timeout: 30000, response: { response: { responseFormat: 'text', outputPropertyName: 'html' } } } }, X(8, 0.5), { onError: 'continueRegularOutput' });
f.add('Blog actual', 'n8n-nodes-base.httpRequest', 4.2, { url: `${WP}/wp-json/wp/v2/posts?per_page=100&status=publish&_fields=id,title`, options: { timeout: 30000, response: { response: { fullResponse: true, neverError: true } } } }, X(9, 0.5), { onError: 'continueRegularOutput' });
f.add('Ya vistas', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `select url from seo.radar where created_at > now() - interval '30 days' union select source_url from seo.briefs where created_at > now() - interval '30 days' and source_url is not null`, options: {} },
  X(10, 0.5), { credentials: CRED.pg, alwaysOutputData: true });

// ---------- búsqueda web de los temas preferidos ----------
f.add('Preparar busqueda web', 'n8n-nodes-base.code', 2, code(`
const D = $('Decidir').first().json; const cfg = D.cfg;
const temas = (cfg.temas || []).map(t => String(t).trim()).filter(Boolean).slice(0, 8);
if (!cfg.buscar_web || !temas.length) return [{ json: { buscar: false } }];
const hoy = new Date().toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'long', year: 'numeric' });
const sistema = 'Eres documentalista de actualidad de inteligencia artificial para un público técnico. Solo devuelves publicaciones que has visto en la búsqueda, con su URL exacta.';
const usuario = 'Hoy es ' + hoy + '. Busca lo publicado en los últimos 3 días (si no hay nada, en los últimos 7) sobre estos temas: ' + temas.join(', ') + '.\\n' +
  'Prioriza: anuncios oficiales, notas de versión y changelogs, documentación nueva, posts de ingeniería, y trucos, guías o configuraciones de fuentes con autoridad (blogs oficiales, desarrolladores reconocidos, GitHub).\\n' +
  (cfg.excluir && cfg.excluir.length ? 'Descarta: ' + cfg.excluir.join(', ') + '.\\n' : '') +
  'Nada de agregadores, foros, páginas de categoría, vídeos ni contenido para principiantes. Devuelve de 0 a 10 resultados: titulo, url exacta del artículo, fuente (medio o autor), fecha (AAAA-MM-DD o s/f), resumen en español (1-2 frases) y tema (cuál de la lista).';
${reqJs({ model: 'gpt-5.5', effort: 'low', schemaName: 'radar_web', schema: WEB_SCHEMA, maxTokens: 10000, tools: [{ type: 'web_search', search_context_size: 'medium', user_location: { type: 'approximate', country: 'ES' } }] })}
return [{ json: { buscar: true, req } }];
`), X(11, 0.5));
f.add('Buscar web', 'n8n-nodes-base.if', 2.2, {
  conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
    conditions: [{ leftValue: '={{ $json.buscar }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }] }, options: {},
}, X(12, 0.5));
f.add('Buscar en la web', 'n8n-nodes-base.httpRequest', 4.2, OPENAI_HTTP, X(13, 0), { credentials: CRED.openai, onError: 'continueRegularOutput' });

// ---------- editor jefe ----------
f.add('Preparar editor', 'n8n-nodes-base.code', 2, code(`${PARSE_RESPONSES}
const D = $('Decidir').first().json; const cfg = D.cfg;
const vistas = new Set($('Ya vistas').all().map(i => i.json.url).filter(Boolean));
let items = $('Normalizar').first().json.items;
// Anthropic no tiene RSS: se leen los enlaces de /news y /engineering
const anth = []; const vistos = new Set();
for (const [nodo, seccion, fuente] of [['Anthropic', 'news', 'Anthropic'], ['Anthropic Engineering', 'engineering', 'Anthropic Engineering']]) {
  let html = ''; try { html = String(($(nodo).first().json || {}).html || ''); } catch (e) {}
  const re = new RegExp('href="(\\\\/' + seccion + '\\\\/[a-z0-9-]+)"[^>]*>([\\\\s\\\\S]*?)<\\\\/a>', 'g');
  let n = 0;
  for (const m of html.matchAll(re)) {
    const url = 'https://www.anthropic.com' + m[1]; if (vistos.has(url)) continue; vistos.add(url);
    const title = m[2].replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim().slice(0, 160);
    if (title.length > 12 && n++ < 10) anth.push({ url, title, source: fuente, published_at: null, snippet: '' });
  }
}
// resultados de la búsqueda web de temas preferidos (si se hizo)
let web = [];
try {
  const w = leerRespuesta($('Buscar en la web').first().json);
  web = (w.resultados || []).filter(x => /^https?:\\/\\/[^\\s]+\\.[a-z]{2,}/i.test(x.url) && !/news\\.google\\.|google\\.com\\/search|youtube\\.com/i.test(x.url))
    .map(x => ({ url: x.url.split('#')[0], title: x.titulo, source: x.fuente + ' (búsqueda: ' + x.tema + ')', published_at: /^\\d{4}-\\d{2}-\\d{2}$/.test(x.fecha) ? new Date(x.fecha + 'T12:00:00Z').toISOString() : null, snippet: x.resumen, web: true }));
} catch (e) {}
const primeraVez = (fuente) => ![...vistas].some(u => u.includes(fuente));
const primeraVezAnthropic = primeraVez('anthropic.com/news');
const primeraVezEng = primeraVez('anthropic.com/engineering');
const ahora = Date.now();
const nuevas = []; const base = [];
const titulos = new Set();
for (const it of [...items, ...anth, ...web]) {
  if (!it.url || vistas.has(it.url)) continue;
  const clave = it.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').slice(0, 60);
  if (titulos.has(clave)) continue; titulos.add(clave);
  const edadH = it.published_at ? (ahora - Date.parse(it.published_at)) / 36e5 : 0;
  if (it.source === 'Anthropic' && primeraVezAnthropic) { base.push(it); continue; }   // línea base: no se proponen las antiguas
  if (it.source === 'Anthropic Engineering' && primeraVezEng) { base.push(it); continue; }
  if (!it.web && edadH > 40) { base.push(it); continue; }
  if (it.web && edadH > 24 * 8) { base.push(it); continue; }
  nuevas.push(it);
}
nuevas.sort((a, b) => (b.published_at || '9') > (a.published_at || '9') ? 1 : -1);
const lista = nuevas.slice(0, 80);
const blog = (($('Blog actual').first().json || {}).body || []).map(p => '- ' + String((p.title && p.title.rendered) || '').replace(/<[^>]+>/g, '')).join('\\n');
const hoy = new Date().toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const prefs = 'PREFERENCIAS DEL EDITOR (mandan sobre el criterio general):\\n' +
  '- Temas preferidos (súmales hasta +15 si encajan): ' + ((cfg.temas || []).join(', ') || 'ninguno') + '\\n' +
  '- Temas a excluir (puntúa por debajo de 30): ' + ((cfg.excluir || []).join(', ') || 'ninguno') + '\\n' +
  '- Tipos de artículo que interesan ahora: ' + (cfg.tipos || []).join(', ') + ' (si una noticia solo encaja en otro tipo, puntúala más bajo)';
const usuario = 'Hoy es ' + hoy + '.\\n\\n' + prefs + '\\n\\nGUÍA EDITORIAL:\\n' + D.guia +
  '\\n\\nNOTICIAS NUEVAS (idx | fuente | fecha | titular | extracto):\\n' +
  lista.map((x, i) => i + ' | ' + x.source + ' | ' + (x.published_at || 's/f').slice(0, 16) + ' | ' + x.title + ' | ' + x.snippet.slice(0, 220)).join('\\n') +
  '\\n\\nARTÍCULOS QUE YA TIENE EL BLOG:\\n' + blog;
const sistema = ${JSON.stringify(RADAR_SISTEMA)};
${reqJs({ model: 'gpt-5.5', effort: 'low', schemaName: 'radar_ia', schema: RADAR_SCHEMA, maxTokens: 16000 })}
return [{ json: { req, lista, base, hay: lista.length > 0, web: web.length } }];
`), X(14, 0.5));
f.add('Hay noticias', 'n8n-nodes-base.if', 2.2, {
  conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
    conditions: [{ leftValue: '={{ $json.hay }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }] }, options: {},
}, X(15, 0.5));
f.add('Editor jefe IA', 'n8n-nodes-base.httpRequest', 4.2, OPENAI_HTTP, X(16, 0), { credentials: CRED.openai, retryOnFail: true, maxTries: 2, waitBetweenTries: 10000 });

f.add('Preparar filas', 'n8n-nodes-base.code', 2, code(`${PARSE_RESPONSES}
const e = leerRespuesta($json);
const P = $('Preparar editor').first().json;
const lista = P.lista;
const fecha = $('Decidir').first().json.hoy;
const CAT = ${JSON.stringify(Object.fromEntries(TIPOS_BASE.map((t) => [t.clave, t.categoria])))};
const sel = new Map(); for (const s of e.seleccion || []) if (lista[s.idx]) sel.set(s.idx, s);
const filas = lista.map((x, i) => { const s = sel.get(i) || {};
  return { url: x.url, title: x.title, source: x.source, published_at: x.published_at, snippet: x.snippet, resumen: s.resumen || null, score: Number.isInteger(s.score) ? s.score : null,
    motivo: s.motivo || null, keyword: s.keyword || null, categoria: s.categoria || CAT[s.tipo] || null, cluster: s.cluster || null, tipo: s.tipo || null, status: sel.has(i) ? 'new' : 'seen', digest_date: fecha }; });
for (const x of P.base) filas.push({ url: x.url, title: x.title, source: x.source, published_at: x.published_at, snippet: x.snippet, resumen: null, score: null, motivo: null, keyword: null, categoria: null, cluster: null, tipo: null, status: 'seen', digest_date: fecha });
const md = '# ' + e.titular_dia + '\\n\\n' + (e.puntos || []).map(p => '- **' + p.titulo + '** — ' + p.explicacion + (lista[p.idx] ? ' ([fuente](' + lista[p.idx].url + '))' : '')).join('\\n') + '\\n\\n**Tendencia:** ' + e.tendencia;
const puntos = (e.puntos || []).map(p => ({ ...p, url: lista[p.idx] ? lista[p.idx].url : null }));
return [{ json: { filas, fecha, md, editor: { ...e, puntos } } }];
`), X(17, 0));
f.add('Guardar radar', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `insert into seo.radar (url, title, source, published_at, snippet, resumen, score, motivo, keyword, categoria, cluster, tipo, status, digest_date)
select url, title, source, published_at, snippet, resumen, score, motivo, keyword, categoria, cluster, tipo, status, digest_date
from json_to_recordset($1::json) as x(url text, title text, source text, published_at timestamptz, snippet text, resumen text, score int, motivo text, keyword text, categoria text, cluster text, tipo text, status text, digest_date date)
on conflict (url) do nothing
returning id`,
  options: { queryReplacement: '={{ [ JSON.stringify($json.filas) ] }}' } }, X(18, 0), { credentials: CRED.pg, alwaysOutputData: true });
f.add('Guardar resumen', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `insert into seo.digests(fecha, resumen_md, data) values ($1::date, $2, $3::jsonb)
on conflict (fecha) do update set resumen_md = excluded.resumen_md, data = excluded.data, created_at = now() returning fecha`,
  options: { queryReplacement: "={{ [ $('Preparar filas').first().json.fecha, $('Preparar filas').first().json.md, JSON.stringify($('Preparar filas').first().json.editor) ] }}" } },
  X(19, 0), { credentials: CRED.pg, executeOnce: true });
f.add('Guardar linea base', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `insert into seo.radar (url, title, source, published_at, snippet, status, digest_date)
select url, title, source, published_at, snippet, 'seen', current_date from json_to_recordset($1::json) as x(url text, title text, source text, published_at timestamptz, snippet text)
on conflict (url) do nothing`,
  options: { queryReplacement: '={{ [ JSON.stringify($json.base) ] }}' } }, X(16, 1.2), { credentials: CRED.pg });

// ---------- avisos (diario, semanal o ninguno) ----------
f.add('Toca avisar', 'n8n-nodes-base.if', 2.2, {
  conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
    conditions: [{ leftValue: "={{ $('Decidir').first().json.aviso }}", rightValue: 'ninguno', operator: { type: 'string', operation: 'notEquals' } }] }, options: {},
}, X(20, 0.5), { executeOnce: true });
f.add('Semana', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `select to_char(fecha,'YYYY-MM-DD') fecha, data from seo.digests where fecha > current_date - 7 order by fecha desc`, options: {} },
  X(21, 0.5), { credentials: CRED.pg, alwaysOutputData: true, executeOnce: true });
f.add('Candidatas', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `with c as (
  select id from seo.radar
  where status = 'new' and score >= $1::int and digest_date >= current_date - $2::int
    and coalesce(tipo, 'actualidad') = any(string_to_array($3::text, ','))
  order by score desc, digest_date desc limit $4::int)
update seo.radar r set status = 'sent' from c where r.id = c.id
returning r.id, r.title, r.url, r.source, r.score, r.resumen, r.motivo, r.keyword, r.tipo`,
  options: { queryReplacement: "={{ [ $('Decidir').first().json.cfg.score_minimo || 70, $('Decidir').first().json.aviso === 'semanal' ? 6 : 0, ($('Decidir').first().json.cfg.tipos || []).join(',') || 'actualidad', $('Decidir').first().json.cfg.max_propuestas || 5 ] }}" } },
  X(22, 0.5), { credentials: CRED.pg, alwaysOutputData: true, executeOnce: true });
f.add('Montar avisos', 'n8n-nodes-base.code', 2, code(`
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const D = $('Decidir').first().json;
const TIPOS = ${JSON.stringify(Object.fromEntries(TIPOS_BASE.map((t) => [t.clave, t.nombre])))};
const ICONO = { actualidad: '📰', truco: '💡', guia: '🧭', herramienta: '🧰', automatizacion: '⚙️', empresa: '🏢' };
const cands = $('Candidatas').all().map(i => i.json).filter(c => c && c.id).sort((a, b) => b.score - a.score);
const semana = $('Semana').all().map(i => i.json).filter(x => x && x.fecha);
let editor = null; try { editor = $('Preparar filas').first().json.editor; } catch (e) {}
const dia = new Date().toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long' });
let t;
if (D.aviso === 'semanal') {
  t = '🗓 <b>Radar semanal de IA · ' + esc(dia) + '</b>\\n\\n' +
    (semana.length ? semana.map(s => '• <b>' + esc(s.fecha.slice(8, 10) + '/' + s.fecha.slice(5, 7)) + '</b> — ' + esc((s.data && s.data.titular_dia) || '')).join('\\n') : 'Esta semana no ha habido resúmenes diarios.') +
    ((semana[0] && semana[0].data && semana[0].data.tendencia) ? '\\n\\n📈 <b>Tendencia:</b> ' + esc(semana[0].data.tendencia) : '');
} else if (editor) {
  t = '🧠 <b>Radar IA · ' + esc(dia) + '</b>\\n\\n<b>' + esc(editor.titular_dia) + '</b>\\n\\n' +
    (editor.puntos || []).map(p => '• <b>' + esc(p.titulo) + '</b> — ' + esc(p.explicacion) + (p.url ? ' <a href="' + esc(p.url) + '">(fuente)</a>' : '')).join('\\n') +
    '\\n\\n📈 <b>Tendencia:</b> ' + esc(editor.tendencia);
} else {
  if (!D.manual) return [];                          // día tranquilo: no molestar
  t = '🧠 <b>Radar IA · ' + esc(dia) + '</b>\\n\\nNo hay noticias nuevas desde la última pasada.';
}
if (cands.length) {
  const porTipo = {}; for (const c of cands) porTipo[c.tipo || 'actualidad'] = (porTipo[c.tipo || 'actualidad'] || 0) + 1;
  t += '\\n\\n👇 Te propongo ' + cands.length + ' tema' + (cands.length > 1 ? 's' : '') + ': ' + Object.entries(porTipo).map(([k, n]) => (ICONO[k] || '') + ' ' + n + ' ' + (TIPOS[k] || k).toLowerCase()).join(' · ');
} else t += '\\n\\nHoy no veo ninguna noticia que merezca artículo con tus preferencias. Buen momento para actualizar contenido desde la app.';
if (t.length > 4000) t = t.slice(0, 3990) + '…';
const propuestas = cands.map(r => ({ id: r.id, texto: (ICONO[r.tipo] || '📌') + ' <b>' + esc(TIPOS[r.tipo] || 'Actualidad') + '</b> · <b>' + esc(r.title) + '</b>\\n<i>' + esc(r.source) + '</i> · ' + esc(r.url) + '\\n\\n' + esc(r.resumen) + '\\n\\n🟢 Interés ' + r.score + '/100 — ' + esc(r.motivo) + '\\n🔑 <code>' + esc(r.keyword) + '</code>' }));
return [{ json: { telegram: t, propuestas } }];
`), X(23, 0.5));
f.add('Enviar resumen', 'n8n-nodes-base.telegram', 1.2, { chatId: CHAT_ID, text: '={{ $json.telegram }}', additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true } },
  X(24, 0.5), { credentials: CRED.telegram, executeOnce: true });
f.add('Separar propuestas', 'n8n-nodes-base.code', 2, code(`return $('Montar avisos').first().json.propuestas.map(p => ({ json: p }));`), X(25, 0.5));
f.add('Enviar candidata', 'n8n-nodes-base.telegram', 1.2, {
  chatId: CHAT_ID, text: '={{ $json.texto }}', replyMarkup: 'inlineKeyboard',
  inlineKeyboard: { rows: [{ row: { buttons: [
    { text: '📝 Preparar artículo', additionalFields: { callback_data: '={{ "prep:" + $json.id }}' } },
    { text: '🙈 Descartar', additionalFields: { callback_data: '={{ "skip:" + $json.id }}' } },
  ] } }] },
  additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true },
}, X(26, 0.5), { credentials: CRED.telegram, onError: 'continueRegularOutput' });

f.link('Cada hora', 'Leer config');
f.link('Lanzar desde la app', 'Leer config');
f.chain('Leer config', 'Decidir', 'Marcar ejecucion', 'Fuentes', 'Leer RSS', 'Normalizar', 'Anthropic', 'Anthropic Engineering', 'Blog actual', 'Ya vistas', 'Preparar busqueda web', 'Buscar web');
f.link('Buscar web', 'Buscar en la web', 0);
f.link('Buscar web', 'Preparar editor', 1);
f.link('Buscar en la web', 'Preparar editor');
f.link('Preparar editor', 'Hay noticias');
f.link('Hay noticias', 'Editor jefe IA', 0);
f.link('Hay noticias', 'Guardar linea base', 1);
f.chain('Editor jefe IA', 'Preparar filas', 'Guardar radar', 'Guardar resumen', 'Toca avisar');
f.link('Guardar linea base', 'Toca avisar');
f.link('Toca avisar', 'Semana', 0);
f.chain('Semana', 'Candidatas', 'Montar avisos', 'Enviar resumen', 'Separar propuestas', 'Enviar candidata');
for (const n of f.nodes) if (['Marcar ejecucion', 'Fuentes', 'Anthropic', 'Anthropic Engineering', 'Blog actual', 'Ya vistas', 'Preparar busqueda web', 'Preparar editor'].includes(n.name)) n.executeOnce = true;

// Los chequeos horarios que no tocan no se guardan (solo errores y ejecuciones reales vía --guardar)
const wf = f.json({ timezone: 'Europe/Madrid', saveDataErrorExecution: 'all', saveDataSuccessExecution: process.argv.includes('--guardar') ? 'all' : 'none', saveManualExecutions: true });
checkExpr(wf);
fs.writeFileSync(new URL('./radar.build.json', import.meta.url), JSON.stringify(wf, null, 1));
if (process.argv.includes('--dry')) { console.log('dry run, nodos:', wf.nodes.length); process.exit(0); }
const r = await n8n.upsert(wf, ID);
await n8n.activate(r.id);
console.log('RADAR ->', r.id, 'nodos:', wf.nodes.length, 'guardar éxitos:', wf.settings.saveDataSuccessExecution);
