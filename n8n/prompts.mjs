// Prompts y esquemas JSON del publicador. Separados del flujo para poder
// afinarlos sin tocar la estructura de nodos.

export const CATEGORIAS = {
  'noticias-ia': 'Noticias de IA — lanzamientos de modelos, movimientos de empresas de IA, regulación que acaba de salir.',
  'servicios-y-herramientas-de-ia': 'Herramientas de IA — análisis a fondo de una herramienta, app o modelo concreto y cómo usarlo.',
  'automatizacion': 'Automatización y agentes — n8n, agentes de IA, flujos, integraciones, IA agéntica aplicada a procesos.',
  'guias-ia': 'Guías prácticas — tutoriales paso a paso, cómo hacer algo concreto con IA.',
  'sobre-la-ia': 'IA en la empresa — estrategia, empleo, productividad, casos de uso en pymes, ética y regulación aplicada al negocio.',
};
const CAT_SLUGS = Object.keys(CATEGORIAS);

// ----------------------------------------------------------------------------
// 1) BRIEF EDITORIAL (lo que llega a Telegram para aprobar)
// ----------------------------------------------------------------------------
export const BRIEF_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['titular', 'resumen_linea', 'que_ha_pasado', 'por_que_importa', 'dato_clave', 'hechos', 'entidades', 'publicar', 'interes', 'motivo', 'angulo', 'keyword_principal', 'keywords_secundarias', 'intencion', 'preguntas', 'categoria', 'canibaliza', 'vigencia'],
  properties: {
    titular: { type: 'string', description: 'Titular de la noticia en español, fiel a la fuente' },
    resumen_linea: { type: 'string', description: 'Una frase contundente, máx. 25 palabras' },
    que_ha_pasado: { type: 'string', description: '3-4 frases con los hechos, nombres reales y cifras de la fuente' },
    por_que_importa: { type: 'string', description: '2-3 frases: qué cambia desde hoy y para quién' },
    dato_clave: { type: 'string' },
    hechos: { type: 'array', description: '5-12 hechos verificables SACADOS DE LA FUENTE', items: { type: 'object', additionalProperties: false, required: ['dato', 'cita'], properties: { dato: { type: 'string' }, cita: { type: 'string', description: 'fragmento literal de la fuente que lo respalda (idioma original)' } } } },
    entidades: { type: 'array', items: { type: 'string' }, description: 'empresas, productos, modelos y personas citadas' },
    publicar: { type: 'boolean' },
    interes: { type: 'integer', description: '0-100: potencial para el blog (novedad, búsquedas, encaje con la audiencia)' },
    motivo: { type: 'string', description: 'por qué sí o por qué no, en 1-2 frases' },
    angulo: { type: 'string', enum: ['Noticia y análisis', 'Análisis de herramienta', 'Guía práctica', 'Comparativa', 'Tendencia y opinión'] },
    keyword_principal: { type: 'string', description: 'lo que la gente escribiría en Google en España, 2-6 palabras, en minúsculas' },
    keywords_secundarias: { type: 'array', items: { type: 'string' }, description: '3-6 long-tail y variantes semánticas' },
    intencion: { type: 'string', enum: ['Informacional', 'Comercial', 'Transaccional', 'Navegacional'] },
    preguntas: { type: 'array', items: { type: 'string' }, description: '3-5 preguntas reales tipo "Otras preguntas de los usuarios"' },
    categoria: { type: 'string', enum: CAT_SLUGS },
    canibaliza: { type: 'object', additionalProperties: false, required: ['post_id', 'titulo', 'recomendacion'], properties: { post_id: { type: 'integer', description: '0 si no hay ningún artículo del blog que ya cubra lo mismo' }, titulo: { type: 'string' }, recomendacion: { type: 'string' } } },
    vigencia: { type: 'string', enum: ['noticia', 'evergreen'] },
  },
};

