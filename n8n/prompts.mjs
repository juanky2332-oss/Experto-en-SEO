// Prompts y esquemas JSON del publicador. Separados del flujo para poder
// afinarlos sin tocar la estructura de nodos.
// v4 (2026-10-14): pista del panel «Qué publicar», estructura para posicionar y convertir,
// control de calidad con fallos bloqueantes (se corrige en 1 vuelta) y reglas de marca.

import { TIPO_CLAVES } from '../src/lib/guia-base.ts';

export const CATEGORIAS = {
  'actualidad-ia': 'Actualidad IA — lo que cambia de verdad en la IA para una empresa: normativa (AI Act), ayudas, lanzamientos y tendencias contados por su impacto práctico.',
  'gestion-y-facturacion': 'Gestión y facturación — facturas, albaranes, presupuestos, partes, stock, informes, ERP y automatización de procesos en pymes industriales.',
  'ia-en-la-industria': 'IA en la industria — casos de empresas industriales (fabricación, mecanizado, mantenimiento, instaladoras, distribución técnica) que aplican IA, y sectores y Región de Murcia.',
};
// Compatibilidad: la guía editorial guardada en la BD puede traer los slugs antiguos
export const CAT_ANTIGUAS = { 'noticias-ia': 'actualidad-ia', 'trucos-y-consejos-ia': 'actualidad-ia', 'servicios-y-herramientas-de-ia': 'actualidad-ia', 'guias-ia': 'actualidad-ia', 'automatizacion': 'gestion-y-facturacion', 'sobre-la-ia': 'gestion-y-facturacion' };
const CAT_SLUGS = Object.keys(CATEGORIAS);

// ----------------------------------------------------------------------------
// 1) BRIEF EDITORIAL (lo que llega a Telegram para aprobar)
// ----------------------------------------------------------------------------
export const BRIEF_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['titular', 'tipo', 'resumen_linea', 'que_ha_pasado', 'por_que_importa', 'dato_clave', 'hechos', 'entidades', 'publicar', 'interes', 'motivo', 'angulo', 'keyword_principal', 'keywords_secundarias', 'intencion', 'publico', 'preguntas', 'categoria', 'canibaliza', 'vigencia'],
  properties: {
    titular: { type: 'string', description: 'Titular de trabajo en español (con noticia: fiel a la fuente)' },
    tipo: { type: 'string', enum: TIPO_CLAVES, description: 'tipo de artículo según la guía editorial' },
    resumen_linea: { type: 'string', description: 'Una frase contundente, máx. 25 palabras' },
    que_ha_pasado: { type: 'string', description: 'Con noticia: 3-4 frases con los hechos de la fuente. Sin fuente: qué problema resuelve el artículo y qué va a cubrir' },
    por_que_importa: { type: 'string', description: '2-3 frases: qué gana el lector y por qué ahora' },
    dato_clave: { type: 'string', description: 'Con noticia: el dato más potente de la fuente. Sin fuente: la idea clave (sin cifras inventadas)' },
    hechos: { type: 'array', description: '5-12 hechos verificables SACADOS DE LA FUENTE; vacío si no hay texto fuente', items: { type: 'object', additionalProperties: false, required: ['dato', 'cita'], properties: { dato: { type: 'string' }, cita: { type: 'string', description: 'fragmento literal de la fuente que lo respalda (idioma original)' } } } },
    entidades: { type: 'array', items: { type: 'string' }, description: 'organismos, normas, empresas, productos o tecnologías citadas' },
    publicar: { type: 'boolean' },
    interes: { type: 'integer', description: '0-100: potencial para el blog (búsquedas, encaje con la audiencia industrial, conversión)' },
    motivo: { type: 'string', description: 'por qué sí o por qué no, en 1-2 frases' },
    angulo: { type: 'string', enum: ['Noticia y análisis', 'Análisis de herramienta', 'Guía práctica', 'Comparativa', 'Tendencia y opinión'] },
    keyword_principal: { type: 'string', description: 'lo que la gente escribiría en Google en España, 2-6 palabras, en minúsculas' },
    keywords_secundarias: { type: 'array', items: { type: 'string' }, description: '3-6 long-tail y variantes semánticas' },
    intencion: { type: 'string', enum: ['Informacional', 'Comercial', 'Transaccional', 'Navegacional', 'Local'] },
    publico: { type: 'string', description: 'a quién va dirigido, en una frase (p. ej. «jefe de producción de un taller de 10-50 personas»)' },
    preguntas: { type: 'array', items: { type: 'string' }, description: '4-6 preguntas reales tipo «Otras preguntas de los usuarios» de Google' },
    categoria: { type: 'string', enum: CAT_SLUGS },
    canibaliza: { type: 'object', additionalProperties: false, required: ['post_id', 'titulo', 'recomendacion'], properties: { post_id: { type: 'integer', description: '0 si ningún artículo existente (publicado o programado) ataca la misma keyword' }, titulo: { type: 'string' }, recomendacion: { type: 'string' } } },
    vigencia: { type: 'string', enum: ['noticia', 'evergreen'] },
  },
};

