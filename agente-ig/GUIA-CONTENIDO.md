# Guía de contenido de Instagram · @transformaconia.oficial

Versión 1.3 · 19-11-2026 · acordada con Juan Carlos tras el estudio de la cuenta (1.1: historias estilo 3; 1.2: calendario fijo y noticia del día; 1.3: regla anti-bot a fuego).
**Está también en el Radar** (apartados Instagram y Empresas que seguimos, con las decisiones de la semana). **Cada vez que se cambie este fichero:** `node --env-file=.env.local n8n/ig-guia.mjs` para que el Radar tenga la versión nueva.
**La leen antes de trabajar:** Claude (al preparar publicaciones), el agente del ordenador (al seguir y comentar) y el sistema (control de calidad, avisos y resumen del domingo). Se revisa cada domingo con los datos: lo que cambie se apunta abajo, en «Cambios por los datos».

---

## 0. La idea que manda
- **El 98 % de quien nos ve NO nos sigue** (357 de 363 cuentas en 30 días). Nos ven porque **Instagram nos recomienda**, no por los seguidores ni por los hashtags.
- Instagram recomienda lo que **se ve entero, se guarda y se comparte**. Todo lo de esta guía va a eso.
- Objetivo de la cuenta: que **empresas e industria de la Región de Murcia** nos vean, confíen y pidan el **diagnóstico gratis**. Nada de vender en frío.

## 1. Qué publicamos (y qué no)
| Sí | No |
|---|---|
| Demos NUESTRAS con Tuerqui (ERP, chatbot, Documentos, Presupuestos, web) | Vídeos de otra empresa como reel (Flownexion: 0-2 visualizaciones) |
| Un problema real del taller resuelto en pantalla | Presentaciones de la cuenta, «quiénes somos» |
| Trucos y noticias útiles para la industria, con qué hacer | Precios nuestros, comisiones, cupones |
| Casos reales (cuando los haya, con permiso) | Contenido genérico de IA que no toca a nuestro cliente |

