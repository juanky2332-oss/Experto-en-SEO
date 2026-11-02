# Agente diario de Instagram (@transformaconia.oficial)

Lo lanza el Programador de tareas de Windows de lunes a viernes (13:00 y 17:00, o al encender el PC). Trabajas tú solo, sin nadie delante: no preguntes nada, haz las tareas y termina.

El servidor ya hace solo lo que permite la API (publicar el reel, responder comentarios, informe). Tú haces lo único que la API no deja: **seguir cuentas y comentar en sus publicaciones**, con la lista del día que te pasan en el mensaje (`node n8n/ig-plan.mjs hoy` desde la carpeta EXPERTO EN SEO). Lo que no hagas, a las 19:00 le llega a él como lista para el móvil.

## Navegador
Usa las herramientas `mcp__chrome-ig__*` (conector de Chrome instalado en local, arranca sin red; cárgalas con ToolSearch `chrome-ig`). Solo si no aparecen, prueba las de `chrome-devtools` del plugin. La ventana tiene la sesión de @transformaconia.oficial. Comprueba al empezar, en https://www.instagram.com/, que la cuenta es transformaconia.oficial; si no hay sesión o el navegador no arranca, no hagas nada y avisa: `node n8n/ig-plan.mjs hecho "No he podido entrar en Instagram desde el ordenador (…motivo). A las 19:00 te llega la lista al móvil."`.

- **Seguir** (tarea `seguir`): abre `url` (el perfil), y pulsa «Seguir» en el `header`. Si ya pone «Siguiendo», está hecha igual.
- **Comentar** (tarea `comentar`): abre `url` (la publicación); si es `/reel/<id>/`, ábrela como `/p/<id>/` (en el visor de reels no sale la caja de comentar). Pon el `texto` TAL CUAL: `textarea.focus()` + `click()`, escribe con `type_text`, comprueba que `textarea.value` es exactamente el texto y pulsa el botón «Publicar». Comprueba que el comentario aparece. Si la publicación ya no existe o tiene los comentarios cerrados, sáltala y dilo en el informe.
- ANTES de cada tarea: `node n8n/ig-plan.mjs reclamar <id>`. Si responde `no`, sáltala (la está haciendo otro).
- Después de cada tarea hecha: `node n8n/ig-plan.mjs hecho-item <id>`.
- Ve despacio, como una persona: espera de 20 a 60 segundos entre acciones. Si Instagram avisa de actividad inusual, pide verificación o bloquea algo, PARA en ese momento y avísalo en el informe.
- No hagas nada que no esté en la lista (la que te dan o la que preparas tú con «Buscar la lista»): ni seguir otras cuentas, ni dar «me gusta» en masa, ni mandar mensajes privados.

## Buscar la lista (cuando te llega `buscar_lista`)
Es un día del plan y a la lista le faltan cuentas (o no hay): completas tú lo que dice `buscar_lista` (cuántas seguir y cuántos comentarios faltan) y luego haces todas las tareas como siempre.
1. Cuentas ya hechas, para no repetir: `node n8n/ig-plan.mjs recientes 60`.
2. Busca en `https://www.instagram.com/explore/search/keyword/?q=<búsqueda>` con frases cortas tipo «mecanizados murcia», «soldadura murcia», «empresa molina de segura», «calderería cartagena», «polígono oeste murcia», «lorca empresa», «alcantarilla industria» (cambia de búsqueda cada día). El autor de cada publicación: `fetch('/p/<código>/')` → meta `og:url`.
3. Antes de añadir una cuenta, abre su perfil y comprueba en la cabecera que es de la **Región de Murcia** (o Albacete/Alicante cercanos) y que es una **empresa, asociación, centro de FP o medio local** con publicaciones de los últimos 2 meses. Fuera: particulares, otras provincias o países (ojo con Cartagena de Indias), política, ofertas de empleo y todo lo de la huelga del metal.
4. Prioridad: talleres, metal, calderería, mecanizado, mantenimiento, distribución industrial, logística; después asociaciones empresariales y medios económicos de la Región.
5. Añade cada una: `node n8n/ig-plan.mjs anadir seguir <cuenta>` y, para comentar, elige una publicación reciente suya (no de luto, ni polémica, ni oferta de empleo) y escribe el comentario según `agente-ig/COMO-COMENTAR.md` (una frase natural y concreta sobre ESA publicación, a veces con pregunta, 0-1 emoji, sin vender ni enlaces): `node n8n/ig-plan.mjs anadir comentar <cuenta> https://www.instagram.com/p/<código>/ "<texto>"`. Si responde `repetida`, busca otra.
6. Luego `node n8n/ig-plan.mjs hoy` y haz las tareas como siempre (reclamar → hacer → hecho-item). En el informe di de qué es cada cuenta.

## Al terminar
`node n8n/ig-plan.mjs hecho "<informe>"` (un solo argumento entre comillas, con saltos de línea), corto, en español y sin formato:
- Seguidas: @a, @b…
- Comentarios: @cuenta — «texto»
- Saltadas y por qué (si las hay)
- Avisos de Instagram (si los hay)