export const BRIEF_SISTEMA = `Eres el editor jefe del blog de Transforma con IA (transformaconia.com), un grupo de expertos en IA de Murcia que hace consultoría de inteligencia artificial y automatización para la INDUSTRIA (primero empresas industriales de toda España, después la Región de Murcia, y en tercer lugar la IA general). Decides qué temas merecen artículo y preparas el brief siguiendo la GUÍA EDITORIAL que recibes.

Criterio editorial:
- Lector principal: el responsable técnico de la pyme industrial (jefe de taller, de producción, de mantenimiento, de oficina técnica). Lector secundario: el gerente que decide contratar. Escribimos para que encuentren la respuesta y, si les encaja, nos pidan ayuda.
- Elige el TIPO de artículo que más valor saca del tema: actualidad (algo acaba de pasar), truco (un consejo concreto y copiable), guia (paso a paso), herramienta (análisis o comparativa), automatizacion (un proceso de la empresa automatizado) o empresa (casos, retorno, normativa para directivos).
- Publica lo que ese lector buscaría en Google o preguntaría a un asistente de IA en los próximos días.
- No publiques: rumores sin fuente, notas de prensa sin sustancia, temas que el blog ya cubre (propón ampliar ese artículo) o noticias sin ángulo útil para una empresa industrial.
- La keyword principal es lo que se teclea de verdad: concreta, 2-6 palabras, sin años salvo que sean parte de la búsqueda.
- Canibalización: compara la keyword con los FOCOS de Rank Math de los artículos existentes (publicados y programados). Si alguno ataca la misma intención, indícalo en "canibaliza".

PISTA DEL EDITOR: si recibes una PISTA (desde el panel «Qué publicar»), MANDA sobre lo que tú deduzcas: usa su keyword principal tal cual, sus secundarias, su intención, su público, su categoría o destino y su CTA. Solo completas lo que falte. Si la pista llega sin texto fuente, el artículo es evergreen: "hechos" va VACÍO (la investigación web posterior aportará datos con fuente) y en los demás campos no escribas cifras.

REGLA DE ORO: todo dato, cifra, nombre o cita sale del texto fuente. Si no está en la fuente, no existe. Nunca inventes versiones, precios, fechas ni porcentajes.

CATEGORÍA (solo existen tres): ia-en-la-industria (casos industriales, sectores, Región de Murcia), gestion-y-facturacion (procesos de gestión: facturas, presupuestos, partes, stock, informes, ERP) y actualidad-ia (novedades, normativa, ayudas, herramientas).`;

// ----------------------------------------------------------------------------
// 2) INVESTIGACIÓN CON BÚSQUEDA WEB (contexto actual y fuentes de autoridad)
// ----------------------------------------------------------------------------
export const INVESTIGACION_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['hechos', 'contexto', 'preguntas_relacionadas'],
  properties: {
    hechos: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['dato', 'fuente', 'url', 'tipo_fuente'], properties: { dato: { type: 'string' }, fuente: { type: 'string' }, url: { type: 'string' }, tipo_fuente: { type: 'string', enum: ['oficial', 'primaria', 'medio'] } } } },
    contexto: { type: 'string', description: 'párrafo con el estado actual del tema' },
    preguntas_relacionadas: { type: 'array', items: { type: 'string' }, description: '4-6 preguntas que la gente hace sobre el tema (tipo «Otras preguntas de los usuarios»)' },
  },
};

export const INVESTIGACION_SISTEMA = 'Eres un documentalista riguroso. Respondes solo con hechos verificados en fuentes que has consultado, siempre con su URL exacta. Priorizas fuentes oficiales (BOE, Agencia Tributaria, ministerios, Comisión Europea, EUR-Lex, INE, Eurostat, CARM/INFO Murcia, normas UNE/ISO) y primarias (documentación del fabricante, estudios de asociaciones industriales o universidades). Nada de blogs de SEO, agregadores ni páginas de proveedores que venden lo mismo.';

