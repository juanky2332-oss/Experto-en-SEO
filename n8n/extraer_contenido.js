// ============================================================
// Extrae el contenido de la noticia.
// Acepta HTML (lectura directa) o Markdown de r.jina.ai (respaldo).
// Si la web bloquea o no hay texto util -> lanza error (salida de error)
// para avisar por Telegram en lugar de publicar un articulo vacio.
// ============================================================
const raw = typeof $json.data === 'string' ? $json.data : '';

let url = '';
let chatId = null;
try {
  url = $('Preparar lectura').first().json.url || '';
  chatId = $('Preparar lectura').first().json.chatId || null;
} catch (e) {}

function decode(t) {
  return String(t)
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '\"')
    .replace(/&apos;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&#x([0-9a-fA-F]+);/g, (m, h) => { const n = parseInt(h, 16); return (n > 0 && n < 1114112) ? String.fromCodePoint(n) : m; })
    .replace(/&#(\d+);/g, (m, d) => { const n = parseInt(d, 10); return (n > 0 && n < 1114112) ? String.fromCodePoint(n) : m; })
    .replace(/&amp;/g, '&');
}

// ---------- Lectura de respaldo (r.jina.ai devuelve Markdown) ----------
function parseJina(txt) {
  const mTitle = txt.match(/^\s*Title:\s*(.+)$/m);
  const mUrl = txt.match(/^URL Source:\s*(.+)$/m);
  const partes = txt.split(/Markdown Content:\s*/);
  const body = partes.length > 1 ? partes.slice(1).join(' ') : txt;
  const h2s = [...body.matchAll(/^\s{0,3}#{2,3}\s+(.+)$/gm)]
    .map(m => m[1].replace(/[*_`#]/g, '').trim())
    .filter(t => t.length > 5)
    .slice(0, 8);
  const texto = body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { title: mTitle ? mTitle[1].trim() : '', url: mUrl ? mUrl[1].trim() : '', metaDesc: '', h2s: h2s, texto: texto };
}

// ---------- Lectura directa (HTML) ----------
function parseHtml(html) {
  const c = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ');

  const cap = (re) => {
    const m = c.match(re);
    return m ? decode(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim() : '';
  };

  const ogTitle = cap(/<meta[^>]+property=[\"']og:title[\"'][^>]+content=[\"']([^\"']+)[\"']/i)
    || cap(/<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+property=[\"']og:title[\"']/i);
  const h1 = cap(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  let title = ogTitle || h1 || cap(/<title[^>]*>([\s\S]*?)<\/title>/i);
  title = title.replace(/\s*[|·»]\s*[^|·»]{0,45}$/, '').trim() || title;

  const canonical = cap(/<link[^>]+rel=[\"']canonical[\"'][^>]+href=[\"']([^\"']+)[\"']/i)
    || cap(/<meta[^>]+property=[\"']og:url[\"'][^>]+content=[\"']([^\"']+)[\"']/i);

  const metaDesc = cap(/<meta[^>]+name=[\"']description[\"'][^>]+content=[\"']([^\"']+)[\"']/i)
    || cap(/<meta[^>]+property=[\"']og:description[\"'][^>]+content=[\"']([^\"']+)[\"']/i);

  const h2s = [...c.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map(m => decode(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim())
    .filter(t => t.length > 5)
    .slice(0, 8);

  const art = c.match(/<article[^>]*>([\s\S]*?)<\/article>/i) || c.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const cuerpo = (art ? art[1] : c)
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<form[\s\S]*?<\/form>/gi, ' ');

  const texto = decode(cuerpo.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  return { title: title, url: canonical, metaDesc: metaDesc, h2s: h2s, texto: texto };
}

const esJina = /^\s*Title:\s/m.test(raw) && /URL Source:/.test(raw);
const d = esJina ? parseJina(raw) : parseHtml(raw);

const BLOQUEO = /(403\s*[-–]?\s*forbidden|access to this page is forbidden|attention required|just a moment|checking your browser|enable javascript and cookies|error 1020|access denied)/i;

if (!raw || d.texto.length < 400 || (BLOQUEO.test(raw.slice(0, 4000)) && d.texto.length < 2000)) {
  throw new Error('Lectura fallida de ' + (url || 'la URL') + '. La web bloquea el acceso automatico o no devolvio texto util (' + d.texto.length + ' caracteres extraidos).');
}

const contenido = d.texto.substring(0, 10000);

const stats = [...contenido.matchAll(/[^.]*(?:\d+[,.]?\d*\s*(?:%|por ciento|millones|billones|mil)|[Ss]eg[uú]n [A-Z][a-z]+)[^.]*\./g)]
  .slice(0, 5)
  .map(m => m[0].trim());

const FUENTES = {
  'technologyreview.com': 'MIT Technology Review',
  'techcrunch.com': 'TechCrunch',
  'marktechpost.com': 'MarkTechPost',
  'jonhernandez.education': 'Jon Hernández Education',
  'artificialintelligence-news.com': 'AI News',
  'venturebeat.com': 'VentureBeat',
  'openai.com': 'OpenAI',
  'anthropic.com': 'Anthropic',
  'deepmind.google': 'Google DeepMind',
  'huggingface.co': 'Hugging Face',
  'wired.com': 'Wired',
  'arstechnica.com': 'Ars Technica',
  'theverge.com': 'The Verge',
  'xataka.com': 'Xataka',
  'genbeta.com': 'Genbeta'
};

function nombreFuente(u) {
  if (!u || typeof u !== 'string') return 'Fuente externa';
  for (const dom in FUENTES) { if (u.includes(dom)) return FUENTES[dom]; }
  try { return u.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, ''); } catch (e) { return 'Fuente externa'; }
}

const linkFinal = url || d.url || '';

return [{
  json: {
    title: d.title || 'Sin titulo',
    link: linkFinal || 'URL no disponible',
    description: d.metaDesc || (contenido.substring(0, 300) + '...'),
    content_markdown: contenido,
    h2_originales: d.h2s,
    estadisticas_fuente: stats,
    pubDate: new Date().toISOString(),
    source: nombreFuente(linkFinal),
    processed_at: new Date().toISOString(),
    telegram_origin: true,
    lectura: esJina ? 'respaldo-jina' : 'directa',
    chatId: chatId
  }
}];