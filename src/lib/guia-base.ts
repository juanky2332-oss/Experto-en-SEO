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
export type Pilar = { nombre: string; categoria: string; descripcion: string; keywords: string[]; destinos?: string[] }; // destinos = páginas de la web a las que lleva el pilar
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
  temas: ["IA en la industria casos de éxito", "inteligencia artificial fabricación España", "mantenimiento predictivo con IA", "visión artificial control de calidad", "digitalización pymes industriales", "ERP para la industria", "Verifactu facturación pymes", "industria Región de Murcia"],
  excluir: ["rondas de financiación", "criptomonedas"],
  tipos: [...TIPO_CLAVES],
  buscar_web: true,
  max_propuestas: 5,
  score_minimo: 70,
};

const SIN_TEXTO = "No text, no letters, no numbers, no logos, no brand marks, no watermarks, no readable user interfaces.";
const PALETA = "brand palette of electric purple (#B020FF), soft lavender (#EBD3F8), near-black and warm off-white";

export const TIPOS_BASE: TipoContenido[] = [
  {
    clave: "actualidad",
    nombre: "Actualidad",
    categoria: "actualidad-ia",
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
    categoria: "actualidad-ia",
    objetivo: "Ganar búsquedas long-tail muy concretas de la oficina técnica y la gestión del taller («cómo calcular el coste hora-máquina», «cómo numerar albaranes») y ser la fuente que citan los buscadores con IA.",
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
    categoria: "gestion-y-facturacion",
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
    categoria: "actualidad-ia",
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
    categoria: "gestion-y-facturacion",
    objetivo: "Procesos de una empresa industrial automatizados de principio a fin (facturas, presupuestos, partes, pedidos, stock, informes): qué piezas lleva, cuánto cuesta y qué puede fallar. Sin nombrar herramientas internas por marca.",
    estructura: [
      "El problema que resuelve y el resultado (tiempo o dinero)",
      "Cómo es el proceso hoy y cómo queda automatizado (pasos en una lista ordenada)",
      "Qué datos y documentos hacen falta y quién interviene en cada paso",
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
    categoria: "ia-en-la-industria",
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
  actualizada: "2026-10-14",
  posicionamiento:
    "Transforma con IA es un grupo de expertos en IA de Murcia que hace consultoría de inteligencia artificial y automatización para la industria: primero empresas industriales de toda España, después la Región de Murcia y, en tercer lugar, la IA en general sin diluir el foco. El blog cuenta casos reales de empresas industriales, procesos de gestión (facturas, presupuestos, partes, ERP, stock, calidad, informes) y la actualidad que importa, y lleva a cada lector a la solución que le encaja: ERP para la industria, asistentes técnicos, gestión documental o automatizaciones.",
  audiencias: [
    {
      nombre: "El responsable técnico de la pyme industrial",
      peso: "≈50 % de los artículos",
      quien: "Jefes de taller, de producción, de mantenimiento y de oficina técnica de talleres, fabricantes, instaladoras y distribuidores técnicos que pelean cada día con papeles, hojas de cálculo y avisos.",
      que_busca: "Cómo dejar de teclear facturas y albaranes, presupuestar con margen, controlar repuestos y stock, partes de trabajo en el móvil, calidad sin papel e informes que se hagan solos.",
      como_ganarla: "Procesos explicados paso a paso con ejemplos ficticios marcados, plantillas y criterios para decidir. Nada de jerga ni de herramientas por marca: el proceso y el resultado.",
    },
    {
      nombre: "El gerente o decisor de empresa industrial",
      peso: "≈50 % de los artículos",
      quien: "Gerentes y dueños de pymes industriales de la Región de Murcia y del resto de España que saben que la IA les toca pero no tienen equipo para montarla.",
      que_busca: "Casos reales de su sector, cuánto cuesta, por dónde empezar, ayudas disponibles, qué ERP necesita y qué cambia con la normativa (Verifactu, AI Act).",
      como_ganarla: "Casos con fuente, costes orientativos y una hoja de ruta concreta; en cada artículo el enlace a la página de su sector o a /erp-industria/ y la llamada al diagnóstico gratis.",
    },
  ],
  embudo: [
    "Entrada: casos industriales, procesos y actualidad que importa traen tráfico (Google y buscadores con IA).",
    "Profundidad: cada pieza enlaza a su pilar, a 2-3 artículos del mismo cluster y a la página de sector o local que le corresponde.",
    "Confianza: casos y ejemplos ficticios bien marcados demuestran que sabemos cómo trabaja una empresa industrial (E-E-A-T).",
    "Conversión: llamada a la acción según la categoría → diagnóstico gratis, /erp-industria/ o contacto.",
  ],
  pilares: [
    { nombre: "IA en la industria", categoria: "ia-en-la-industria", descripcion: "Casos reales de empresas industriales que aplican IA y automatización: qué problema tenían, qué hicieron, qué beneficios obtuvieron con cifras de la fuente y qué puede copiar una pyme española.", keywords: ["ia en la industria", "inteligencia artificial en la industria", "casos de éxito ia industria", "automatización industrial con ia", "industria 4.0 pymes"], destinos: ["/industria/", "/casos/"] },
    { nombre: "Gestión y facturación", categoria: "gestion-y-facturacion", descripcion: "Facturas, cobros, documentos y programa de gestión en una empresa industrial: cómo ordenarlo y automatizarlo, cuánto cuesta y qué normativa afecta.", keywords: ["programa de gestión para empresas industriales", "automatizar facturación", "control de cobros", "gestión administrativa taller"], destinos: ["/erp-industria/", "/gestion-documental-ia/"] },
    { nombre: "Actualidad IA", categoria: "actualidad-ia", descripcion: "Lo que cambia de verdad en la IA para una empresa: normativa (AI Act), ayudas, tendencias y lanzamientos contados por su impacto práctico, sin hablar de nuestras herramientas internas.", keywords: ["ai act empresas", "novedades inteligencia artificial empresas", "regulación ia pymes", "ia para empresas"], destinos: ["/blog/", "/soluciones/"] },
    { nombre: "Documentos y facturas con IA", categoria: "gestion-y-facturacion", descripcion: "Leer facturas, albaranes, pedidos y certificados con IA y pasarlos al programa sin teclear.", keywords: ["automatizar facturas de proveedores", "leer facturas con ia", "gestión documental con ia", "digitalizar albaranes", "ocr facturas"], destinos: ["/gestion-documental-ia/", "/automatizacion-procesos-ia/"] },
    { nombre: "Presupuestos y costes", categoria: "gestion-y-facturacion", descripcion: "Calcular lo que cuesta cada trabajo o servicio para ponerle margen: coste hora-máquina, mano de obra, materiales y presupuestos más rápidos.", keywords: ["coste hora máquina", "cómo hacer presupuestos en un taller", "calcular margen de un trabajo", "programa de presupuestos"], destinos: ["/erp-industria/"] },
    { nombre: "Partes de trabajo y albaranes", categoria: "gestion-y-facturacion", descripcion: "Partes de trabajo, albaranes firmados en el móvil, horas por obra y facturar el mismo día.", keywords: ["parte de trabajo digital", "albarán digital", "firma de albarán en el móvil", "control de horas por obra"], destinos: ["/erp-industria/", "/ia-mantenimiento-industrial/"] },
    { nombre: "ERP para la industria", categoria: "gestion-y-facturacion", descripcion: "Qué ERP necesita una pyme industrial, cuánto cuesta, cómo se implanta y cómo se conecta con lo que ya usa.", keywords: ["erp para la industria", "erp para talleres", "erp pyme industrial", "programa de gestión para taller", "cuánto cuesta un erp"], destinos: ["/erp-industria/"] },
    { nombre: "Stock y repuestos", categoria: "gestion-y-facturacion", descripcion: "Control de stock, repuestos y almacén: mínimos, ubicaciones, compras y pedidos sin duplicar.", keywords: ["control de stock", "gestión de repuestos", "inventario de almacén", "automatizar compras"], destinos: ["/ia-mantenimiento-industrial/", "/distribucion-industrial/"] },
    { nombre: "Calidad", categoria: "ia-en-la-industria", descripcion: "Control de calidad, no conformidades, trazabilidad y visión artificial aplicada a la fabricación.", keywords: ["control de calidad con ia", "visión artificial control de calidad", "gestión de no conformidades", "trazabilidad en fabricación"], destinos: ["/ia-fabricacion-industrial/"] },
    { nombre: "Informes e indicadores", categoria: "gestion-y-facturacion", descripcion: "Informes que se hacen solos: rentabilidad por trabajo, productividad, cuadros de mando e indicadores de taller y mantenimiento.", keywords: ["cuadro de mando para pymes", "indicadores de producción", "informes automáticos", "rentabilidad por trabajo"], destinos: ["/automatizacion-procesos-ia/", "/erp-industria/"] },
    { nombre: "Murcia y Región de Murcia", categoria: "ia-en-la-industria", descripcion: "IA y automatización para la industria de la Región de Murcia y alrededores: ayudas regionales, polígonos, sectores locales y visitas en persona.", keywords: ["consultoría ia murcia", "automatización industrial murcia", "ayudas digitalización murcia", "inteligencia artificial cartagena", "empresas industriales murcia"], destinos: ["/consultor-ia-murcia/", "/automatizacion-industria-cartagena/", "/automatizacion-industria-molina-de-segura/", "/automatizacion-industria-lorca/", "/automatizacion-industria-alcantarilla/", "/automatizacion-industria-elche/", "/automatizacion-industria-albacete/"] },
    { nombre: "Talleres industriales", categoria: "ia-en-la-industria", descripcion: "Talleres de mecanizado, calderería, carpintería metálica, reparación de maquinaria e hidráulica: presupuestos, órdenes de trabajo y gestión.", keywords: ["software gestión taller industrial", "ia para talleres", "gestión de taller de mecanizado", "órdenes de trabajo taller"], destinos: ["/ia-talleres-industriales/", "/erp-industria/"] },
    { nombre: "Mantenimiento industrial", categoria: "ia-en-la-industria", descripcion: "Mantenimiento preventivo y predictivo, avisos, órdenes de trabajo y repuestos con IA.", keywords: ["ia mantenimiento industrial", "mantenimiento predictivo con ia", "software de mantenimiento", "gestión de averías"], destinos: ["/ia-mantenimiento-industrial/"] },
    { nombre: "Empresas instaladoras", categoria: "ia-en-la-industria", descripcion: "Instaladoras eléctricas, de climatización, fontanería y telecomunicaciones: avisos, partes, certificados y facturación.", keywords: ["software para empresas instaladoras", "ia para instaladores", "gestión de avisos", "partes de trabajo instaladores"], destinos: ["/ia-empresas-instaladoras/"] },
    { nombre: "Fabricación", categoria: "ia-en-la-industria", descripcion: "Fabricación y producción: planificación, órdenes de fabricación, calidad y datos de máquina.", keywords: ["ia en fabricación", "planificación de la producción", "órdenes de fabricación", "inteligencia artificial en fabricación"], destinos: ["/ia-fabricacion-industrial/"] },
    { nombre: "Distribución técnica", categoria: "ia-en-la-industria", descripcion: "Distribuidores industriales y técnicos: asistente de catálogo, equivalencias, pedidos y atención al cliente.", keywords: ["chatbot para distribuidores industriales", "asistente técnico de catálogo", "ia en distribución industrial", "equivalencias de referencias"], destinos: ["/distribucion-industrial/", "/agentes-chatbots-ia/"] },
  ],
  tipos: TIPOS_BASE,
  ritmo: [
    "Base de 4 artículos por semana: 1 de «IA en la industria» (un caso real con su fuente), 1 de proceso de «Gestión y facturación» (facturas, presupuestos, partes, ERP, stock, informes), 1 de sector o de la Región de Murcia y 1 de «Actualidad IA» solo si es normativa o ayudas que obliguen o beneficien a una empresa industrial (nunca lanzamientos de modelos ni herramientas de programación: esa categoría queda fuera de Google).",
    "Cada mes: un artículo pilar nuevo o una actualización fuerte de una página de sector o local.",
    "Cada trimestre: revisar los 10 artículos con más tráfico y actualizar versiones, precios y fechas.",
  ],
  reglas_seo: [
    "Una keyword principal por URL. Si ya hay un artículo o una página sobre lo mismo, se amplía en lugar de duplicarlo.",
    "Title ≤60 caracteres con la keyword al principio; meta description de 130-155; slug corto sin año.",
    "Respuesta directa en las primeras 60 palabras.",
    "3-5 enlaces internos: siempre al pilar del cluster y a 2 relacionados, y 1 a la página que le toca: /erp-industria/, /industria/, /ia-talleres-industriales/, /ia-mantenimiento-industrial/, /ia-empresas-instaladoras/, /ia-fabricacion-industrial/, /distribucion-industrial/, /gestion-documental-ia/, /automatizacion-procesos-ia/, /consultor-ia-murcia/ o la página local de la ciudad.",
    "La actualidad caduca: a los 30-60 días se actualiza o se enlaza desde un artículo evergreen.",
    "Cada dato con su fuente enlazada; versiones, precios y fechas exactos. Sin cifras de volumen de búsqueda inventadas.",
    "Imágenes WebP 1536×1024 con alt descriptivo y natural (sin meter keywords a la fuerza).",
    "Nada de contenido pobre: menos de 750 palabras solo si resuelve la duda por completo.",
    "Títulos con mayúsculas correctas: la primera letra siempre en mayúscula y los nombres propios bien escritos, aunque la keyword vaya en minúscula.",
    "No citar en los artículos cuántos artículos ha publicado el blog.",
  ],
  reglas_ia: [
    "Frases autónomas y citables con sujeto explícito («Un parte de trabajo digital permite…», no «Esto permite…»).",
    "Definición clara al empezar cada sección y datos numéricos con fuente atribuida.",
    "Tablas, listas y pasos numerados: es lo que más citan los buscadores con IA.",
    "Preguntas frecuentes con preguntas reales de usuarios.",
    "Aportar lo que un modelo no puede sacar de otra parte: el proceso real de un taller, el criterio para decidir, el ejemplo ficticio bien construido.",
    "Mismo nombre de marca y autor en todo el sitio; llms.txt al día e IndexNow al publicar.",
  ],
  voz: [
    "Español de España, tuteo, directo y con criterio propio.",
    "Primera persona del plural: somos un grupo de expertos en IA de Murcia. Nunca nombres propios del equipo: firma «Redacción Transforma con IA».",
    "Técnico sin ser críptico: se explica el porqué, no solo el cómo.",
    "Prohibidas las muletillas de IA («en el mundo actual», «sin duda», «revolucionario», «sumérgete»…).",
  ],
  no_publicar: [
    "Herramientas internas por marca (n8n, OpenAI, Claude, Gemini, Zapier…) ni Flownexion: se habla del proceso y del resultado.",
    "Nombres de persona, clientes, testimonios o cifras inventadas; los ejemplos van marcados como ficticios.",
    "Rondas de financiación, fichajes y cotizaciones sin impacto práctico.",
    "Rumores y filtraciones sin fuente primaria.",
    "Trucos de programación y novedades de modelos sin aplicación para una empresa industrial.",
    "Listas genéricas de «10 herramientas de IA» sin prueba real.",
    "Afirmar que el ERP cumple Verifactu (todavía no es obligatorio ni lo cumple).",
  ],
  proximos: [],
  notas: [],
};

/** Texto comparable: minúsculas, sin tildes ni signos (para cruzar títulos y keywords). */
export const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9.]+/g, " ").trim();