// ----------------------------------------------------------------------------
// 3) REDACCIÓN DEL ARTÍCULO
// ----------------------------------------------------------------------------
export const ARTICULO_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['title', 'seo_title', 'meta_description', 'slug', 'focus_keyword', 'keywords_secundarias', 'categoria', 'etiquetas', 'extracto', 'entradilla', 'lo_esencial', 'contenido_html', 'faq', 'fuentes', 'imagenes'],
  properties: {
    title: { type: 'string', description: 'H1: 45-65 caracteres, contiene la keyword principal de forma natural (mejor al principio)' },
    seo_title: { type: 'string', description: 'title tag: máx. 60 caracteres, empieza por la keyword o la lleva en las primeras palabras' },
    meta_description: { type: 'string', description: '130-155 caracteres: keyword + beneficio concreto para el lector + verbo' },
    slug: { type: 'string', description: 'kebab-case ascii, 3-5 palabras, sin stopwords ni años' },
    focus_keyword: { type: 'string' },
    keywords_secundarias: { type: 'array', items: { type: 'string' } },
    categoria: { type: 'string', enum: CAT_SLUGS },
    etiquetas: { type: 'array', items: { type: 'string' }, description: '2-4 etiquetas: temas o entidades principales (nunca herramientas internas por marca)' },
    extracto: { type: 'string', description: '1-2 frases para listados del blog' },
    entradilla: { type: 'string', description: 'texto plano, 2-3 frases (40-60 palabras) que responden la búsqueda: candidata a fragmento destacado; contiene la keyword principal' },
    lo_esencial: { type: 'array', items: { type: 'string' }, description: '3-5 puntos clave, cada uno una frase autónoma citable' },
    contenido_html: { type: 'string' },
    faq: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['pregunta', 'respuesta'], properties: { pregunta: { type: 'string' }, respuesta: { type: 'string' } } } },
    fuentes: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['nombre', 'url'], properties: { nombre: { type: 'string' }, url: { type: 'string' } } } },
    imagenes: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['rol', 'prompt', 'alt', 'titulo', 'pie'], properties: { rol: { type: 'string', enum: ['portada', 'seccion_1', 'seccion_2'] }, prompt: { type: 'string' }, alt: { type: 'string' }, titulo: { type: 'string' }, pie: { type: 'string' } } } },
  },
};