export const BRIEF_SISTEMA = `Eres el editor jefe del blog de Transformaconia (transformaconia.com), consultora española de inteligencia artificial y automatización para pymes. Decides qué noticias de IA merecen artículo y preparas el brief para redactarlo.

Criterio editorial:
- Publica lo que un profesional o empresario español buscaría en Google o preguntaría a ChatGPT en los próximos días: lanzamientos relevantes, cambios que afectan a cómo se trabaja, herramientas utilizables, regulación con efecto real.
- No publiques: rumores sin fuente, notas de prensa sin sustancia, temas que el blog ya cubre (propón actualizar ese artículo) o noticias sin ángulo útil para el lector.
- La keyword principal es lo que se teclea de verdad: concreta, 2-6 palabras, sin años salvo que sean parte de la búsqueda.

REGLA DE ORO: todo dato, cifra, nombre o cita sale del texto fuente. Si no está en la fuente, no existe. Nunca inventes versiones de modelos, precios, fechas ni porcentajes.

CATEGORÍA: si vigencia es "noticia" usa noticias-ia, salvo que el artículo sea una guía paso a paso (guias-ia) o el análisis a fondo de una herramienta concreta (servicios-y-herramientas-de-ia). automatizacion solo para n8n, agentes y flujos de trabajo; sobre-la-ia para estrategia, empleo, regulación y negocio.`;

// ----------------------------------------------------------------------------
// 2) INVESTIGACIÓN CON BÚSQUEDA WEB (contexto actual y fuentes de autoridad)
// ----------------------------------------------------------------------------
export const INVESTIGACION_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['hechos', 'contexto'],
  properties: {
    hechos: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['dato', 'fuente', 'url'], properties: { dato: { type: 'string' }, fuente: { type: 'string' }, url: { type: 'string' } } } },
    contexto: { type: 'string', description: 'párrafo con el estado actual del tema' },
  },
};

// ----------------------------------------------------------------------------
// 3) REDACCIÓN DEL ARTÍCULO
// ----------------------------------------------------------------------------
export const ARTICULO_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['title', 'seo_title', 'meta_description', 'slug', 'focus_keyword', 'keywords_secundarias', 'categoria', 'etiquetas', 'extracto', 'lo_esencial', 'contenido_html', 'faq', 'fuentes', 'imagenes'],
  properties: {
    title: { type: 'string', description: 'H1: 45-65 caracteres, keyword principal al principio' },
    seo_title: { type: 'string', description: 'title tag: máx. 60 caracteres' },
    meta_description: { type: 'string', description: '130-155 caracteres, keyword + beneficio + verbo' },
    slug: { type: 'string', description: 'kebab-case ascii, 3-6 palabras, sin stopwords ni años' },
    focus_keyword: { type: 'string' },
    keywords_secundarias: { type: 'array', items: { type: 'string' } },
    categoria: { type: 'string', enum: CAT_SLUGS },
    etiquetas: { type: 'array', items: { type: 'string' }, description: '2-4 etiquetas: entidades principales (empresa, producto, tecnología)' },
    extracto: { type: 'string', description: '1-2 frases para listados del blog' },
    lo_esencial: { type: 'array', items: { type: 'string' }, description: '3-5 puntos clave, cada uno una frase autónoma citable' },
    contenido_html: { type: 'string' },
    faq: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['pregunta', 'respuesta'], properties: { pregunta: { type: 'string' }, respuesta: { type: 'string' } } } },
    fuentes: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['nombre', 'url'], properties: { nombre: { type: 'string' }, url: { type: 'string' } } } },
    imagenes: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['rol', 'prompt', 'alt', 'titulo', 'pie'], properties: { rol: { type: 'string', enum: ['portada', 'seccion_1', 'seccion_2'] }, prompt: { type: 'string' }, alt: { type: 'string' }, titulo: { type: 'string' }, pie: { type: 'string' } } } },
  },
};

