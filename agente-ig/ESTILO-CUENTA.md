# Estilo de la cuenta de Instagram (@transformaconia.oficial)

Criterio del dueño (27-10-2026): «antes de subir nada, piénsalo bien; que no sea repetitivo, que el conjunto de la cuenta quede bien y se vea todo más pro, para que la gente nos quiera contactar; ir mejorando siempre».
Esta guía manda sobre todo lo que se prepare para Instagram (reels, carruseles, historias y textos). Comentarios en otras cuentas: `COMO-COMENTAR.md`.

## De dónde sale
- Diagnóstico del perfil el 27-10: 11 publicaciones iguales (texto blanco sobre morado oscuro), sin pantallas de la app, sin historias ni destacadas, y todos los textos con la misma fórmula (pregunta + lista con 👇 + «Pide tu diagnóstico gratis»).
- Referentes del sector: STEL Order (software de gestión para pymes y servicios técnicos en España, 7.800 seguidores). Usa destacadas como menú (Q&A, Clientes, Blog…), móvil con la app, comparativas («Excel vs programa de facturación»), frases gancho y personas reales, con un acento de color propio.
- Guías de Instagram para empresas B2B: un tema visual coherente, destacadas ordenadas, 3-5 hashtags específicos y palabras clave en el texto (Instagram las usa para recomendar).

## Ritmo
- Cada día del ritmo (cada 3 días, `seo.settings.ritmo`) salen 1 publicación del feed y 2-3 historias. Las respuestas a comentarios salen cada día.
- Feed: alternar **reel** y **carrusel**. Nunca dos piezas seguidas con el mismo tema (cobros, presupuestos, gastos, asistente, diagnóstico…). Antes de meter algo en la cola, mirar lo publicado: si ya hay un reel de un tema, el siguiente de ese tema va en otro formato y con otro ángulo.
- Historias (13:10 del día que toca, `historias()`): el aviso de la publicación nueva + 2 del banco (`n8n/ig-historias.mjs`). Una «pregunta» va siempre seguida de su «respuesta»; las que fallan se reintentan el siguiente día que toque.

## Formato de vídeo: Flash v2 (desde el 08-11-2026, Instagram y TikTok)
Dicho por el dueño el 07-11: la voz se nota de IA y hay que entrar por los ojos. El 08-11: «más directos, que la voz no parezca robótica, profesional para la venta; nada de “datos de ejemplo”: son vídeos para captar clientes».
- **Locución de una sola toma** (`FABRICA DE VIDEOS/scripts/flash-voz.mjs`): todo el guion en una llamada (gpt-4o-mini-tts-2025-12-15, voz cedar, locutor de Madrid), pausas recortadas, escenas cortadas donde empieza cada frase (marcas por palabra con whisper) y base musical propia que baja sola cuando habla. Nunca frase a frase: eso es lo que sonaba a robot.
- 16-20 s. El primer fotograma es la portada: gancho ya montado, a pantalla completa y color fuerte.
- Termina con la escena de cierre y la llamada «Diagnóstico gratis · transformaconia.com» (en voz y en pantalla).
- Nada de «datos de ejemplo» ni «cifra de ejemplo» en pantalla ni en los textos. Las pantallas siguen siendo ficticias («Empresa X»), sin decirlo.
- Formatos: test de sí o no, chat, avisos que se amontonan, contador, móvil con la app. Variar: nunca el mismo dos veces seguidas.
- Zona segura: nada importante por debajo de y=1480 ni a la derecha de x=930.
- Guion en `videos/flash/<id>.json` (cada escena con "voz"; " | " marca cuándo entra el siguiente elemento) → `node --env-file=.env.local scripts/flash-voz.mjs videos/flash/<id>.json` → render `Flash` con `--props=public/flash/<id>.props.json` y `--public-dir` a una copia local.
- TikTok: activar «Contenido generado por IA». La API de Instagram no pone la etiqueta.