export const REDACCION_SISTEMA = `Eres el equipo editorial de Transforma con IA, un grupo de expertos en IA de Murcia (consultores y desarrolladores) que aplica inteligencia artificial y automatización en empresas industriales. Firmas como «Redacción Transforma con IA» y nunca mencionas nombres propios del equipo. Escribes con voz de quien monta estas soluciones: claro, directo, con criterio propio y sin humo. Tu objetivo es triple: (1) posicionar en el top 3 de Google para la keyword principal, (2) que los buscadores con IA (AI Overviews, ChatGPT, Perplexity) citen el artículo y (3) que el lector que encaja dé el paso de contactar.

═══ ESTRUCTURA OBLIGATORIA (para posicionar y convertir) ═══
1. H1 ("title"): contiene la keyword principal de forma natural, con mayúscula inicial y nombres propios bien escritos.
2. ENTRADILLA ("entradilla", texto plano): 2-3 frases (40-60 palabras) que RESPONDEN la búsqueda directamente e incluyen la keyword principal. Es el fragmento destacado: definición o respuesta + para quién + qué vas a encontrar. Se coloca automáticamente arriba; NO la repitas en contenido_html.
3. El índice, "Lo esencial", las preguntas frecuentes, las fuentes y la firma se montan solos: NO los escribas en contenido_html.
4. contenido_html: 5-7 H2 que cubren la INTENCIÓN de búsqueda y las PREGUNTAS RELACIONADAS que recibes («la gente también pregunta»). Al menos un H2 contiene la keyword principal (o sus palabras clave en el mismo orden); los demás usan variantes y preguntas reales. 2-4 H3 bajo los H2 que lo necesiten (nunca un H3 sin H2 padre).
5. Tras cada H2, la primera frase resume la sección de forma autónoma y citable, con sujeto explícito («Un informe de producción semanal recoge…», no «Esto recoge…»).
6. Una <table> o lista comparativa cuando aporte (opciones, antes/después, qué medir, pasos, costes). Con <thead> y <tbody>.
7. EJEMPLO: si pones un ejemplo con cifras (horas, euros, piezas, %), va en un bloque <div class="tca-ejemplo"><p><strong>Ejemplo ficticio:</strong> …</p></div> con una empresa inventada claramente marcada («Talleres Demo SL», «Empresa X»). Fuera de ese bloque no hay cifras de resultados que no vengan de una fuente citada.
8. CIERRE: el último H2 es práctico («Por dónde empezar…», «Cómo dar el primer paso…», nunca «Conclusión»): resume en 2-3 frases qué hacer y termina con UNA llamada a la acción enlazada a la página que se te indica como CTA (o a https://transformaconia.com/contacto/#reserva, diagnóstico gratis). Sin presión ni promesas.
9. ENLACES INTERNOS: 3-6 en total, con ancla descriptiva de 3-7 palabras dentro de frases naturales (nunca «aquí» ni «este artículo»). Combina 1-3 PÁGINAS DE SERVICIO/SECTOR/ERP/LOCALES y 1-3 ARTÍCULOS DEL BLOG de las listas que recibes. Si hay ENLACES OBLIGATORIOS, van todos. Solo URLs de las listas, copiadas exactas.
10. ENLACES EXTERNOS: 1-3 a fuentes oficiales o primarias de la lista de URLs permitidas, en la frase que usa el dato. Solo esas URLs.
11. EXTENSIÓN: la del rango que se indica en el TIPO DE ARTÍCULO (cuenta entradilla + contenido_html).

═══ SEO SIN RELLENO ═══
- Keyword principal: en el H1, en la entradilla, en al menos un H2 y 2-5 veces más repartida por el texto. Densidad natural (0,5-2 %): si suena forzada, usa variantes y sinónimos.
- seo_title ≤ 60 caracteres con la keyword al principio. meta_description de 130-155 caracteres con keyword + beneficio concreto + verbo («Aprende a…», «Evita…», «Te contamos cómo…»).
- slug corto: 3-5 palabras clave, sin artículos ni preposiciones, sin año.
- La fecha de hoy es {{HOY}}. El año en curso es {{ANIO}}. No escribas años pasados como si fueran el presente ni pongas el año en el título salvo que aporte.

═══ REGLAS DE MARCA (NO NEGOCIABLES; el control automático las rechaza) ═══
- NUNCA nombres herramientas internas por marca (n8n, OpenAI, ChatGPT, GPT, Claude, Anthropic, Gemini, Zapier, Make…) como algo que usamos o recomendamos: se habla del PROCESO y del RESULTADO («un asistente que lee el albarán», «una automatización que envía el informe»). Excepción: en artículos de Actualidad IA cuya NOTICIA trata de esa herramienta puede aparecer como tema, nunca como «lo que usamos».
- Nunca «Flownexion». Nunca nombres de persona (ni del equipo, ni clientes, ni testimonios). Nunca clientes, cifras, resultados ni certificaciones inventadas: nada de «un cliente nuestro ahorró…».
- El programa de gestión se llama «TransformaConIA Gestión» y es un ERP PARA LA INDUSTRIA (nunca «para el metal»). Precios solo si vienen al caso y siempre exactos: 690 € de puesta en marcha (dos pagos de 345 €), 69 €/mes con los 3 primeros meses gratis, usuario extra 15 €/mes, sin permanencia, sin IVA.
- Verifactu: puedes explicarlo con fuentes oficiales, pero NUNCA afirmes que nuestro ERP lo cumple, está adaptado o certificado.
- Español de España: tuteo al lector; nada de «computadora», «celular», «ustedes», «chequear», «aplicativo», «ahorita».

═══ ESTILO ═══
- Primera persona del PLURAL con naturalidad cuando aportes criterio («cuando lo implantamos en talleres vemos que…»), nunca en singular y sin inventar experiencias medibles.
- Párrafos de 2-4 frases (máx. 90 palabras); listas <ul>/<ol> cuando enumeres (cada <li> puede empezar con <strong>término:</strong>); 8-14 <strong> en conceptos clave; un <blockquote> solo si hay una cita o dato potente de una fuente real.
- Prohibido: "en el mundo actual", "sin duda", "cabe destacar", "es importante destacar", "revolucionario", "disruptivo", "en conclusión", "en resumen", "sumérgete", "desbloquear", "potenciar al máximo", "juego cambiante", "paisaje", "navegar por".
- Nada de párrafos genéricos que valdrían para cualquier artículo: procesos reales de un taller o una planta, criterios para decidir, errores típicos.

═══ ANTI-ALUCINACIÓN ═══
Solo usas nombres, versiones, cifras, fechas, precios y citas que aparezcan en los HECHOS DE LA FUENTE o en la INVESTIGACIÓN ACTUAL (cada cifra con su fuente en la frase: «según el INE…»). Si falta un dato, escribe sin él. Una sola invención destruye la credibilidad del blog.

═══ FORMATO DE contenido_html ═══
- Etiquetas permitidas: p, h2, h3, ul, ol, li, strong, em, a, blockquote, table, thead, tbody, tr, th, td, pre, code y <div class="tca-ejemplo">.
- SIN h1, SIN imágenes, SIN entradilla repetida, SIN preguntas frecuentes, SIN fuentes, SIN firma.
- Coloca exactamente una vez los marcadores <!--IMG:seccion_1--> y <!--IMG:seccion_2--> entre bloques, justo después del párrafo que mejor ilustran (el primero en la primera mitad, el segundo en la segunda).

═══ faq ═══
3-5 preguntas reales (las de la pista y las preguntas relacionadas primero; que no repitan un H2 literal). Respuestas de 40-70 palabras: la primera frase responde sola y es factual. Sin publicidad.

═══ imagenes ═══
Tres imágenes: portada, seccion_1, seccion_2, en el ESTILO VISUAL del tipo de artículo (el estilo se añade solo, tú describes QUÉ se ve). El "prompt" va EN INGLÉS y describe objetos o escenas concretas que representan la idea (en artículos industriales: piezas, máquinas, planos, cajas de repuestos, tablets en un taller…). Las tres son composiciones DISTINTAS: portada = la idea principal; seccion_1 = un detalle o paso concreto; seccion_2 = el resultado. Evita lo trillado (equipo mirando un portátil, cerebros, circuitos, hologramas, robots humanoides). PROHIBIDO en la imagen: texto legible, letreros, logotipos, marcas o nombres de empresa inventados, interfaces con letras. "alt" en español, 80-125 caracteres, describe literalmente lo que se ve; el alt de la PORTADA incluye la keyword principal si encaja con naturalidad. "titulo" 3-6 palabras. "pie" de 60-110 caracteres que aporte contexto.

═══ fuentes ═══
Lista de las fuentes realmente usadas (nombre + URL), empezando por la más oficial. Solo URLs permitidas.

{{TIPO}}

═══ GUÍA EDITORIAL (resumen) ═══
{{GUIA}}`;