export const REDACCION_SISTEMA = `Eres Juan Carlos Ros, consultor y desarrollador de IA y automatización en Transformaconia (España). Escribes el blog con voz de experto que aplica IA en empresas reales: claro, directo, con criterio propio y sin humo. Tu objetivo es doble: (1) posicionar en el top 3 de Google para la keyword principal y (2) que ChatGPT, Perplexity, Gemini y los AI Overviews de Google citen el artículo como fuente.

═══ CÓMO SE GANA EN GOOGLE Y EN LOS BUSCADORES DE IA ═══
1. RESPUESTA PRIMERO: el primer párrafo (40-70 palabras) responde directamente a la pregunta principal que hay detrás de la keyword e incluye la keyword principal de forma natural. Nada de introducciones de relleno.
2. BLOQUES CITABLES: tras cada H2, la primera frase resume la sección de forma autónoma (se puede citar sin contexto). Frases con sujeto explícito ("Claude Code es…", no "Esto es…").
3. DATOS CON ATRIBUCIÓN: cada cifra lleva su fuente en la frase ("según Anthropic", "según datos de TechCrunch"). Los modelos de IA citan lo que está atribuido.
4. ESTRUCTURA SEMÁNTICA: 4-6 H2 (uno contiene la keyword principal exacta; los demás, variantes y preguntas reales) y 2-3 H3 bajo los H2 que lo necesiten. Jerarquía limpia: nunca H3 sin H2 padre.
5. PROFUNDIDAD REAL: explica el cómo y el porqué, compara con alternativas, da un ejemplo aplicado a una empresa española (sin inventar nombres de clientes ni cifras). Incluye una <table> cuando haya comparación de opciones, precios, versiones o pasos.
6. ESCANEABLE: párrafos de 2-4 frases (máx. 90 palabras), listas <ul>/<ol> cuando enumeres (cada <li> empieza con <strong>término:</strong>), 8-14 <strong> repartidos en conceptos clave, un <blockquote> con la cita o dato más potente de la fuente.
7. ENLAZADO INTERNO: 3-5 enlaces a artículos del blog de la lista que recibes, con anclas descriptivas de 3-7 palabras dentro de frases naturales. Solo URLs de la lista.
8. ENLACES EXTERNOS: 2-4 enlaces a las fuentes originales o de autoridad que recibes (sitio oficial, anuncio, estudio). Solo URLs de las fuentes que te doy.
9. ACTUALIDAD: la fecha de hoy es {{HOY}}. El año en curso es {{ANIO}}. No escribas años pasados como si fueran el presente. No pongas el año en el título salvo que aporte (p. ej. "en {{ANIO}}").

═══ ESTILO ═══
- Español de España, tuteo al lector. Primera persona con naturalidad cuando aportes criterio ("en los proyectos que monto con pymes veo que…"), sin fórmulas repetidas.
- Prohibido: "en el mundo actual", "sin duda", "cabe destacar", "es importante destacar", "revolucionario", "disruptivo", "en conclusión", "en resumen", "sumérgete", "desbloquear", "potenciar al máximo", "juego cambiante", "paisaje", "navegar por".
- Nada de párrafos genéricos que valdrían para cualquier artículo.

═══ ANTI-ALUCINACIÓN (NO NEGOCIABLE) ═══
Solo usas nombres, versiones, cifras, fechas, precios y citas que aparezcan en los HECHOS DE LA FUENTE o en la INVESTIGACIÓN ACTUAL. Si falta un dato, escribe sin él. Una sola invención destruye la credibilidad del blog.

═══ FORMATO DE contenido_html ═══
- Etiquetas permitidas: p, h2, h3, ul, ol, li, strong, em, a, blockquote, table, thead, tbody, tr, th, td.
- SIN h1, SIN imágenes, SIN sección de preguntas frecuentes, SIN sección de fuentes, SIN llamada final a contactar (todo eso se añade después automáticamente).
- Coloca exactamente una vez los marcadores <!--IMG:seccion_1--> y <!--IMG:seccion_2--> entre bloques, justo después del párrafo que mejor ilustran (el primero en la primera mitad, el segundo en la segunda).
- Extensión: 1.300-1.700 palabras si vigencia=noticia; 1.800-2.400 si es evergreen o guía.

═══ faq ═══
3-5 preguntas reales (las del brief primero). Respuestas de 40-70 palabras: la primera frase responde sola y es factual. Sin publicidad.

═══ imagenes ═══
Tres fotos: portada, seccion_1, seccion_2. El "prompt" va EN INGLÉS y describe una FOTOGRAFÍA EDITORIAL REALISTA de una escena concreta y distinta en cada una, directamente ligada al tema del artículo (el sector, la tarea o el objeto real del que se habla). Incluye: sujeto concreto, acción, lugar realista (oficina, taller, clínica, tienda, almacén en España o Europa), luz natural, objetivo de 35 mm o 50 mm, profundidad de campo, estilo documental de revista. PROHIBIDO en los prompts: texto legible, letreros, logotipos, marcas, interfaces con letras, cerebros, circuitos, hologramas, robots humanoides (salvo que el artículo trate de robots), personas mirando una pantalla sin más. "alt" en español, 90-125 caracteres, describe literalmente la imagen e incluye de forma natural la keyword (portada) o una keyword secundaria (las otras). "titulo" 3-6 palabras. "pie" de 60-110 caracteres que aporte contexto.

═══ fuentes ═══
Lista de las fuentes realmente usadas (nombre + URL), empezando por la noticia original.

CATEGORÍA: si vigencia es "noticia" usa noticias-ia, salvo que el artículo sea una guía paso a paso (guias-ia) o el análisis a fondo de una herramienta concreta (servicios-y-herramientas-de-ia). automatizacion solo para n8n, agentes y flujos de trabajo; sobre-la-ia para estrategia, empleo, regulación y negocio.`;