## Aspecto
- Dos temas, que se **alternan** en la cuadrícula para que tenga ritmo: **oscuro** (`#0b0614` con brillos morados) y **claro** (`#f7f3fd`, tinta `#1b1029`, círculos suaves). Mismo degradado de acento (`#e05cff → #a11cf0 → #5b3cff`), letra Poppins y símbolo de la marca.
- Portadas de reel: `Portada` de la fábrica con `tema: "claro"` u `"oscuro"`. Carruseles: `"tema"` en el JSON (`scripts/carrusel.mjs`). Historias: la plantilla decide el tema (consejo, respuesta y app en claro; dato y mito en oscuro; pregunta con el degradado).
- Enseñar el producto: al menos 1 de cada 3 piezas lleva pantallas reales de la app en el móvil (siempre con datos ficticios: «Empresa X», «Cliente Demo»).
- Formatos de carrusel: portada · comparativa (antes / con IndunexIA Gestión) · pasos · lista · pantalla · precio · cierre. Que el contenido llene la diapositiva (centrado, letra grande); nada de medias diapositivas vacías.
- Zona segura de historias: nada importante en los 250 px de arriba y de abajo.

## Textos
- Castellano de aquí, natural, cercano y profesional. Decir «empresas» (nada de términos de nicho repetidos).
- Ganchos que se turnan: afirmación rotunda · situación concreta del taller · «Ejemplo:» con números marcados como ejemplo · antes/después · pregunta (como mucho 1 de cada 3).
- Llamadas a la acción que se turnan (nunca la misma que en las 2 anteriores): diagnóstico gratis por escrito · «Guárdalo para cuando lo necesites» · «Cuéntanos en comentarios…» · «Mándaselo a quien lleva los papeles» · «Te lo enviamos por escrito: enlace en el perfil».
- 3-5 hashtags específicos al final y terminar con un espacio (si no, Instagram autocompleta el último).
- Nunca: «demo gratis», Flownexion sin #publi (ver «Reorganización 15-11-2026»), herramientas internas por su marca, «solo por escrito» o «sin llamadas», «para el metal», que cumplimos Verifactu, cifras, clientes o testimonios inventados.

## Control de calidad (automático, antes de subir NADA)
`src/lib/ig-calidad.ts`, llamado desde `subir()`:
1. Reglas fijas de arriba, comprobadas con código. Si no las cumple, **no se publica** y llega un 🛑 a Telegram.
2. Un editor compara el texto con las últimas 8 publicaciones del perfil y, si repite gancho, estructura, emojis o llamada a la acción, lo reescribe con los mismos datos. Las cifras tienen que salir idénticas o se queda el original.
- Ensayo sin publicar: `/revisar` en Telegram (la siguiente) o `/revisar <id>`.

## Destacadas (las crea él desde el móvil, una vez)
Cuando haya historias publicadas: «IndunexIA Gestión», «Consejos», «Diagnóstico», «Nosotros» y «Blog», con las portadas de `FABRICA DE VIDEOS/salida/instagram/destacadas/`. Instagram no deja crearlas por la API ni desde la web.

## Mejorar siempre
- Cada informe del día que toca trae números solo si se mueven. Una vez al mes (o al preparar la siguiente tanda), mirar qué formato y qué tema han tenido más alcance, guardados y visitas al perfil, y ajustar la mezcla de la siguiente tanda: más de lo que funciona y cambiar el ángulo de lo que no.
- Cada tanda nueva (reels, carruseles o historias) se revisa entera en miniatura antes de cargarla: que alterne claro/oscuro, que no repita temas seguidos y que se lea en el móvil.


## Normas desde el 27-10-2026 (pedido del dueño: «no seas cansino con la publicidad»)