// ----------------------------------------------------------------------------
// 4) CONTROL DE CALIDAD SEO (se pega en un nodo Code; funciones autocontenidas)
// ----------------------------------------------------------------------------
// Devuelve { score, bloqueantes[], avisos[], issues[], metricas }.
// Un fallo bloqueante obliga a revisar el artículo (1 vuelta) y, si sigue, se guarda como borrador.
function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ\s-]/g, ' ').replace(/\s+/g, ' ').trim(); }
function texto(html) { return String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim(); }
function palabrasClave(s) {
  const stop = new Set(['de', 'la', 'el', 'en', 'y', 'a', 'los', 'las', 'del', 'para', 'con', 'por', 'que', 'un', 'una', 'como', 'al', 'lo', 'su', 'sus', 'es', 'sin', 'tu', 'mas', 'o']);
  return norm(s).split(' ').filter((w) => w.length > 2 && !stop.has(w));
}
function contieneKw(txt, kw) {
  const t = norm(txt), k = norm(kw); if (!k) return false; if (t.includes(k)) return true;
  const ws = palabrasClave(kw);
  // tolera singular/plural: «informe» casa con «informes»
  const raiz = (w) => w.length > 4 ? w.replace(/(es|s)$/, '') : w;
  return ws.length > 0 && ws.every((w) => t.includes(raiz(w)));
}
function rutaDe(u) {
  // sin URL(): no existe en el sandbox de los Code nodes de n8n
  const s = String(u || '').trim().replace(/^https?:\/\/[^/]+/i, '').replace(/[?#].*$/, '');
  return ('/' + s.replace(/^\/+/, '')).replace(/\/?$/, '/');
}
function evaluar(a, ctx) {
  const bloq = [], avisos = []; let score = 100;
  const B = (msg) => { score -= 8; bloq.push(msg); };
  const pen = (p, msg) => { score -= p; avisos.push(msg); };
  const kw = a.focus_keyword || '';
  const html = String(a.contenido_html || '');
  const entr = String(a.entradilla || '');
  const cuerpo = texto(html);
  const plano = (entr + ' ' + cuerpo).trim();
  const palabras = plano.split(' ').filter(Boolean).length;
  const todo = [a.title, a.seo_title, a.meta_description, a.extracto, entr, cuerpo, (a.lo_esencial || []).join(' '), (a.faq || []).map((f) => f.pregunta + ' ' + f.respuesta).join(' '), (a.etiquetas || []).join(' '), (a.imagenes || []).map((i) => i.alt + ' ' + i.pie + ' ' + i.titulo).join(' ')].join(' \n ');
  const frases = todo.split(/(?<=[.!?…])\s+|\n/).map((x) => x.trim()).filter(Boolean);
  const fuenteN = norm(ctx.fuenteTexto || '');

  // --- title, description, slug ---
  if (!kw) B('Falta la keyword principal');
  const st = a.seo_title || a.title || '';
  if (st.length > 60) B('Title SEO de ' + st.length + ' caracteres (máx. 60)');
  if (!contieneKw(st, kw)) B('La keyword no aparece en el title SEO');
  if ((a.title || '').length < 35 || (a.title || '').length > 70) pen(4, 'H1 de ' + (a.title || '').length + ' caracteres (ideal 45-65)');
  if (!contieneKw(a.title, kw)) B('La keyword principal no aparece en el H1');
  const md = (a.meta_description || '').length;
  if (md > 155) B('Meta description de ' + md + ' caracteres (máx. 155)');
  else if (md < 120) pen(4, 'Meta description corta: ' + md + ' caracteres (ideal 130-155)');
  if (!contieneKw(a.meta_description, kw)) pen(4, 'La keyword no aparece en la meta description');
  if (!/(aprende|descubre|evita|consigue|ahorra|te contamos|te explicamos|cómo|como|paso a paso|sin |gana|reduce|controla|elige|calcula|qué|guía)/i.test(a.meta_description || '')) pen(2, 'La meta description no deja claro el beneficio');
  const sl = a.slug || '';
  if (!/^[a-z0-9]+(-[a-z0-9]+){0,7}$/.test(sl)) B('Slug no válido: ' + sl);
  else if (sl.split('-').length > 5 || sl.length > 50) pen(3, 'Slug largo (' + sl.split('-').length + ' palabras): ' + sl);
  if (/(^|-)20\d\d(-|$)/.test(sl)) pen(3, 'El slug lleva un año (caduca)');

  // --- keyword en la estructura ---
  const h2 = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => texto(m[1]));
  const h3 = (html.match(/<h3[^>]*>/gi) || []).length;
  if (entr.split(' ').length < 25 || entr.split(' ').length > 75) pen(4, 'Entradilla de ' + entr.split(' ').length + ' palabras (ideal 40-60)');
  if (!contieneKw(entr, kw)) B('La keyword no aparece en la entradilla (primer párrafo)');
  if (!h2.some((t) => contieneKw(t, kw))) B('Ningún H2 contiene la keyword principal');
  if (h2.length < 4) pen(8, 'Solo ' + h2.length + ' secciones H2 (mín. 4)');
  if (h3 < 2) pen(3, 'Solo ' + h3 + ' subsecciones H3');
  if (/<h1/i.test(html)) pen(5, 'El contenido incluye un H1 (ya lo pone WordPress)');
  if (/^\s*conclusi[oó]n/i.test(h2[h2.length - 1] || '')) pen(2, 'El último H2 se llama «Conclusión» (mejor algo práctico)');
  const nk = norm(plano).split(' ').length;
  const kwN = norm(kw);
  const apar = kwN ? (norm(plano).match(new RegExp(kwN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length : 0;
  const dens = nk ? (apar * kwN.split(' ').length) / nk * 100 : 0;
  if (kw && dens > 2.5) B('Keyword repetida en exceso (' + dens.toFixed(1) + '%): suena a relleno');
  if (kw && apar < 2) pen(3, 'La keyword exacta aparece ' + apar + ' veces (natural: 3-8)');

  // --- extensión según intención ---
  if (palabras < ctx.minPal * 0.75) B('Solo ' + palabras + ' palabras (rango ' + ctx.minPal + '-' + ctx.maxPal + ')');
  else if (palabras < ctx.minPal) pen(6, 'Algo corto: ' + palabras + ' palabras (rango ' + ctx.minPal + '-' + ctx.maxPal + ')');
  else if (palabras > ctx.maxPal * 1.25) pen(4, 'Largo para su intención: ' + palabras + ' palabras (rango ' + ctx.minPal + '-' + ctx.maxPal + ')');

  // --- enlaces ---
  const enlaces = [...html.matchAll(/<a\s[^>]*href=["']([^"']+)["']/gi)].map((m) => m[1]);
  const internos = [...new Set(enlaces.filter((u) => /^\/|transformaconia\.com/.test(u)))];
  const externos = [...new Set(enlaces.filter((u) => /^https?:/.test(u) && !/transformaconia\.com/.test(u)))];
  if (internos.length < 3) B('Solo ' + internos.length + ' enlaces internos (mín. 3)');
  if (internos.length > 8) pen(2, internos.length + ' enlaces internos (máx. recomendado 6)');
  const noLista = internos.filter((u) => !ctx.rutasInternas.has(rutaDe(u)));
  if (noLista.length) B('Enlaces internos que no están en la web: ' + noLista.slice(0, 3).join(', '));
  const rotos = internos.filter((u) => ctx.estado && ctx.estado[u] && ctx.estado[u] !== 200);
  if (rotos.length) B('Enlaces internos que no responden 200: ' + rotos.map((u) => u + ' (' + ctx.estado[u] + ')').slice(0, 3).join(', '));
  const aPaginas = internos.filter((u) => ctx.rutasPaginas.has(rutaDe(u)));
  if (!aPaginas.length) B('Ningún enlace a una página de servicio, sector, ERP o local');
  const faltan = (ctx.obligatorios || []).filter((u) => !internos.some((x) => rutaDe(x) === rutaDe(u)));
  if (faltan.length) B('Faltan enlaces obligatorios de la pista: ' + faltan.join(', '));
  const ultimo = html.split(/<h2[^>]*>/i).pop() || '';
  const ctaOk = [...ultimo.matchAll(/<a\s[^>]*href=["']([^"']+)["']/gi)].map((m) => m[1]).some((u) => /transformaconia\.com|^\//.test(u) && (ctx.rutasCta.has(rutaDe(u)) || /\/contacto\//.test(u)));
  if (!ctaOk) B('El cierre no termina con una llamada a la acción enlazada (contacto o página de servicio)');
  if (ctx.urlsExternas.size && externos.length < 1) B('Sin enlaces a fuentes externas oficiales o primarias');
  if (externos.length > 4) pen(2, externos.length + ' enlaces externos (máx. recomendado 3)');
  const extNo = externos.filter((u) => !ctx.urlsExternas.has(u.replace(/#.*$/, '').replace(/\/$/, '')));
  if (extNo.length) B('Enlaces externos que no salen de la investigación: ' + extNo.slice(0, 3).join(', '));
  const extRotos = externos.filter((u) => ctx.estado && (ctx.estado[u] === 404 || ctx.estado[u] === 410));
  if (extRotos.length) B('Enlaces externos rotos (404): ' + extRotos.join(', '));

  // --- piezas para posicionar ---
  const nf = (a.faq || []).length;
  if (nf < 3) B('FAQ con ' + nf + ' preguntas (mín. 3)');
  else if (nf > 6) pen(1, 'FAQ con ' + nf + ' preguntas (ideal 3-5)');
  if ((a.lo_esencial || []).length < 3) pen(4, 'Faltan los puntos clave (Lo esencial)');
  if (!/<ul|<ol|<table/i.test(html)) pen(4, 'Sin listas ni tablas (poco escaneable)');
  if (!/<table/i.test(html)) pen(1, 'Sin tabla comparativa');
  const parrafos = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => texto(m[1]).split(' ').length);
  const largos = parrafos.filter((n) => n > 110).length;
  if (largos > 1) pen(4, largos + ' párrafos de más de 110 palabras');

  // --- imágenes ---
  const ims = a.imagenes || [];
  if (ims.length < 3) pen(3, 'Faltan prompts de imagen');
  for (const im of ims) if (String(im.alt || '').trim().length < 40) B('Alt de imagen vacío o muy corto (' + im.rol + ')');
  const portada = ims.find((i) => i.rol === 'portada');
  if (portada && !contieneKw(portada.alt, kw)) pen(1, 'El alt de la portada no menciona la keyword');

  // --- reglas de marca y veracidad ---
  if (/flownexion/i.test(todo)) B('Menciona Flownexion');
  if (/para el metal\b/i.test(todo)) B('Dice «para el metal» (es un ERP para la industria)');
  const MARCAS = /\b(n8n|openai|chatgpt|gpt-?\d[\w.]*|claude|anthropic|gemini|zapier|make\.com|copilot|langchain)\b/i;
  const NUESTRO = /(usamos|utilizamos|empleamos|trabajamos con|montamos con|nos apoyamos en|nuestr[oa]s? (flujos?|agentes?|herramientas?|stack|automatizaciones|asistentes?)|con el que trabajamos|recomendamos)/i;
  const conMarca = frases.filter((f) => MARCAS.test(f));
  if (ctx.categoria === 'actualidad-ia') {
    const malas = conMarca.filter((f) => NUESTRO.test(f));
    if (malas.length) B('Presenta herramientas internas como «lo que usamos»: «' + malas[0].slice(0, 110) + '»');
  } else if (conMarca.length) {
    B('Nombra herramientas internas por marca (' + [...new Set(conMarca.map((f) => (f.match(MARCAS) || [''])[0].toLowerCase()))].join(', ') + ')');
  }
  if (/verifactu|veri\*factu/i.test(todo)) {
    const vf = frases.filter((f) => /verifactu|veri\*factu/i.test(f) && /(nuestr[oa]|transformaconia gesti[oó]n|el erp que (montamos|ofrecemos))/i.test(f) && /(cumple|compatible|adaptad|homologad|certificad|preparad|garantiza)/i.test(f) && !/no (lo )?cumple|todav[ií]a no|a[uú]n no/i.test(f));
    if (vf.length) B('Afirma que nuestro ERP cumple Verifactu: «' + vf[0].slice(0, 110) + '»');
  }
  const inventado = frases.filter((f) => /(nuestros? clientes?|un cliente nuestro|uno de nuestros clientes|empresas? con las que trabajamos|hemos ayudado a|le ayudamos a|conseguimos (que|reducir|ahorrar)|logramos|hemos ahorrado|ahorramos a)/i.test(f) && !/ficticio|ejemplo|imagina|supongamos/i.test(f));
  if (inventado.length) B('Posible cliente o resultado inventado: «' + inventado[0].slice(0, 110) + '»');
  const sinEjemplo = html.replace(/<div class="tca-ejemplo"[\s\S]*?<\/div>/gi, ' ').replace(/<table[\s\S]*?<\/table>/gi, ' ');
  const ejemplos = [...html.matchAll(/<div class="tca-ejemplo"[\s\S]*?<\/div>/gi)].map((m) => m[0]);
  for (const e of ejemplos) if (!/ficticio/i.test(e)) B('Bloque de ejemplo sin marcar como ficticio');
  const ejNoMarcados = [...sinEjemplo.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => texto(m[1])).filter((p) => /\b(por ejemplo|ejemplo|imagina|supongamos)\b/i.test(p) && /\d[\d.,]*\s?(€|euros|%|horas|h\b|piezas)/i.test(p) && !/ficticio|ilustrativo|orientativo/i.test(p));
  if (ejNoMarcados.length) B('Ejemplo con cifras sin marcar como ficticio: «' + ejNoMarcados[0].slice(0, 100) + '»');
  const PRECIOS_OK = /\b(690|345|69|15)\s?€/;
  const cifras = [...sinEjemplo.matchAll(/<(p|li)[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => texto(m[2]))
    .flatMap((p) => p.split(/(?<=[.!?])\s+/))
    .filter((f) => /\d[\d.,]*\s?(%|€|euros)/i.test(f) && !/según|fuente|datos de|informe|estudio|encuesta|orientativ|ficticio|ejemplo|aprox/i.test(f) && !PRECIOS_OK.test(f))
    .filter((f) => !(f.match(/\d[\d.,]*/g) || []).some((n) => n.length > 1 && fuenteN.includes(n)));
  if (cifras.length >= 3) B(cifras.length + ' cifras (% o €) sin fuente ni marca de ejemplo: «' + cifras[0].slice(0, 90) + '»');
  else if (cifras.length) pen(3, 'Cifra sin fuente: «' + cifras[0].slice(0, 90) + '»');
  const NOMBRE = /(?:\b(?:dice|explica|afirma|comenta|cuenta|asegura|señala|recuerda|según)\s+)([A-ZÁÉÍÓÚ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚ][a-záéíóúñ]+)|([A-ZÁÉÍÓÚ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚ][a-záéíóúñ]+),\s+(?:gerente|director|directora|jefe|jefa|responsable|ceo|fundador|fundadora|propietario|dueño)/g;
  const permitidas = new Set((ctx.entidades || []).map(norm));
  const nombres = [...todo.matchAll(NOMBRE)].map((m) => m[1] || m[2]).filter(Boolean)
    .filter((n) => !permitidas.has(norm(n)) && !(ctx.categoria === 'actualidad-ia' && fuenteN.includes(norm(n))))
    .filter((n) => !/^(Agencia|Comisión|Ministerio|Región|Unión|Diario|Boletín|Instituto|Real|Ley|Gobierno|Consejo|Banco|Cámara)/.test(n));
  if (/juan carlos|bautista/i.test(todo)) nombres.push('nombre del equipo');
  if (nombres.length) B('Nombres de persona: ' + [...new Set(nombres)].slice(0, 3).join(', '));
  const LATAM = /\b(computadoras?|computador|celular(es)?|ahorita|platicar|aplicativos?|chequear|ustedes)\b/i;
  const lat = todo.match(LATAM);
  if (lat) B('Expresión que no es de España: «' + lat[0] + '»');

  // --- estilo y fechas ---
  const prohibidas = ['en el mundo actual', 'sin duda', 'cabe destacar', 'es importante destacar', 'revolucionari', 'disruptiv', 'en conclusion', 'en resumen', 'sumergete', 'desbloquear', 'potenciar al maximo', 'juego cambiante', 'paisaje de la ia', 'navegar por'];
  const pn = norm(plano);
  const usadas = prohibidas.filter((p) => pn.includes(p));
  if (usadas.length) pen(Math.min(8, usadas.length * 2), 'Muletillas de IA: ' + usadas.join(', '));
  const titYears = ((a.title || '') + ' ' + (a.seo_title || '')).match(/20\d\d/g) || [];
  const malos = titYears.filter((y) => +y < ctx.anio && !String(ctx.fuenteTexto || '').includes(y));
  if (malos.length) B('Año desfasado en el título: ' + malos.join(', '));
  const cuerpoYears = (plano.match(/\b20\d\d\b/g) || []).filter((y) => +y < ctx.anio - 1 && !String(ctx.fuenteTexto || '').includes(y));
  if (cuerpoYears.length > 2) pen(4, 'Años antiguos sin respaldo en la fuente: ' + [...new Set(cuerpoYears)].join(', '));

  // --- canibalización (aviso, no bloquea) ---
  const kwSet = new Set(palabrasClave(kw));
  const canibal = [];
  for (const p of ctx.focos || []) {
    const focos = String(p.foco || '').split(',').map((x) => x.trim()).filter(Boolean);
    for (const f of focos.slice(0, 3)) {
      const fs = new Set(palabrasClave(f)); if (!fs.size || !kwSet.size) continue;
      const comun = [...kwSet].filter((w) => fs.has(w)).length;
      const jac = comun / new Set([...kwSet, ...fs]).size;
      if (norm(f) === kwN || jac >= 0.6) { canibal.push({ id: p.id, titulo: p.titulo, foco: f, estado: p.estado }); break; }
    }
  }
  if (canibal.length) pen(3, 'Posible canibalización con #' + canibal.map((c) => c.id + ' «' + c.titulo.slice(0, 50) + '» (foco: ' + c.foco + ')').slice(0, 2).join('; '));

  score = Math.max(0, Math.round(score));
  return {
    score, bloqueantes: bloq, avisos, issues: [...bloq.map((x) => '⛔ ' + x), ...avisos], canibal,
    metricas: { palabras, h2: h2.length, h3, internos: internos.length, a_paginas: aPaginas.length, externos: externos.length, faq: nf, densidad: +dens.toFixed(2), apariciones_kw: apar, rango: ctx.minPal + '-' + ctx.maxPal },
  };
}

export const QC_JS = [norm, texto, palabrasClave, contieneKw, rutaDe, evaluar].map((f) => f.toString()).join('\n');
export const QC_FUNCIONES = { norm, texto, palabrasClave, contieneKw, rutaDe, evaluar };
