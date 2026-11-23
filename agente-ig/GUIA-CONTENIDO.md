# Guía de contenido de Instagram · @transformaconia.oficial

Versión 2.0 · 19-11-2026 · acordada con Juan Carlos tras el estudio de la cuenta (1.1: historias estilo 3; 1.2: calendario fijo y noticia del día; 1.3: regla anti-bot a fuego; **2.0: de «que nos vean» a «que nos llamen»** — embudo, mensajes, comentarios a mano y prueba de pago).
**Está también en el Radar** (apartados Instagram y Empresas que seguimos, con las decisiones de la semana). **Cada vez que se cambie este fichero:** `node --env-file=.env.local n8n/ig-guia.mjs` para que el Radar tenga la versión nueva.
**La leen antes de trabajar:** Claude (al preparar publicaciones), el agente del ordenador (al seguir y comentar) y el sistema (control de calidad, avisos y resumen del domingo). Se revisa cada domingo con los datos: lo que cambie se apunta abajo, en «Cambios por los datos».

---

## 0. La idea que manda
- **El 98 % de quien nos ve NO nos sigue** (357 de 363 cuentas en 30 días). Nos ven porque **Instagram nos recomienda**, no por los seguidores ni por los hashtags.
- Instagram recomienda lo que **se ve entero, se guarda y se comparte**. Todo lo de esta guía va a eso.
- Objetivo de la cuenta: que **empresas e industria de la Región de Murcia** nos vean, confíen y pidan el **diagnóstico gratis**. Nada de vender en frío.
- **Lo que de verdad cuenta (desde 19-11-2026): conversaciones y citas**, no los «me gusta». Punto de partida (30 días): 471 visualizaciones, 59 visitas a la web desde Instagram, 4 llegaron a /contacto/ y **0 contactos ni citas**. Todo lo de esta guía empuja a la sección 11 («Del interés a la cita»).
- **Sin cara (decidido el 19-11-2026):** Juan Carlos no sale en nada. La cara de la marca es **Tuerqui**; la confianza se gana con demos reales, trucos útiles, cercanía en los mensajes y, cuando los haya, casos con permiso.

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
4. **Una sola idea por reel.** Cierre directo en pantalla (último segundo, Tuerqui señalando): «Escríbenos «PALABRA» por mensaje» o «Diagnóstico gratis 30 min · enlace en el perfil».
5. **Portada** con el problema en 4-6 palabras (es lo que se ve en el perfil).

## 3. El texto (pie)
- **Primera línea = el problema con palabras clave** («¿Facturas de proveedor tecleadas a mano?»). Es lo que Instagram usa para buscar y recomendar.
- 3-5 líneas cortas. Sin precios. La marca, como mucho una vez.
- **Arranque de los reels (desde 22-11-2026)**: todos empiezan con un «Oye, tú…». Tuerqui saluda, la etiqueta va arriba y luego el gancho del vídeo. Lo normal es «Oye, tú: esto te interesa»; «Oye, tú, el del taller: esto va por ti» solo de vez en cuando, en vídeos de taller. Voz de audio de WhatsApp entre colegas (natural, rápida, nada de locutor ni de «¡Ojo!»), «inteligencia artificial» dicho entero y Tuerqui con movimiento suave, casi quieto en el cierre.
- **Cierre SIEMPRE directo (desde 19-11-2026)**, justo antes de los hashtags: «👉 ¿Lo quieres en tu empresa? Escríbenos «PALABRA» por mensaje o reserva tu diagnóstico gratis de 30 min (enlace en el perfil).» La **PALABRA** es distinta en cada pieza (WEB, FACTURAS, PIEZA, MES, PLANO, ALBARANES…): así se sabe qué publicación trae cada conversación. Una pregunta para comentar puede ir antes (da conversación), pero el cierre directo no se quita. Modelo: `n8n/ig-cta-directo-2026-11.mjs`.
- Enlaces: en el pie NO se pueden pulsar → «enlace en el perfil» o historia con sticker.
- **La bio** (la cambia él a mano; la API no deja): nombre «Transforma con IA | Automatización industria»; texto (máx. 150 caracteres; esta tiene 142, en 4 líneas): «🔩 Quitamos papeles a talleres e industria: facturas, presupuestos y albaranes / 🤖 Con Tuerqui / 📍 Murcia · toda España / 👇 Diagnóstico gratis 30 min». Enlace principal: `https://transformaconia.com/diagnostico/?utm_source=instagram&utm_medium=bio` (título «Diagnóstico gratis 30 min»); segundo enlace: `/enlaces/`.