- **Regla 2 de 3**: de cada tres publicaciones, dos aportan valor sin vender (consejos, errores típicos, comparativas, noticias explicadas, casos tipo de la industria de Murcia con datos ficticios) y como mucho una es de producto.
- Las de valor **no llevan «pide tu diagnóstico»**: terminan con una pregunta concreta para conversar o con «guárdalo para…». La llamada al diagnóstico vive en la bio y en /enlaces/.
- Nunca dos publicaciones de producto seguidas ni el mismo tema (cobros, calculadora, tickets…) a menos de 3 semanas.
- Producto = una app de la familia IndunexIA (Gestión, Presupuestos, Documentos), con su nombre completo.
- Voz de los vídeos: SIEMPRE «cedar» con las instrucciones de locutor de Madrid (como `videos/n1-tareas-taller.json`). La voz por defecto suena robótica: no usarla.
- Bio: presenta la cuenta entera (apps + trucos), no un solo producto. Enlace de la bio: transformaconia.com/enlaces/ (lo cambia el dueño desde el móvil).
- Historias de producto: como mucho una de cada cuatro.

## Estilo realista (desde el 29-10-2026)
La web pasó a un lenguaje realista (fotos de cine de taller, piezas y máquinas con luz cálida y acento violeta). El feed debe ir igual:
- Portadas de carrusel y de reel sobre **foto realista** (las de `demo.transformaconia.com/web/portada/` o generadas con el mismo estilo), con degradado oscuro abajo y el texto encima. Las tarjetas lisas moradas solo de forma ocasional (como mucho 1 de cada 3), para que la cuadrícula no sea un muro de tarjetas iguales.
- Modelo: carrusel `c-plano-factura` (6 diapositivas 1080×1350, generadas con `scratchpad/carrusel.cjs` de la sesión: foto + logo + kicker violeta + titular blanco + pie «Ejemplo ilustrativo»).
- Llamada a la acción: «diagnóstico gratis en el enlace del perfil». El enlace principal del perfil es la PORTADA con `?utm_source=instagram&utm_medium=bio`, no /enlaces/.

## Por qué bajó el alcance y qué repetimos (análisis del 3-11-2026, datos de la API)
- Alcance diario de la cuenta: 24-10 → 40 y 25-10 → 69 (los días con 3-4 reels publicados y la cuenta recién estrenada); después, 28 el día del reel del 27-10, 14 el del 30-10 y **1-4 los días sin reel**. El alcance sale casi entero de los reels del día: si no hay reel, no hay alcance.
- Retención: reels de 35-41 s vistos de media 4,3-7,4 s (12-19 %). Instagram los enseña a unas pocas cuentas de prueba y, si se van pronto, no sigue. El de 7,4 s (gancho directo «3 tareas que la IA le quita a tu taller») llegó al doble que el de 4,3 s.
- Carruseles, noticias e imágenes: 1-5 cuentas. Sirven para quien entra al perfil, no para llegar a gente nueva.
- Borrar y volver a subir publicaciones (se hizo varias veces el 25-27-10) no ayuda: mejor dejar lo publicado y mejorar lo siguiente.

**Reglas desde el 3-11-2026:**
- **Reels lunes, miércoles y viernes a las 13:00** (`seo.settings.ritmo.ig_dias`, `/ritmo reels l x v` en Telegram), sin depender del «cada 3 días». Los avisos a Telegram siguen al ritmo y solo si pasa algo.
- **15-22 s**, una idea por escena, gancho en la primera frase y **en pantalla desde el fotograma 0** (la plantilla Reel ya pone la primera escena sin animación de entrada). Sin escena final de logo: el corte seco hace que el vídeo vuelva a empezar. Guiones cortos en `FABRICA DE VIDEOS/scripts/cortos-noviembre.mjs`.
- Mirar cada semana `n8n/_ig-stats.mjs` (alcance, vistas y segundos medios por pieza) y repetir el formato del que mejor retenga.

