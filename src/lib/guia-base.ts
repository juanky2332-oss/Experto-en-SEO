// Guía editorial y configuración del radar: tipos y valores de partida.
// Módulo puro (sin imports) para que lo usen la app y los scripts de n8n
// (`node n8n/radar.mjs` lo importa directamente gracias al type-stripping de Node).
// La guía viva está en seo.settings (key 'guia'); esto es solo el punto de partida.

export type TipoClave = "actualidad" | "truco" | "guia" | "herramienta" | "automatizacion" | "empresa";
export const TIPO_CLAVES: TipoClave[] = ["actualidad", "truco", "guia", "herramienta", "automatizacion", "empresa"];

export type TipoContenido = {
  clave: TipoClave;
  nombre: string;
  categoria: string; // slug de la categoría de WordPress
  objetivo: string;
  estructura: string[];
  extension: string;
  min_palabras: number;
  cadencia: string;
  cta: string;
  estilo_imagen: string; // descripción en español (para la guía)
  estilo_prompt: string; // sufijo en inglés que se añade al prompt de gpt-image-2
};
export type Audiencia = { nombre: string; peso: string; quien: string; que_busca: string; como_ganarla: string };
export type Pilar = { nombre: string; categoria: string; descripcion: string; keywords: string[] };
export type Propuesta = { titulo: string; tipo: TipoClave; keyword: string; pilar: string; por_que: string };
export type Guia = {
  version: number;
  actualizada: string;
  posicionamiento: string;
  audiencias: Audiencia[];
  embudo: string[];
  pilares: Pilar[];
  tipos: TipoContenido[];
  ritmo: string[];
  reglas_seo: string[];
  reglas_ia: string[];
  voz: string[];
  no_publicar: string[];
  proximos: Propuesta[];
  notas: string[];
};

export type RadarConfig = {
  activo: boolean;
  frecuencia: "diario" | "semanal" | "panel";
  dia_semana: number; // 1 = lunes … 7 = domingo
  hora: number; // 6-22, hora de Madrid
  temas: string[]; // preferencias: se buscan también en la web y puntúan más
  excluir: string[];
  tipos: TipoClave[];
  buscar_web: boolean;
  max_propuestas: number;
  score_minimo: number;
};

export const RADAR_DEFECTO: RadarConfig = {
  activo: true,
  frecuencia: "diario",
  dia_semana: 1,
  hora: 8,
  temas: ["Claude Code", "n8n", "agentes de IA", "MCP", "OpenAI API"],
  excluir: ["rondas de financiación", "criptomonedas"],
  tipos: [...TIPO_CLAVES],
  buscar_web: true,
  max_propuestas: 5,
  score_minimo: 70,
};

const SIN_TEXTO = "No text, no letters, no numbers, no logos, no brand marks, no watermarks, no readable user interfaces.";
const PALETA = "brand palette of cobalt blue (#2563eb), soft lavender (#EBD3F8), near-black and warm off-white";

