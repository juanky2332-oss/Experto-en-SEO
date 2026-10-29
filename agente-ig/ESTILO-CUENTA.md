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