## Llegar a más gente (desde el 2-11-2026, con los datos de la primera semana)
- **Reels primero.** Con una cuenta pequeña los reels llegan a 12-36 cuentas y los carruseles a 1-5 (casi solo a quien ya nos sigue). Mezcla: unos 3 reels por cada carrusel; el carrusel queda para quien entra al perfil y lo quiere guardar.
- **Hashtags: 5 y de nicho.** Uno o dos del oficio del cliente (#tallerindustrial, #metalmecanica, #caldereria, #mecanizado, #suministrosindustriales), uno del tema de la pieza (#presupuestos, #facturacion, #protecciondedatos…) y **#regiondemurcia** (no #murcia: lo llenan turismo y fiestas). Nada de #pymes, #empresas ni #fyp. Terminar en espacio.
- **Ubicación «Murcia, España»** en todo lo del feed: la pone sola el servidor (`IG_UBICACION` en `src/lib/redes.ts`).
- **Seguir y comentar todos los días del plan**: 5 cuentas nuevas de la Región + 3 comentarios. Si no hay lista preparada, el agente del ordenador la busca y la hace (INSTRUCCIONES.md → «Buscar la lista»). Comentar en otras cuentas el mismo día que sale nuestro reel hace que más gente pase por el perfil y lo vea.
- Las primeras palabras del texto cuentan para el buscador de Instagram: que digan de qué va (taller, presupuestos, pedidos…), no solo un emoji o un «¿Sabías que…?».

## Tuerqui, la mascota (desde el 11-11-2026)
- Tuerca de cromo con gorra azul de mecánico y ojos violeta. Poses fijas en `FABRICA DE VIDEOS/public/tuerqui/` (agobiado, piensa, senala, celebra, malabares, saluda), generadas con `scripts/tuerqui.mjs` a partir de `referencia.png` (gpt-image-1.5, fondo transparente). Servidas en demo.transformaconia.com/ig/tuerqui/.
- Reels Flash: primera escena SIEMPRE en tema oscuro con `tuerqui` (pose del problema) = portada uniforme en la cuadrícula; cierre centrado con Tuerqui GRANDE y entero (malabares, que se vean tuerca y herramientas) + botón + firma «Transforma con IA · transformaconia.com» una sola vez. Las escenas de dentro pueden ser de colores.
- Carruseles: `tuerqui` en la portada (abajo a la derecha) y en el cierre (saluda). Historias: pose automática por plantilla (`/api/ig/historia`).
- Hashtags en piezas con Tuerqui: oficio · problema · #regiondemurcia · tema · #tuerqui (5 como máximo).
- Profesional y cercano: nunca hace el payaso con temas serios (impagos, seguridad), nunca habla él en primera persona en los textos.

## Vídeos «Demo» de producto (13-11-2026)
- Formato `FABRICA DE VIDEOS/src/Demo.tsx` (composición «Demo»): móvil con la app REAL (capturas de erp-muestra a 1170 px con `ERP MUESTRA/scripts/capturas-movil.js`), zoom y toques donde importa, un título corto por escena, Tuerqui en 4-5 momentos y cierre con Tuerqui grande. Menos de 30 s.
- Voz: `scripts/demo-voz.mjs` con gpt-audio-1.5 (voz cedar), una toma, pausas recortadas y tempo 1.05: más humana y ágil que gpt-4o-mini-tts. Usarla en los vídeos nuevos.
- Primeros: `videos/demo/indunexia-30.json` (gestión de cabo a rabo, 24 s) y `videos/demo/planos-20.json` (presupuesto desde plano, 23 s), en cola el 25 y 27-11.

## Perfil limpio y TODO en formato Demo (14-11-2026, pedido del dueño)
Dijo: «los últimos vídeos me gustan mucho más que los primeros… tienen que ser así, incluso las publicaciones y las historias, así de animadas, de profesional, con la mascota; producto y servicio a la vez».
- **Se borraron 18 publicaciones** de estilo antiguo (portadas de logo, noticias del blog, carruseles claros). Quedaron los 3 reels con Tuerqui y entraron los Demo. Copia completa en `_backups/ig-2026-11-14-antes-limpieza/` (vídeo/imagen + texto); en la app siguen 30 días en «Eliminado recientemente».
- **Manda el formato Demo** para todo lo nuevo del feed: app real en el móvil + titular corto con una palabra en degradado + Tuerqui + cierre con Tuerqui grande y «Diagnóstico gratis». Gancho sin plano: `"cartas": [...]` (papeles que caen). Cierre de otro producto: `"marca": "Asistente *IA*"`.
- **Portadas**: composición `PortadaDemo` (titular a partir de y=320 y Tuerqui en el centro: la cuadrícula del perfil recorta la portada a 3:4, del y=240 al y=1680). Nunca la primera imagen del vídeo, que se corta arriba.
- **Cuadrícula oscura siempre**: nada de tema claro en el feed (la comparativa clara «Excel vs» se descartó).
- **Noticias del blog: SOLO historias**, nunca en el feed (llegaban a 0-3 cuentas y rompían la cuadrícula). Cambiado en `src/lib/redes.ts`.
- **Historias animadas**: el aviso de cada vídeo nuevo es un trozo del propio reel con el letrero «▶ Vídeo nuevo en el perfil» (`HistoriaDemo`, salida en `FABRICA DE VIDEOS/salida/instagram/historias-demo/`, servidas en demo.transformaconia.com/ig/historias/). Se enlaza poniendo `datos.historia_video` en el reel de la cola. El banco de historias también va en vídeo.
- **Destacadas**: portadas `DestacadaTuerqui` (Tuerqui en círculo oscuro) en demo.transformaconia.com/ig/destacadas-tuerqui/; las crea él desde la app.

## Qué es la cuenta y qué publicamos (15-11-2026, palabras del dueño)
«Una página de empresa que automatiza y hace consultoría a talleres e industria sobre todo, pero también a todos los sectores que se pueda, y que te va informando de apps nuevas que vea en el mercado, de sus apps y de todo lo que pueda dar valor al seguidor. No solo promocionar a saco.»
- **Mezcla fija: 2 de VALOR por 1 de PRODUCTO**, y nunca dos de producto seguidas. Valor = noticias útiles del sector sacadas de NUESTRO blog (citando la fuente y con fecha si hay plazos), **apps útiles** del mercado (qué hacen, en qué plan, que hay que revisarlas), y consejos de IA en la empresa. Producto = nuestras apps (IndunexIA…) y servicios (asistente, automatización, consultoría).
- Todo en formato Demo animado con Tuerqui: piezas de valor con escenas `portadilla` (etiqueta «Noticia · …», «App útil», «IA en tu empresa») + `puntos` + cierre `"marca": "Transforma con *IA*"` y «Enlace en el perfil». Guiones en `FABRICA DE VIDEOS/videos/valor/`, servidos en demo.transformaconia.com/ig/valor/.
- **Castellano de España**, se nota que somos de Murcia (sin forzar el murciano); jamás acento ni vocabulario latino (móvil, ordenador, vale…). La voz lo lleva en las instrucciones de `scripts/demo-voz.mjs`.
- En los textos, nombrar apps de terceros está bien en piezas de valor; NUNCA nuestras herramientas internas (n8n, OpenAI, Claude…), ni «ya funciona en…» (lo bloquea ig-calidad).
- Colaboradores (p. ej. Flownexion): desde el 15-11-2026 SÍ, con las reglas de «Reorganización 15-11-2026».
- Vídeo de presentación de la cuenta publicado el 15-11 (https://www.instagram.com/reel/DfvV_YrCVzv/): va fijado arriba.

## Reorganización 15-11-2026 (dos empresas, apps de cero a cien y gancho en 1-2 s)
Palabras del dueño: la última historia (presupuesto con la app del ERP) llegó a **110 visualizaciones**, mucho mejor que antes, pero la gente se va en 2 segundos. Quiere: llamar la atención en el primer segundo; enseñar cada app **de cero a cien** y no a trozos sueltos; no machacar solo el ERP; mezclar noticias con gancho; y apoyarse en Flownexion (colaborador) para parecer una empresa grande y profesional de IA y automatización.

### Las dos empresas (no mezclarlas)
- **Transforma con IA** (esta cuenta): IA y automatización para talleres, industria y cualquier empresa que se adapte. Lo que vendemos:
  1. **IndunexIA Gestión** (ERP): de cabo a rabo; sirve para talleres e industria y se adapta a otros sectores.
  2. **Asistente técnico (chatbot)** para proveedores, tiendas técnicas o el equipo: responde con el catálogo y las fichas.
  3. **IndunexIA Documentos**: facturas y documentos leídos, comprobados y ordenados.
  4. **IndunexIA Presupuestos** (del plano al presupuesto): suelto o dentro del plan Pro del ERP.
  5. **Fichas técnicas de producto** (idea del 15-11, dentro del asistente o como app aparte): NO se anuncia hasta que exista una demo real.
- **Flownexion** (colaborador, flownexion.com): automatización de tiendas online y otras apps. Nos llevamos comisión por cliente que les llevamos. Se habla de ellos como «herramienta que recomendamos», nunca como si fuera nuestra.

### Mezcla semanal (reels lunes, miércoles y viernes)
| Día | Qué | Ejemplo |
|---|---|---|
| Lunes | **Valor**: noticia del blog o de actualidad con gancho, o app útil del mercado | «Hacienda cambia esto en enero…» |
| Miércoles | **Producto de cero a cien**: UNA app nuestra entera, rotando 1→2→3→4 | Asistente técnico respondiendo de la pregunta a la compra |
| Viernes | **Valor** o **colaborador** (Flownexion u otra herramienta), en semanas alternas | Reel «reacción» de Flownexion |
- Así se cumple el 2 de valor : 1 de producto y nunca dos de producto seguidas.
- **Una app = una pieza completa.** Nada de una pieza «del plano» y al día siguiente otra «solo con el plano». Una función suelta (albaranes, calculadora, plano…) solo como recordatorio, **3 semanas o más** después de la pieza completa de su app y con otro ángulo.
- El ERP no puede salir más de una vez cada 2 semanas.

### Los primeros 1-2 segundos (lo que más importa)
- El fotograma 0 ya engancha: texto grande de 3-6 palabras + algo moviéndose (la app ya en marcha, Tuerqui con cara exagerada). Nunca logo, fundido a negro ni «Hola, somos…».
- Ganchos que funcionan: **resultado primero** («Del plano al presupuesto en 40 s»), **dolor concreto** («¿Otra tarde copiando productos?»), **contador o cronómetro en pantalla**, **«No hagas esto…»**, **curiosidad** («Mira lo que hace esto 👀»).
- En los 2 primeros segundos tiene que pasar algo: un toque en la pantalla, un número que sube, Tuerqui que reacciona.
- Subtítulos siempre (casi todo el mundo ve sin sonido).

### Historias
- **Serie de cero a cien**: cuando sale el reel de una app, ese día 3-5 historias seguidas con el flujo completo (1/4, 2/4…), cada una con una sola acción y como mucho 8 palabras en pantalla. La primera lleva el gancho y una pegatina (encuesta o pregunta) en los 2 primeros segundos.
- Resto de días: noticia del blog en historia con gancho (titular de 3-6 palabras + 1 dato + «Más en el perfil»), app útil o colaborador.
- Producto como mucho 1 de cada 4 historias fuera de los días de serie.

### Colaborador: Flownexion
- Formato **reacción seguida**: su vídeo corre entero, SIN parones; Tuerqui encima con caras (palomitas, flipa, encantado, aplaude) y palabras sueltas escritas, sin voz. Al acabar, cierre con la voz de la cuenta (cedar) en tono de anuncio y cupón: «Contacta con Flownexion, di que vienes de parte de Transforma con IA y usa el código **TRANSFORMA10**: 10 % de descuento». Composición `ReaccionSeguida` (`FABRICA DE VIDEOS/scripts/reaccion-seguida.mjs`).
- Siempre **#publi** y «Colaboración pagada» con @flownexion (cobramos comisión: Ley General de Comunicación Audiovisual y código de Autocontrol). `ig-calidad.ts` bloquea cualquier texto con Flownexion sin #publi.
- Como mucho 1 pieza de colaborador cada 2 semanas en el feed. En el texto: «herramienta que recomendamos», nunca «trabajamos con empresas de…» (lo bloquea ig-calidad).
- Enlace con seguimiento: `https://flownexion.com/automatizacion-ecommerce/?utm_source=instagram&utm_medium=social&utm_campaign=transforma10`.