## 4. Hashtags (máximo 5, siempre con sentido)
- **1 grande del tema**: #inteligenciaartificial · #emprendedores · #pymes · #autonomos
- **2 medianos del tema concreto**: #chatbot · #facturas · #presupuestos · #disenoweb · #automatizacion · #gestionempresarial …
- **1-2 de nicho o local**: #caldereria · #talleresmecanicos · #mecanizado · **#regiondemurcia (siempre)**
- **Prohibidos**: los que no tienen que ver (#love, #fyp, #viral, #instagood…) y el de la marca (#tuerqui).
- Los hashtags ayudan a clasificar y a salir en búsquedas; **no dan alcance por sí solos**. Cada domingo se recalcula cuáles van mejor (`ig_aprendizaje`).

## 5. Cuándo
- **Reels: 21:00** (la noche da unas 6 veces más visualizaciones que el mediodía). Segundo intento 21:30.
- **Sábado noche, 22:30 (desde 22-11-2026)**: el mejor reel hasta ahora («Del plano a la factura», 115 vistas) salió un sábado a las 22:47. Un reel cada sábado a las 22:30 (reintento 23:00), con su historia de aviso. Semanas de 3 piezas: 2 entre semana + 1 el sábado. Comparar cada sábado con los de entre semana en el resumen del domingo; si no rinde más tras 3 sábados, se vuelve a entre semana.
- **Historias: 20:30**, justo antes, para calentar.
- **Blog: martes y viernes**; ese día, su historia «Nuevo en el blog».
- Ritmo: **2-3 reels por semana, tirando a 3** (los reels son lo único que llega a gente nueva; las historias solo las ven los seguidores). Mejor menos y buenos que muchos flojos.

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
- **Grupos del día (desde 20-11-2026):** a quién seguir ya no se busca cada día en Instagram. `n8n/ig-grupos.mjs` estudia **todas** las empresas del Radar con Instagram fiable y las puntúa sobre 100: cercanía (Murcia 40 · Alicante, Albacete, Almería 28 · Valencia 18), sector (industria y metal primero, luego ferreterías y suministros), tamaño que sigue de vuelta (150-3.000 seguidores), negocio real (reseñas) e Instagram verificado. Las grandes cadenas restan. Se reparten en grupos por día laborable (2/3 de la Región y alrededores, 1/3 del resto) y se rehacen solos cada lunes. **Todo queda en el Radar:** al entrar en un grupo, su puntuación y el porqué; al seguirla, «Seguida»; si el agente la salta al ver su perfil (persona, inactiva, de fuera, cadena…), queda **tachada** («No seguir») con el motivo.
- **Cantera de la Región** (`n8n/ig-cantera.mjs`): empresas nuevas de nuestros oficios (calderería, mecanizado, mantenimiento, maquinaria, suministros industriales, instaladores…) buscadas en la web, sin tocar Instagram. Entran en el Radar como «Cantera Región de Murcia», que les busca el Instagram en su propia web, y al lunes siguiente ya salen en los grupos. Repetir cuando la Región se quede corta (lo dice el reparto: «Quedan sin grupo»).
- **Primero 8 empresas de la Región** (industria, talleres, metal, instaladores, asociaciones) y **después 4 tiendas del Radar** (ya viene así en el grupo).
- **Comentarios de profesional (20-11-2026, tras comentar una oferta de empleo como si fuera un trabajo):** antes de escribir, **mirar la publicación** (captura) y decidir si es un trabajo real o un cartel; sobrios, objetivos y al grano, sin «brutal», «espectacular» ni «qué nivel». Todo en `COMO-COMENTAR.md`.
- **Comentar a las que sigamos** cuando tengan una publicación reciente que dé pie a un comentario de verdad. **Desde el 23-11-2026 los comentarios los publica el agente** (él: «con espacios de tiempo y con sentido»): solo en publicaciones que lo merezcan, 1 por cuenta y día, a ritmo de persona y releyendo el texto (sobrio, sin superlativos).
- «Me gusta» selectivos (10-20 al día, máx. 3 por cuenta). Todo queda en el Radar.
- Al terminar: quién nos sigue y quién nos da me gusta → Radar.

## 8. Cómo aprendemos (el ciclo)
1. **Cada noche (23:30)**: se guardan los números de todo (también las historias, que caducan en 24 h) y lo que recibimos (seguidores, me gusta, comentarios).
2. **Sobre la marcha**: si un reel va **muy bien** (el doble de lo normal) o **no arranca** (menos de la cuarta parte), llega un aviso por Telegram con qué hacer.
3. **Cada domingo 18:00**: resumen de la semana → quién nos sigue y por qué, qué publicación funcionó, si funcionó lo decidido la semana anterior, **decisiones** para la semana y **3 ideas de contenido** basadas en lo que ha funcionado.
4. Las decisiones las aplica el agente (`ig-plan decisiones`) y Claude al preparar publicaciones. Los cambios que se consoliden se apuntan aquí abajo.

## 9. Promoción pagada · prueba de 15 € (estudiada el 19-11-2026; la lanza él desde la app)
- **Cuándo:** lunes 23-11 a miércoles 25-11 (3 días × 5 €), cuando la bio ya apunte a `/diagnostico/`. Días laborables: el dueño de un taller mira el móvil a mediodía y por la noche.
- **Qué reel:** «Del plano a la factura, sin papeles» (14-11, `instagram.com/reel/DfvNMbnDMB0/`). Es el único con una muestra que vale: **115 visualizaciones, 106 cuentas, 7 s de media** (el siguiente, 40). Enseña TODO lo que hacemos en un solo flujo, que es justo lo que queremos que vea un taller. («¿Sabes cuánto te deben tus clientes?» retiene más, 11,9 s, pero solo lo vieron 6 cuentas: es ruido. Será la segunda prueba si esta funciona.)
- **Cómo:** en el reel → «Promocionar» → objetivo **«Más visitas al perfil»** → público **«Crear el tuyo»**: Región de Murcia (y si deja, + Albacete y Alicante), **30-60 años**, intereses: pequeñas empresas, emprendimiento, fabricación, metalurgia, soldadura, mecanizado CNC, construcción, logística. **No** usar el público automático (Advantage+), que lo enseña a cualquiera.
- **Cuánto ha funcionado (decidido ANTES de gastar):**
  - ✅ **Sigue** (otra prueba de 15-30 € con el reel de cobros): coste por visita al perfil **< 0,30 €** y **al menos 1** de: mensaje de una empresa, reserva en `/diagnostico/` o 3+ seguidores nuevos que sean empresas del público.
  - ❌ **Para** (no se gasta más): visita > 0,50 € o ninguna empresa del público entre los que llegan. Entonces se cambia el gancho, no el presupuesto.
- **Cómo se mide:** Meta da el coste por visita; nosotros, las citas y contactos que entran con procedencia Instagram (`seo.reservas` / `seo.contactos`), los seguidores nuevos y si son empresas (Radar) y las conversaciones con palabra clave. El domingo 29-11 va al resumen con la decisión.
- Nunca promocionar contenido de Flownexion.

## 10. Lo que nunca
Precios nuestros · comisiones · cupones · hashtags sin sentido · reels de vídeos ajenos · publicar algo de Flownexion sin su OK · inventar datos o casos · su cara · mensajes privados enviados por un programa · **nada presencial** (ni visitas, ni «vamos a tu empresa»: todo por videollamada).

## 11. Del interés a la cita (el embudo, desde 19-11-2026)
1. **Ven el reel** → cierre con PALABRA o «diagnóstico gratis 30 min».
2. **Perfil** → bio directa → enlace a **`/diagnostico/`**: elige día y hora en dos toques, **solo por videollamada** (desde el 19-11-2026, él: «lo presencial no interesa para empezar; no digas nada presencial»; quitado de toda la web, la reserva, las páginas de ciudades y el blog). Antes iba a un formulario donde había que escribir su caso, y nadie lo hacía. El resto de la web también lleva ahí (menú, botones, blog, botón fijo del móvil).
3. **Conversación** («Para escribir hoy»): cada día laborable a las 19:00 le llegan por Telegram **hasta 3 empresas que ya se han interesado** (nos siguen de vuelta o nos han dado varios «me gusta») con un mensaje sugerido que **abre conversación sin vender**. Lo manda **él** desde el móvil y pulsa «✅ Escrito» o «Saltar»; queda apuntado y no se repite (`src/lib/ig-conversaciones.ts`).
4. **Si alguien escribe la PALABRA o contesta:** responder ese mismo día, preguntar qué tarea les quita más tiempo y proponer los 30 minutos con el enlace a `/diagnostico/`.
5. **Se mide cada semana** (resumen del domingo): conversaciones abiertas, respuestas, citas y contactos con procedencia Instagram. Esto es lo que dice si vamos bien, no los «me gusta».

---

## Cambios por los datos (lo añade el resumen del domingo)
- 18-11-2026 · Punto de partida: 98 % del alcance de no seguidores; reel nocturno 114 visualizaciones frente a 4-39 a mediodía; Flownexion en reel 0-2.