**Flownexion y colaboradores:** por **historias con sticker de enlace**, por la web (/colaboraciones/) y por correo. **No como reel.** Si alguna vez va en el feed: con la etiqueta oficial **«Colaboración pagada» → @flownexion** (no basta con quitar #publi; la ley obliga a señalarlo).

## 2. El reel (cómo se hace)
1. **Gancho en los 2 primeros segundos**: la frase del problema en grande + Tuerqui reaccionando. Nada de logos ni intros.
2. **Duración 20-40 s.** Retención media actual: 7-13 s → el mensaje clave, antes del segundo 8.
3. **Texto en pantalla** con las palabras que busca la gente (Instagram las lee).
4. **Una sola idea por reel.** Cierre con una acción: «guárdalo», «mándaselo a quien…», «diagnóstico gratis en el perfil».
5. **Portada** con el problema en 4-6 palabras (es lo que se ve en el perfil).

## 3. El texto (pie)
- **Primera línea = el problema con palabras clave** («¿Facturas de proveedor tecleadas a mano?»). Es lo que Instagram usa para buscar y recomendar.
- 3-5 líneas cortas. Sin precios. La marca, como mucho una vez.
- **Una llamada a la acción** que se turna: guárdalo · mándaselo a… · cuéntanos en comentarios · diagnóstico gratis (enlace en el perfil).
- Enlaces: en el pie NO se pueden pulsar → «enlace en el perfil» o historia con sticker.

## 4. Hashtags (máximo 5, siempre con sentido)
- **1 grande del tema**: #inteligenciaartificial · #emprendedores · #pymes · #autonomos
- **2 medianos del tema concreto**: #chatbot · #facturas · #presupuestos · #disenoweb · #automatizacion · #gestionempresarial …
- **1-2 de nicho o local**: #caldereria · #talleresmecanicos · #mecanizado · **#regiondemurcia (siempre)**
- **Prohibidos**: los que no tienen que ver (#love, #fyp, #viral, #instagood…) y el de la marca (#tuerqui).
- Los hashtags ayudan a clasificar y a salir en búsquedas; **no dan alcance por sí solos**. Cada domingo se recalcula cuáles van mejor (`ig_aprendizaje`).

## 5. Cuándo
- **Reels: 21:00** (la noche da unas 6 veces más visualizaciones que el mediodía). Segundo intento 21:30.
- **Historias: 20:30**, justo antes, para calentar.
- **Blog: martes y viernes**; ese día, su historia «Nuevo en el blog».
- Ritmo: **2-3 reels por semana**. Mejor menos y buenos que muchos flojos.

## 6. Historias (duran 5 s: poco texto) · estilo 3, aprobado el 18-11-2026
- **Siempre claras** (fondo claro), centradas y con aire. Plantilla `/api/ig/historia` con `v: 3`. La marca solo en el logo de arriba. Sin precios.
- **Título = una pregunta o una orden que se entiende a la primera** y que toca el día a día: «¿Metes las facturas a mano?», «Cobra antes de que se te olvide». Nada de frases raras («tecleas…»). La parte clave, en color (`acento`).
- **Formatos**:
  - **Problema** (`problema`): pregunta + tarjeta **antes / ahora** + «Diagnóstico gratis · enlace en el perfil».
  - **Truco del día** (`truco`): 2 pasos que se pueden hacer hoy mismo, sin nosotros.
  - **IA que ya puedes usar** (`ia`): 2 pasos con herramientas que ya existen (grabar, ChatGPT…).
  - **Noticia útil** (`noticia`): solo noticias REALES con fuente y fecha, y qué hacer (2 pasos). Nada de resúmenes genéricos de «lo que se mueve en IA».
  - **Nuevo en el blog** y **aviso del reel** (salen solos, mismo estilo).
- **Tuerqui habla en un bocadillo** (`dice`): gracioso pero profesional y lógico, una o dos frases («Tú haz la foto y sigue con tu café. Del resto me encargo yo.», «Y si quieres, contesto yo por ti… ¡aunque estés durmiendo!»). La pose, a juego con el mensaje.
- **Cero fallos de texto**: ningún signo ni palabra suelta en un renglón (la plantilla reparte el título sola, pero revisa la imagen antes de meterla en el banco).
- **Calendario fijo** (L-V, 20:30, 2 al día + el aviso del reel): cada historia lleva su fecha (`ig_cola.fecha`) y su tema va con lo que sale ese día (reel o blog). Si una no sale su día, **no empuja a las demás**: se recoloca sola en el primer hueco libre. Modelo para ampliarlo: `n8n/ig-historias-calendario-2026-11.mjs`.
- **Siempre 2 semanas por delante**: si el calendario se acaba en menos de 14 días, llega aviso (lunes a las 13:00 y en el programa del domingo) → «prepara historias para Instagram» y se amplía dos semanas más con temas nuevos (sin repetir).
- **Noticia del día** (automática): el radar busca noticias cada mañana a las 8 (Región de Murcia, ayudas, industria, automatización, factura electrónica, IA útil). A las 13:00 se elige, si la hay, UNA real y útil para una pyme de aquí; se prepara con su fuente (el medio del enlace) y 2 pasos que se pueden hacer hoy, y llega por Telegram con botón «Quitar». Sale a las 20:30 **como extra** (no quita ninguna programada). Si no hay nada que valga, no sale nada. Una noticia que no sale su día se descarta (una noticia vieja no vale). Prueba sin guardar: `/api/cron/instagram?fase=noticia&prueba=1`.

## 7. Actividad diaria (lo hace el agente, L-V)
- ⛔ **REGLA A FUEGO (19-11-2026): que Instagram nunca nos tome por un bot.** Nada de probar cosas en la cuenta; solo lo que dice `INSTRUCCIONES.md`. Una acción cada 20-60 s, de una en una, nada en ráfaga; máximo 3-4 búsquedas al día; los 2 fragmentos de lectura, una vez al día. **Ante cualquier 429 o aviso: se para el día entero** y se avisa. Mejor hacer menos que arriesgar la cuenta. Volumen: 12/6 hasta el 29-11, 18/8 desde el 30-11 y 25/10 desde el 7-12, solo si no hay avisos.
- **Primero 8 empresas de la Región** (industria, talleres, metal, instaladores, asociaciones) y **después 4 tiendas del Radar**.
- **Comentar a las que sigamos** cuando tengan una publicación reciente que dé pie a un comentario de verdad (provisional: con tan pocos datos aún no se ve si comentar trae más seguidores que solo seguir; lo dirá el resumen del domingo cuando haya 10 o más casos de cada).
- «Me gusta» selectivos (10-20 al día, máx. 3 por cuenta). Todo queda en el Radar.
- Al terminar: quién nos sigue y quién nos da me gusta → Radar.

## 8. Cómo aprendemos (el ciclo)
1. **Cada noche (23:30)**: se guardan los números de todo (también las historias, que caducan en 24 h) y lo que recibimos (seguidores, me gusta, comentarios).
2. **Sobre la marcha**: si un reel va **muy bien** (el doble de lo normal) o **no arranca** (menos de la cuarta parte), llega un aviso por Telegram con qué hacer.
3. **Cada domingo 18:00**: resumen de la semana → quién nos sigue y por qué, qué publicación funcionó, si funcionó lo decidido la semana anterior, **decisiones** para la semana y **3 ideas de contenido** basadas en lo que ha funcionado.
4. Las decisiones las aplica el agente (`ig-plan decisiones`) y Claude al preparar publicaciones. Los cambios que se consoliden se apuntan aquí abajo.

## 9. Promoción pagada
- **Todavía no** (decidido el 18-11-2026). Primero que lo orgánico llegue de forma constante.
- Cuando toque: prueba pequeña (~15 €, 3-4 días) con un **reel NUESTRO** que ya haya funcionado, público **Región de Murcia, 28-60 años, empresas/autónomos/industria**, objetivo **visitas al perfil**. Seguir solo si cada visita cuesta menos de 0,30 € y llega algún seguidor o mensaje.
- Nunca promocionar contenido de Flownexion.

## 10. Lo que nunca
Precios nuestros · comisiones · cupones · hashtags sin sentido · reels de vídeos ajenos · publicar algo de Flownexion sin su OK · inventar datos o casos.

---

## Cambios por los datos (lo añade el resumen del domingo)
- 18-11-2026 · Punto de partida: 98 % del alcance de no seguidores; reel nocturno 114 visualizaciones frente a 4-39 a mediodía; Flownexion en reel 0-2.