export const TIPOS_BASE: TipoContenido[] = [
  {
    clave: "actualidad",
    nombre: "Actualidad",
    categoria: "noticias-ia",
    objetivo: "Llegar el primero en español con lo que cambia de verdad tras un lanzamiento o anuncio, y captar el pico de búsquedas y Google Discover.",
    estructura: [
      "Respuesta directa (40-70 palabras): qué ha pasado, desde cuándo y a quién afecta",
      "Lo esencial: 3-5 puntos citables",
      "Qué cambia en la práctica, con un ejemplo de uso real",
      "Cómo probarlo hoy: requisitos, disponibilidad en España/UE, precio",
      "Comparación con la versión anterior o la competencia (tabla)",
      "Limitaciones y lo que todavía no se sabe",
      "Qué significa para una empresa (2-3 frases con criterio)",
      "Preguntas frecuentes",
    ],
    extension: "1.000-1.500 palabras",
    min_palabras: 1000,
    cadencia: "Solo cuando hay algo gordo; publicar en menos de 48 h",
    cta: "¿Quieres saber si esto te ahorra trabajo en tu empresa? Te lo contamos en una llamada de 20 minutos.",
    estilo_imagen: "Bodegón conceptual de revista tecnológica: uno o dos objetos físicos que simbolizan la noticia, luz de estudio y acentos de color de marca.",
    estilo_prompt: `Editorial conceptual still-life photograph for a high-end technology magazine: one or two symbolic physical objects that represent the news, clean composition with generous negative space, dramatic soft studio lighting, ${PALETA} as color accents. No people. ${SIN_TEXTO}`,
  },
  {
    clave: "truco",
    nombre: "Trucos y consejos",
    categoria: "trucos-y-consejos-ia",
    objetivo: "Ganar búsquedas long-tail muy concretas («cómo hacer X en Claude Code») y ser la fuente que citan ChatGPT y Perplexity. Es el contenido que más se comparte entre técnicos.",
    estructura: [
      "El truco en dos frases y el resultado que consigues",
      "Cuándo merece la pena (y cuándo no)",
      "Paso a paso con el comando, prompt o configuración copiable en <pre><code>",
      "Ejemplo real antes/después",
      "Variantes y trucos relacionados",
      "Errores comunes",
      "Preguntas frecuentes",
    ],
    extension: "800-1.300 palabras",
    min_palabras: 750,
    cadencia: "1 por semana; revisar cada 3 meses (las herramientas cambian rápido)",
    cta: "Si quieres este tipo de flujos montados y documentados en tu equipo, lo hacemos por ti.",
    estilo_imagen: "Ilustración 3D isométrica de arcilla mate con la paleta de marca: una pequeña escena que visualiza el truco (teclas, atajos, piezas que encajan).",
    estilo_prompt: `Clean 3D isometric illustration with soft matte clay materials, ${PALETA}, subtle soft shadows, a small tidy scene that visualizes the trick through objects (keys, shortcuts as arrows, pieces clicking together, a terminal window shape with no text), modern minimal tech-blog style. ${SIN_TEXTO}`,
  },
  {
    clave: "guia",
    nombre: "Guías y rutas",
    categoria: "guias-ia",
    objetivo: "Posicionar búsquedas «cómo…» de volumen medio y ser el artículo pilar que enlazan los trucos y la actualidad. Rutas de aprendizaje para pasar de usuario a constructor.",
    estructura: [
      "Qué vas a conseguir, para quién es y requisitos",
      "Pasos numerados (un H3 por paso) con configuración y código",
      "Checklist final",
      "Errores habituales y cómo resolverlos",
      "Siguiente paso: qué aprender o montar después (ruta)",
      "Preguntas frecuentes",
    ],
    extension: "1.800-3.000 palabras",
    min_palabras: 1500,
    cadencia: "1 cada 1-2 semanas; actualizar al menos cada trimestre",
    cta: "¿Prefieres que lo implantemos nosotros y formemos a tu equipo? Escríbenos.",
    estilo_imagen: "Ilustración vectorial plana y editorial con una metáfora de proceso (camino, escalones, bloques conectados).",
    estilo_prompt: `Flat vector editorial illustration with a clear visual metaphor for a step-by-step process (a path, stairs, connected blocks, a route map with no labels), geometric shapes, ${PALETA}, lots of whitespace, calm and precise. ${SIN_TEXTO}`,
  },
  {
    clave: "herramienta",
    nombre: "Herramientas y comparativas",
    categoria: "servicios-y-herramientas-de-ia",
    objetivo: "Captar intención comercial («X vs Y», «mejor herramienta para…») con pruebas reales y un veredicto claro.",
    estructura: [
      "Veredicto en 40-70 palabras",
      "Tabla comparativa (precio, límites, puntos fuertes)",
      "Para quién sí y para quién no",
      "Prueba real: qué hicimos y qué salió",
      "Precios y costes ocultos",
      "Alternativas",
      "Preguntas frecuentes",
    ],
    extension: "1.500-2.200 palabras",
    min_palabras: 1300,
    cadencia: "1 cada 2 semanas",
    cta: "Te ayudamos a elegir e integrar la herramienta adecuada con tus sistemas.",
    estilo_imagen: "Fotografía de producto premium: objetos físicos que simbolizan las herramientas comparadas, lado a lado, sobre fondo lavanda o gris claro.",
    estilo_prompt: `Premium product-style photograph: physical objects that symbolize the tools being compared, arranged side by side, seamless soft lavender or light grey backdrop, softbox lighting, crisp detail, ${PALETA} accents. ${SIN_TEXTO}`,
  },
  {
    clave: "automatizacion",
    nombre: "Automatización y agentes",
    categoria: "automatizacion",
    objetivo: "Recetas de flujos con n8n, agentes y MCP que funcionan en producción: lo que diferencia a quien monta sistemas de quien solo chatea con la IA.",
    estructura: [
      "El problema que resuelve y el resultado (tiempo o dinero)",
      "Arquitectura del flujo: nodos o piezas en una lista ordenada",
      "Configuración paso a paso (prompts, JSON, código en <pre><code>)",
      "Coste real por ejecución y mantenimiento",
      "Cómo escalarlo y qué puede fallar",
      "Preguntas frecuentes",
    ],
    extension: "1.500-2.500 palabras",
    min_palabras: 1300,
    cadencia: "1 cada 1-2 semanas",
    cta: "Montamos este flujo (u otro a medida) en tu empresa, con soporte.",
    estilo_imagen: "Ilustración isométrica 3D de una máquina o cadena de montaje: módulos conectados, tuberías y cubos que avanzan.",
    estilo_prompt: `Isometric 3D illustration of a workflow as an elegant machine or assembly line: connected modules, pipes and conveyor belts moving small glowing cubes between stations, ${PALETA}, clean precise engineering look. ${SIN_TEXTO}`,
  },
  {
    clave: "empresa",
    nombre: "IA en la empresa",
    categoria: "sobre-la-ia",
    objetivo: "Convencer al que decide y paga: casos, retorno, riesgos y cumplimiento (AI Act, RGPD). Es la puerta directa a contratarnos.",
    estructura: [
      "Respuesta directa a la pregunta del directivo",
      "Datos con fuente (productividad, costes, adopción)",
      "Caso aplicado a un sector español concreto (sin inventar clientes)",
      "Costes, plazos y equipo necesario",
      "Riesgos y cumplimiento",
      "Cómo empezar: hoja de ruta en 3-4 fases",
      "Preguntas frecuentes",
    ],
    extension: "1.500-2.200 palabras",
    min_palabras: 1300,
    cadencia: "1 cada 1-2 semanas",
    cta: "Pide un diagnóstico gratuito: te decimos qué procesos automatizar primero y cuánto ahorrarías.",
    estilo_imagen: "Fotografía documental realista en un negocio español concreto (taller, clínica, almacén, tienda): personas haciendo trabajo real.",
    estilo_prompt: `Documentary editorial photograph in a real Spanish business setting (workshop, clinic, warehouse, shop or office, chosen to match the topic), people doing concrete hands-on work, candid, natural light, 35mm lens, shallow depth of field, authentic textures, subtle ${PALETA} tones in the environment. ${SIN_TEXTO}`,
  },
];