/** Versión compacta de la guía para meterla en los prompts de la IA. */
export function guiaATexto(g: Guia): string {
  const l = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n");
  return [
    `POSICIONAMIENTO: ${g.posicionamiento}`,
    `AUDIENCIAS:\n${g.audiencias.map((a) => `- ${a.nombre} (${a.peso}): ${a.quien} Busca: ${a.que_busca}`).join("\n")}`,
    `PILARES (clusters):\n${g.pilares.map((p) => `- ${p.nombre} [${p.categoria}]: ${p.descripcion} Keywords: ${p.keywords.join(", ")}${p.destinos?.length ? ` Destinos: ${p.destinos.join(" ")}` : ""}`).join("\n")}`,
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

/**
 * Caja «Sobre el autor» + llamada a la acción del final de cada artículo.
 * Sin <strong>: el CSS personalizado del tema fuerza `strong { color:#000 !important }`
 * y sobre el fondo oscuro no se leía. Los colores viven en wordpress/estilo-editorial.php.
 */
export function cajaAutor(cta = ""): string {
  // el CTA de algunos tipos acaba en «Escríbenos.» y se duplicaba con la frase del correo
  const extra = cta.replace(/\s*Escr[ií]benos\.?\s*$/i, "").trim().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return '<aside class="tca-autor">'
    + '<p class="tca-autor__etiqueta">Quién escribe</p>'
    + '<p class="tca-autor__bio">Transforma con IA es un equipo de consultores y desarrolladores de Murcia dedicado a la inteligencia artificial y la automatización. Seguimos la actualidad cada mañana y montamos agentes, automatizaciones y herramientas con IA para empresas de toda España.</p>'
    + '<p class="tca-autor__titulo">¿Quieres aplicarlo en tu empresa?</p>'
    + '<p class="tca-autor__cta">' + (extra ? extra + ' ' : '') + 'Escríbenos a <a href="mailto:info@transformaconia.com">info@transformaconia.com</a> y te respondemos en menos de 24 horas.</p>'
    + '</aside>';
}

/** Sustituye la caja de autor (formato viejo o nuevo) por la actual, o la añade si falta. */
export function ponerCajaAutor(html: string, cta = ""): string {
  const re = /<aside class="tca-autor"[\s\S]*?<\/aside>/i;
  const vieja = html.match(re)?.[0];
  if (!vieja) return html;
  if (!cta) { // conserva el CTA propio del tipo de artículo que ya tenía
    const m = vieja.match(/¿Quieres aplicarlo en tu empresa\?\s*(?:<\/strong>|<\/p>\s*<p[^>]*>)([\s\S]*?)(?:Escríbenos a|Cuéntanos tu caso en)/i);
    cta = (m?.[1] ?? "").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
  }
  return html.replace(re, cajaAutor(cta));
}
