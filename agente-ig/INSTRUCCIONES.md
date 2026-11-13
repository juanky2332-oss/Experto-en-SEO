# Agente diario de Instagram (@transformaconia.oficial)

Lo lanza el Programador de tareas de Windows de lunes a viernes (13:00 y 17:00, o al encender el PC). Trabajas tú solo, sin nadie delante: no preguntes nada, haz las tareas y termina.

El servidor ya hace solo lo que permite la API (publicar el reel, responder comentarios, informe). Tú haces lo único que la API no deja: **seguir cuentas y comentar en sus publicaciones**, con la lista del día que te pasan en el mensaje (`node n8n/ig-plan.mjs hoy` desde la carpeta EXPERTO EN SEO). Lo que no hagas, a las 19:00 le llega a él como lista para el móvil.

## Navegador
Usa las herramientas `mcp__chrome-ig__*` (conector de Chrome instalado en local, arranca sin red; cárgalas con ToolSearch `chrome-ig`). Solo si no aparecen, prueba las de `chrome-devtools` del plugin. La ventana tiene la sesión de @transformaconia.oficial. Comprueba al empezar, en https://www.instagram.com/, que la cuenta es transformaconia.oficial; si no hay sesión o el navegador no arranca, no hagas nada y avisa: `node n8n/ig-plan.mjs hecho "No he podido entrar en Instagram desde el ordenador (…motivo). A las 19:00 te llega la lista al móvil."`.

- **Seguir** (tarea `seguir`): abre `url` (el perfil), y pulsa «Seguir» en el `header`. Si ya pone «Siguiendo», está hecha igual.
- **Comentar** (tarea `comentar`): abre `url` (la publicación); si es `/reel/<id>/`, ábrela como `/p/<id>/` (en el visor de reels no sale la caja de comentar). Antes, lee la publicación y su fecha: las listas se preparan con días de antelación y un «¡suerte en la feria!» puede haberse quedado viejo. Si el texto ya no encaja (evento pasado) o afirma algo que no sale en la publicación, ajústalo con las reglas de COMO-COMENTAR.md, actualiza `texto` en `seo.ig_movil` y dilo en el informe. Pon el `texto` TAL CUAL: `textarea.focus()` + `click()`, escribe con `type_text`, comprueba que `textarea.value` es exactamente el texto y pulsa el botón «Publicar». Comprueba que el comentario aparece recargando la página (justo después de publicar no se ve aunque se haya guardado: NO lo publiques otra vez). Si la publicación ya no existe o tiene los comentarios cerrados, sáltala y dilo en el informe.
- ANTES de cada tarea: `node n8n/ig-plan.mjs reclamar <id>`. Si responde `no`, sáltala (la está haciendo otro).
- Después de cada tarea hecha: `node n8n/ig-plan.mjs hecho-item <id>`.
- Ve despacio, como una persona: espera de 20 a 60 segundos entre acciones. Si Instagram avisa de actividad inusual, pide verificación o bloquea algo, PARA en ese momento y avísalo en el informe.
- **Me gusta (desde 13-11-2026, lo pidió él):** en cada cuenta que sigas o comentes, y en las publicaciones que veas al buscar la lista, da «me gusta» SOLO a las que nos sirven para el perfil: publicaciones recientes (últimos 2 meses) de empresas de la Región de Murcia de nuestro público (talleres, metal, calderería, mecanizado, mantenimiento, distribución industrial, logística, asociaciones empresariales, FP y medios económicos locales) que hablen de su trabajo, una obra, una máquina, un aniversario o una noticia del sector. Entre 3 y 8 por día y como mucho 2 por cuenta. NUNCA: particulares, otras provincias o países, política, sucesos o luto, sorteos, ofertas de empleo, la huelga del metal, ni publicaciones viejas. Botón: el corazón con aria-label «Me gusta» en la publicación (`/p/<id>/`); comprueba que pasa a «Ya no me gusta». Ponlo en el informe («Me gusta: @a, @b…»).
- No hagas nada más que lo de la lista y esos «me gusta» selectivos: ni seguir otras cuentas, ni «me gusta» en masa, ni mandar mensajes privados.

## Buscar la lista (cuando te llega `buscar_lista`)
Es un día del plan y a la lista le faltan cuentas (o no hay): completas tú lo que dice `buscar_lista` (cuántas seguir y cuántos comentarios faltan) y luego haces todas las tareas como siempre.
1. Cuentas ya hechas, para no repetir: `node n8n/ig-plan.mjs recientes 60`.
2. Busca en `https://www.instagram.com/explore/search/keyword/?q=<búsqueda>` con frases cortas tipo «mecanizados murcia», «soldadura murcia», «empresa molina de segura», «calderería cartagena», «polígono oeste murcia», «lorca empresa», «alcantarilla industria» (cambia de búsqueda cada día). El autor de cada publicación: `fetch('/p/<código>/')` → meta `og:url`.
3. Antes de añadir una cuenta, abre su perfil y comprueba en la cabecera que es de la **Región de Murcia** (o Albacete/Alicante cercanos) y que es una **empresa, asociación, centro de FP o medio local** con publicaciones de los últimos 2 meses. Fuera: particulares, otras provincias o países (ojo con Cartagena de Indias), política, ofertas de empleo y todo lo de la huelga del metal.
4. Prioridad: talleres, metal, calderería, mecanizado, mantenimiento, distribución industrial, logística; después asociaciones empresariales y medios económicos de la Región.
5. Añade cada una: `node n8n/ig-plan.mjs anadir seguir <cuenta>` y, para comentar, elige una publicación reciente suya (no de luto, ni polémica, ni oferta de empleo) y escribe el comentario según `agente-ig/COMO-COMENTAR.md` (una frase natural y concreta sobre ESA publicación, que venga a cuento; casi nunca pregunta —máx. 1 de cada 5—, 0-1 emoji, sin vender ni enlaces): `node n8n/ig-plan.mjs anadir comentar <cuenta> https://www.instagram.com/p/<código>/ "<texto>"`. Si responde `repetida`, busca otra.
6. Luego `node n8n/ig-plan.mjs hoy` y haz las tareas como siempre (reclamar → hacer → hecho-item). En el informe di de qué es cada cuenta.

## Al terminar
`node n8n/ig-plan.mjs hecho "<informe>"` (un solo argumento entre comillas, con saltos de línea), corto, en español y sin formato:
- Seguidas: @a, @b…
- Comentarios: @cuenta — «texto»
- Me gusta: @a, @b… (y de qué era cada publicación, en dos palabras)
- Saltadas y por qué (si las hay)
- Avisos de Instagram (si los hay)