export const GUIA_INICIAL: Guia = {
  version: 1,
  actualizada: "2026-09-25",
  posicionamiento:
    "Transformaconia es la referencia en español para quien ya usa IA y quiere llevarla a producción: novedades con criterio, trucos, comandos, flujos y agentes que funcionan, contados por quien los monta en empresas reales. El blog demuestra que sabemos hacerlo; las empresas nos contratan para que lo hagamos por ellas.",
  audiencias: [
    {
      nombre: "El practicante avanzado",
      peso: "≈70 % de los artículos",
      quien: "Desarrolladores, técnicos, freelances, responsables de operaciones y usuarios intensivos que ya usan ChatGPT o Claude a diario y han tocado Claude Code, Cursor, n8n o la API.",
      que_busca: "Qué ha cambiado y cómo aprovecharlo hoy, comandos y configuraciones copiables, prompts de sistema, flujos listos, comparativas honestas, costes reales y errores que evitar.",
      como_ganarla: "Contenido que no encuentra en español en otro sitio, con ejemplos exactos. Nada de «qué es la IA». Son quienes enlazan, comparten y proponen proveedor dentro de su empresa.",
    },
    {
      nombre: "El decisor de empresa",
      peso: "≈30 % de los artículos",
      quien: "Gerentes, directores de operaciones y CTO de pymes y medianas empresas españolas que saben que la IA les toca pero no tienen equipo para montarla.",
      que_busca: "Casos de su sector, retorno, cuánto cuesta, por dónde empezar, riesgos y cumplimiento (AI Act, RGPD).",
      como_ganarla: "Artículos de «IA en la empresa» con casos y cifras con fuente, y en cada artículo técnico un párrafo de «qué significa para tu empresa» con una llamada a la acción concreta.",
    },
  ],
  embudo: [
    "Entrada: actualidad y trucos atraen tráfico (Google, Discover, citas en ChatGPT/Perplexity).",
    "Profundidad: cada pieza enlaza a su guía pilar y a 2-3 artículos del mismo cluster.",
    "Confianza: casos y artículos de empresa demuestran experiencia real (E-E-A-T).",
    "Conversión: llamada a la acción según el tipo de artículo → contacto o diagnóstico gratuito.",
  ],
  pilares: [
    { nombre: "Claude Code y agentes de programación", categoria: "guias-ia", descripcion: "Uso avanzado de Claude Code, Codex, Cursor y agentes que programan: comandos, hooks, subagentes, CLAUDE.md, MCP y flujos de trabajo.", keywords: ["claude code", "comandos claude code", "claude code hooks", "subagentes claude code", "claude.md", "claude code vs cursor", "codex cli"] },
    { nombre: "Automatización con n8n", categoria: "automatizacion", descripcion: "Flujos n8n con IA listos para producción, integraciones, self-hosting y costes.", keywords: ["n8n", "n8n ia", "flujos n8n", "n8n vs make", "agentes n8n", "n8n self hosted", "plantillas n8n"] },
    { nombre: "Agentes de IA y MCP", categoria: "automatizacion", descripcion: "Diseño de agentes, Model Context Protocol, herramientas, memoria, multiagente y seguridad.", keywords: ["agentes de ia", "model context protocol", "servidor mcp", "crear agente ia", "multiagente"] },
    { nombre: "Modelos y novedades", categoria: "noticias-ia", descripcion: "Lanzamientos de OpenAI, Anthropic, Google y open source contados por su impacto práctico.", keywords: ["gpt-5.5", "claude opus", "gemini", "modelos open source", "comparativa modelos ia"] },
    { nombre: "Prompts y productividad avanzada", categoria: "trucos-y-consejos-ia", descripcion: "Prompts de sistema, proyectos, skills, GPTs y hábitos para sacar más a la IA en el día a día.", keywords: ["prompts avanzados", "prompt de sistema", "skills de claude", "proyectos claude", "gpts personalizados"] },
    { nombre: "IA en la empresa", categoria: "sobre-la-ia", descripcion: "Implantación, casos por sector, retorno, costes y regulación.", keywords: ["implementar ia en empresas", "ia para pymes", "ai act", "casos de uso ia", "coste ia empresa"] },
  ],
  tipos: TIPOS_BASE,
  ritmo: [
    "Base de 3-4 artículos por semana: 1 truco, 1 guía o automatización (alternando), 1 herramienta o empresa (alternando) y actualidad solo cuando haya algo gordo.",
    "Cada mes: un artículo pilar nuevo o una actualización fuerte de un pilar existente.",
    "Cada trimestre: revisar los 10 artículos con más tráfico y actualizar versiones, precios y fechas.",
  ],
  reglas_seo: [
    "Una keyword principal por URL. Si ya hay un artículo sobre lo mismo, se actualiza en lugar de duplicarlo.",
    "Title ≤60 caracteres con la keyword al principio; meta description de 130-155; slug corto sin año.",
    "Respuesta directa en las primeras 60 palabras.",
    "3-5 enlaces internos: siempre al pilar del cluster y a 2 relacionados; el pilar se actualiza para enlazar lo nuevo.",
    "La actualidad caduca: a los 30-60 días se actualiza o se enlaza desde un artículo evergreen.",
    "Cada dato con su fuente enlazada; versiones, precios y fechas exactos.",
    "Imágenes WebP 1536×1024 con alt descriptivo y natural (sin meter keywords a la fuerza).",
    "Nada de contenido pobre: menos de 750 palabras solo si resuelve la duda por completo.",
  ],
  reglas_ia: [
    "Frases autónomas y citables con sujeto explícito («Claude Code permite…», no «Esto permite…»).",
    "Definición clara al empezar cada sección y datos numéricos con fuente atribuida.",
    "Tablas, listas y bloques de código: es lo que más citan los buscadores con IA.",
    "Preguntas frecuentes con preguntas reales de usuarios.",
    "Aportar lo que un modelo no puede sacar de otra parte: el comando exacto, el flujo probado, el coste medido.",
    "Mismo nombre de marca y autor en todo el sitio; llms.txt al día e IndexNow al publicar.",
  ],
  voz: [
    "Español de España, tuteo, directo y con criterio propio.",
    "Primera persona solo cuando aporta experiencia real («en los flujos que montamos…»).",
    "Técnico sin ser críptico: se explica el porqué, no solo el cómo.",
    "Prohibidas las muletillas de IA («en el mundo actual», «sin duda», «revolucionario», «sumérgete»…).",
  ],
  no_publicar: [
    "Rondas de financiación, fichajes y cotizaciones sin impacto práctico.",
    "Rumores y filtraciones sin fuente primaria.",
    "Papers académicos sin aplicación inmediata.",
    "Básicos para principiantes («qué es ChatGPT») salvo que falte ese pilar.",
    "Listas genéricas de «10 herramientas de IA» sin prueba real.",
    "Novedades solo disponibles en EE. UU. sin fecha para España/UE (como mucho, una mención).",
  ],
  proximos: [],
  notas: [],
};