// ----------------------------------------------------------------------------
// 4) CONTROL DE CALIDAD SEO (se ejecuta en un nodo Code; devuelve puntuación)
// ----------------------------------------------------------------------------
export const QC_JS = `
function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9ñ\\s-]/g, ' ').replace(/\\s+/g, ' ').trim(); }
function texto(html) { return String(html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\\s+/g, ' ').trim(); }
function contieneKw(txt, kw) {
  const t = norm(txt), k = norm(kw); if (!k) return false; if (t.includes(k)) return true;
  const stop = new Set(['de','la','el','en','y','a','los','las','del','para','con','por','que','un','una','como','al','lo','su','sus','es']);
  const ws = k.split(' ').filter(w => w.length > 2 && !stop.has(w));
  return ws.length > 0 && ws.every(w => t.includes(w));
}
function evaluar(a, ctx) {
  const issues = []; let score = 100;
  const pen = (p, msg) => { score -= p; issues.push(msg); };
  const kw = a.focus_keyword || '';
  const html = a.contenido_html || '';
  const plano = texto(html);
  const palabras = plano.split(' ').filter(Boolean).length;
  const anio = ctx.anio;
  if (!kw) pen(15, 'Falta la keyword principal');
  if ((a.title || '').length < 35 || (a.title || '').length > 68) pen(5, 'Título H1 de ' + (a.title || '').length + ' caracteres (ideal 45-65)');
  if (!contieneKw(a.title, kw)) pen(10, 'La keyword principal no aparece en el título');
  if ((a.seo_title || '').length > 62) pen(4, 'Title SEO de ' + a.seo_title.length + ' caracteres (máx. 60)');
  const md = (a.meta_description || '').length;
  if (md < 120 || md > 160) pen(5, 'Meta description de ' + md + ' caracteres (ideal 130-155)');
  if (!contieneKw(a.meta_description, kw)) pen(4, 'La keyword no aparece en la meta description');
  if (!/^[a-z0-9]+(-[a-z0-9]+){1,7}$/.test(a.slug || '') || (a.slug || '').length > 60) pen(4, 'Slug mejorable: ' + a.slug);
  if (/(^|-)20\\d\\d(-|$)/.test(a.slug || '')) pen(3, 'El slug lleva un año (caduca)');
  const primeras = plano.split(' ').slice(0, 120).join(' ');
  if (!contieneKw(primeras, kw)) pen(8, 'La keyword no aparece en las primeras 120 palabras');
  const h2 = [...html.matchAll(/<h2[^>]*>([\\s\\S]*?)<\\/h2>/gi)].map(m => texto(m[1]));
  const h3 = (html.match(/<h3[^>]*>/gi) || []).length;
  if (h2.length < 4) pen(8, 'Solo ' + h2.length + ' secciones H2 (mín. 4)');
  if (h3 < 3) pen(4, 'Solo ' + h3 + ' subsecciones H3');
  if (!h2.some(t => contieneKw(t, kw))) pen(5, 'Ningún H2 contiene la keyword principal');
  if (/<h1/i.test(html)) pen(5, 'El contenido incluye un H1 (ya lo pone WordPress)');
  const minPal = ctx.vigencia === 'evergreen' ? 1500 : 1100;
  if (palabras < minPal) pen(10, 'Solo ' + palabras + ' palabras (mín. ' + minPal + ')');
  const enlaces = [...html.matchAll(/<a\\s[^>]*href=["']([^"']+)["']/gi)].map(m => m[1]);
  const internos = enlaces.filter(u => /transformaconia\\.com/.test(u));
  const externos = enlaces.filter(u => /^https?:/.test(u) && !/transformaconia\\.com/.test(u));
  if (internos.length < 3 && ctx.hayInternos) pen(8, 'Solo ' + internos.length + ' enlaces internos (mín. 3)');
  const invalidos = internos.filter(u => !ctx.urlsInternas.has(u.replace(/#.*$/, '').replace(/\\/?$/, '/')));
  if (invalidos.length) pen(6, 'Enlaces internos que no existen: ' + invalidos.slice(0, 3).join(', '));
  if (externos.length < 1) pen(4, 'Sin enlaces a fuentes externas de autoridad');
  if ((a.faq || []).length < 3) pen(6, 'FAQ con menos de 3 preguntas');
  if ((a.lo_esencial || []).length < 3) pen(4, 'Faltan los puntos clave (Lo esencial)');
  if (!/<blockquote/i.test(html)) pen(2, 'Sin blockquote con cita de la fuente');
  if (!/<ul|<ol|<table/i.test(html)) pen(3, 'Sin listas ni tablas (poco escaneable)');
  const parrafos = [...html.matchAll(/<p[^>]*>([\\s\\S]*?)<\\/p>/gi)].map(m => texto(m[1]).split(' ').length);
  const largos = parrafos.filter(n => n > 110).length;
  if (largos > 1) pen(4, largos + ' párrafos de más de 110 palabras');
  const prohibidas = ['en el mundo actual','sin duda','cabe destacar','es importante destacar','revolucionari','disruptiv','en conclusion','sumergete','desbloquear','juego cambiante','paisaje de la ia','navegar por'];
  const pn = norm(plano);
  const usadas = prohibidas.filter(p => pn.includes(p));
  if (usadas.length) pen(Math.min(8, usadas.length * 2), 'Muletillas de IA: ' + usadas.join(', '));
  const titYears = ((a.title || '') + ' ' + (a.seo_title || '')).match(/20\\d\\d/g) || [];
  const malos = titYears.filter(y => +y < anio && !ctx.fuenteTexto.includes(y));
  if (malos.length) pen(15, 'Año desfasado en el título: ' + malos.join(', '));
  const cuerpoYears = (plano.match(/\\b20\\d\\d\\b/g) || []).filter(y => +y < anio - 1 && !ctx.fuenteTexto.includes(y));
  if (cuerpoYears.length > 2) pen(4, 'Años antiguos sin respaldo en la fuente: ' + [...new Set(cuerpoYears)].join(', '));
  const nk = norm(plano).split(' ').length;
  const apar = (norm(plano).match(new RegExp(norm(kw).replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&'), 'g')) || []).length;
  const dens = nk ? (apar * norm(kw).split(' ').length) / nk * 100 : 0;
  if (kw && dens > 2.8) pen(4, 'Keyword repetida en exceso (' + dens.toFixed(1) + '%)');
  if (kw && apar < 2) pen(3, 'La keyword exacta aparece menos de 2 veces');
  if ((a.imagenes || []).length < 3) pen(3, 'Faltan prompts de imagen');
  for (const im of a.imagenes || []) if ((im.alt || '').length < 60) { pen(1, 'Alt de imagen corto (' + im.rol + ')'); }
  return { score: Math.max(0, Math.round(score)), issues, metricas: { palabras, h2: h2.length, h3, internos: internos.length, externos: externos.length, faq: (a.faq || []).length, densidad: +dens.toFixed(2) } };
}
`;
