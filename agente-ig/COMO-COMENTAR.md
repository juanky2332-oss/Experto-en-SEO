# Cómo comentamos en Instagram (@transformaconia.oficial)

Versión 2 · 20-11-2026. Criterio del dueño: comentar **como un profesional del sector**, al grano y con algo objetivo que haga que el comentario resulte interesante y den ganas de mirar quiénes somos. Nada de exaltar, nada cursi, nada exagerado ni sin fundamento. Nunca vender. Nunca repetir cuenta ni publicación.

> ⛔ **El error del 19-11-2026, para que no se repita:** se comentó «Qué limpia ha quedado esa corredera. Se nota el oficio.» en una publicación que **no era un trabajo, sino un cartel publicitario**. Se comentó leyendo la descripción automática de la imagen («puede ser una imagen de puerta corredera y texto») sin mirarla. Quedamos como un bot que no mira. **Nunca más se comenta sin haber VISTO la publicación.**

## Paso 0 · Mirar la publicación (obligatorio, antes de escribir nada)
1. Ábrela navegando y **haz una captura** (`take_screenshot`) de la imagen o de la portada del vídeo. Lee también su texto entero. La descripción automática (`alt`, «Puede ser una imagen de…») **no vale**: no dice lo que es.
2. Decide qué es:
   - **Trabajo real**: foto de una obra, una pieza, una máquina, una instalación terminada, el taller o el equipo trabajando. → Se puede comentar sobre **lo que se ve**.
   - **Cartel, folleto o anuncio**: gráfico con texto, oferta, catálogo, plantilla, imagen de stock, «estamos contratando», felicitaciones, días señalados. → **Nunca** alabar «el trabajo» ni «el acabado» de algo que no es real. O no se comenta, o se comenta **el contenido** (el servicio o producto que anuncian, la noticia) con un dato objetivo.
   - **Vídeo**: mira lo que se ve en la portada y lee el texto. Si no está claro qué enseñan, no se comenta.
   - **Oferta de empleo, sorteo, política, sucesos, luto o temas tristes**: no se comenta.
3. **Si tienes cualquier duda de qué es: no se comenta.** Mejor ninguno que uno equivocado.

## Cómo es un buen comentario
- **De profesional a profesional**: una observación concreta que solo haría alguien que conoce el oficio (el acabado de una soldadura, la solución de montaje, la organización del taller, el plazo, la normativa, para qué sirve la máquina).
- **Una frase, máximo dos** (unas 15-25 palabras). Directo.
- **Sobrio**: sin superlativos ni exclamaciones de fan. **Prohibido**: «brutal», «espectacular», «increíble», «impresionante», «qué nivel», «qué pasada», «top», «👏🔥», «¡enhorabuena equipazo!». Como mucho un emoji, y mejor ninguno.
- **Objetivo**: lo que dices tiene que estar en la publicación. Nada inventado, nada supuesto.
- **Casi nunca preguntas**: como mucho 1 de cada 5 comentarios y nunca dos el mismo día. Solo una pregunta que haría un colega del sector y que tenga sentido contestar.
- **Nunca vender ni hablar de nosotros**: ni productos, ni enlaces, ni «visita nuestro perfil». La marca ya se ve en el nombre de la cuenta.
- Castellano de aquí, natural y educado, sin localismos forzados ni giros de traductor. No repetir aperturas en el mismo día.

## Ejemplos
| Publicación | ✅ Bien | ❌ Mal (por qué) |
|---|---|---|
| Foto real de un depósito soldado | «Buen remate en los cordones. En depósitos de ese tamaño es donde se nota el oficio.» | «¡Brutal! 🔥🔥» (vacío y exagerado) |
| Pieza mecanizada en el torno | «Buen acabado. En series cortas mantener esa tolerancia tiene su mérito.» | «Qué pasada de pieza» (de fan, sin contenido) |
| Marquesinas fotovoltaicas terminadas | «Buena solución: la misma estructura da sombra y soporta los paneles.» | «Espectacular trabajo, sois los mejores» (sin fundamento) |
| **Cartel** anunciando un cortacésped | «Con arranque eléctrico se agradece en jornadas largas de mantenimiento.» (habla del producto) | «Qué bien ha quedado» (no es un trabajo: es un anuncio) |
| **Cartel** de una puerta corredera | No comentar, o: «Buena opción para naves con poco espacio de apertura.» | «Qué limpia ha quedado esa corredera» (el error del 19-11) |
| Aniversario con foto real del equipo | «45 años en el sector. Enhorabuena al equipo.» | «¡Felicidades, equipazo! 🎉🎉» |
| Jornada o feria del sector | «Buena iniciativa; hacen falta más jornadas así para las empresas de aquí.» | «Qué evento más increíble» |

## Cómo se prepara
Las cuentas salen del **grupo del día** (`node n8n/ig-plan.mjs hoy` → `grupo`). De cada una: abrir el perfil, abrir 1-2 publicaciones recientes (de los últimos 2 meses), **Paso 0** (captura + texto), elegir una que sea trabajo real o un contenido que dé pie, y escribir el comentario con estas reglas. Se carga con `node n8n/ig-plan.mjs anadir comentar <cuenta> <url> "<texto>"`. **El comentario lo publica él desde el móvil** (le llega a las 19:00): el agente nunca lo publica.