/** Versión compacta de la guía para meterla en los prompts de la IA. */
export function guiaATexto(g: Guia): string {
  const l = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n");
  return [
    `POSICIONAMIENTO: ${g.posicionamiento}`,
    `AUDIENCIAS:\n${g.audiencias.map((a) => `- ${a.nombre} (${a.peso}): ${a.quien} Busca: ${a.que_busca}`).join("\n")}`,
    `PILARES (clusters):\n${g.pilares.map((p) => `- ${p.nombre} [${p.categoria}]: ${p.descripcion} Keywords: ${p.keywords.join(", ")}`).join("\n")}`,
    `TIPOS DE CONTENIDO:\n${g.tipos.map((t) => `- ${t.clave} = ${t.nombre}: ${t.objetivo}`).join("\n")}`,
    `RITMO:\n${l(g.ritmo)}`,
    `NO PUBLICAR:\n${l(g.no_publicar)}`,
    g.notas.length ? `NOTAS DEL EDITOR:\n${l(g.notas)}` : "",
  ].filter(Boolean).join("\n\n");
}

/** Tipo de contenido por categoría de WordPress (para artículos ya publicados). */
export function tipoDeCategoria(slug: string | undefined, g: Guia = GUIA_INICIAL): TipoContenido {
  return g.tipos.find((t) => t.categoria === slug) ?? g.tipos.find((t) => t.clave === "empresa")!;
}
