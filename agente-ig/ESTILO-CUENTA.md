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
- Nunca: «demo gratis», Flownexion, herramientas internas por su marca, «solo por escrito» o «sin llamadas», «para el metal», que cumplimos Verifactu, cifras, clientes o testimonios inventados.

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
