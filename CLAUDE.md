# CLAUDE.md · transformaconia.com + panel Experto en SEO

Repositorio **público**: nunca escribas secretos, claves ni datos personales en archivos versionados (todo va en `.env.local`, ignorado).

## Qué vive dónde

| Pieza | Dónde | Cómo se cambia |
|---|---|---|
| Web pública (WordPress + Salient + Rank Math, Hostinger) | Páginas: contenido generado por `n8n/web-paginas.mjs` (portada = `P['transforma-con-ia']`) y `n8n/web-locales.mjs` (páginas locales) | `node --env-file=.env.local n8n/web-paginas.mjs <slug> [<slug>…]` (sin slug despliega todas) |
| Diseño, shortcodes y JS de la web | `wordpress/web-transformaconia.php` + `.css` = snippet 13 de Code Snippets | `node --env-file=.env.local n8n/web-snippet.mjs` (hace copia y revierte si hay 5xx) |
| Reserva del diagnóstico `[tc_reserva]` | `wordpress/reserva.php` = snippet 14 | `n8n/web-reserva-snippet.mjs` |
| Otros snippets | `ajustes-fechas.php` (5), `rankmath-rest.php` (8), `llms-txt.php` (9), `redirecciones.php` (10), `sin-comentarios.php` (11), `estilo-editorial.php` (12) | copias versionadas; se suben por la pasarela |
| Menú | `n8n/web-menu.mjs` | solo toca el menú |
| Formularios y medición (n8n) | `n8n/web-contacto.mjs`, `web-reserva.mjs`, `web-visitas.mjs` | cada script regenera y redespliega su workflow |
| Publicador del blog y radar (n8n) | `n8n/publicador.mjs`, `n8n/radar.mjs`, `n8n/prompts.mjs` | `node --env-file=.env.local n8n/<script>.mjs` |
| Base de datos | Neon, esquema `seo` (`sql/seo.sql`) | SQL idempotente |
| Panel (Next.js, Vercel `experto-en-seo`) | `src/` | push a `main` = producción |
| **Ritmo de las rutinas (desde 27-10-2026: cada 3 días y a Telegram SOLO si ha pasado algo)** | `src/lib/ritmo.ts` (`seo.settings.ritmo`: cada, desde, pausas, búsquedas de captación). Lo leen el cron diario (idea de publicación + informe SEO si algo cambia), Instagram y n8n CAPTACIÓN `tDMbwFls8iHSzOlW` (repite la cuenta en «Qué toca»). Nada de partes diarios | Telegram (bot SEO): `/ritmo`, `/ritmo 3`, `/ritmo pausa|sigue instagram·captacion·publicaciones·seo·todo`, `/ritmo busquedas a; b`, `/ritmo ahora captacion|instagram`, `/ritmo replanificar`, `/captar oficio zona` |
| **Estilo de Instagram y control de calidad (27-10-2026)** | Guía `agente-ig/ESTILO-CUENTA.md` (alternar claro/oscuro, reel/carrusel, ganchos y llamadas a la acción que rotan). Antes de subir NADA: `src/lib/ig-calidad.ts` (reglas fijas con código + editor IA contra las últimas 8; si rompe reglas no se publica). Historias: banco `n8n/ig-historias.mjs` → `/api/ig/historia?id=` (7 plantillas), salen a las 13:10 del día que toca (`historias()`). Carruseles en la cola (`tipo carrusel`, `datos.imagenes`), imágenes en `demo.transformaconia.com/ig/carruseles/<id>/` | `/revisar` en Telegram o `GET /api/ig/revisar?id=` (Bearer CRON_SECRET) ensaya el control sin publicar. Fábrica: `Portada` y carruseles con `tema: claro|oscuro`, tipo de diapositiva `comparativa` |
| Instagram en automático (desde 26-10-2026, sin pedir permiso: él recibe el informe) | `src/lib/instagram-diario.ts` + `/api/cron/instagram` (n8n `s94sCQwlpBRkImVX` cada día: 13:00 respuestas con IA a comentarios y, el día del ritmo, reel del plan `seo.ig_plan` + números y posibles clientes, todo solo si hay algo · 19:00 `?fase=tarde` lista al móvil si quedó pendiente). Seguir y comentar en otras cuentas (la API no deja): lista `seo.ig_movil` que hace el agente local (`agente-ig/`, tarea de Windows diaria 13:00 y 17:00, `claude -p` + Chrome) o él desde el móvil con «✅ Hecho». Noticias del blog: se publican solas. Reels: `seo.ig_cola`, mp4 en `LANDING ERP/…/ig/<carpeta>/` + `node n8n/ig-cola.mjs`. `/reel`, `/reels`, `/plan` en el bot | Credencial en `seo.settings.ig_token` (app de Meta «Transforma con IA Publicador», id 1454002520006568), renovada por el cron cada 7 días. Lista de la semana: `n8n/ig-movil-semana1.mjs` como modelo (mirar publicaciones con Chrome y escribir cada comentario para ESA publicación) |
| Asistente técnico (chatbot) | Página `/agentes-chatbots-ia/` (planes `PLANES_ASISTENTE` = oferta.json) y demo en `demo.transformaconia.com/asistente/` (tienda ficticia Fluidtec Demo, `LANDING ERP/transformaconia-gestion/api/asistente-*.js`, OPENAI_API_KEY en Vercel) | `node --env-file=.env.local n8n/web-paginas.mjs agentes-chatbots-ia` · `vercel deploy --prod` en la landing |
| Landing de la demo del ERP | `PROYECTOS CLAUDE\LANDING ERP\transformaconia-gestion` (Vercel `transformaconia-gestion`, sin git) | `vercel deploy --prod` |

Acceso a WordPress: siempre por la pasarela n8n (`n8n/gw.mjs` → `wp(method, path, body)`). La pasarela **no** borra fragmentos (DELETE responde 204 sin borrar). Purgar caché: `wp('POST','/tc/v1/purgar',{})`. Tras purgar puede haber unos segundos de 504 por caché fría.

## Reglas de contenido (obligatorias)

- Posicionamiento: 1) IA y automatización para la **industria** en toda España; 2) Murcia y Región de Murcia; 3) IA general sin diluir.
- Quiénes somos: «un grupo de expertos en IA de Murcia con más de 2 años de experiencia». **Nunca nombres de persona** (ni en texto ni en JSON-LD).
- ERP: «IndunexIA Gestión», para la industria (nunca «para el metal»). Tres planes (desde 2026-10-25, fuente `TRANSFORMA - OFERTA UNICA/oferta.json`): Básico 590 € + 59 €/mes, Profesional 690 € + 69 €/mes (el destacado) y Pro 990 € + 89 €/mes; precios de temporada con tachado (tarifa general 790 / 990 / 1.490 €) hasta el 31/12/2026; puesta en marcha en un solo pago al empezar, 3 primeros meses de cuota gratis, usuario extra 15 €/mes desde el primer mes, sin permanencia (30 días de aviso), sin IVA. En la web los planes salen de `PLANES` en `n8n/web-paginas.mjs` (copia de oferta.json).
- Diagnóstico gratis: SIEMPRE por escrito (en 48 horas laborables, desde el formulario de /contacto/). Ya no hay reserva de llamadas ([tc_reserva] fuera de la web desde 2026-10-25). Se presenta en positivo («Así trabajamos: te lo enviamos por escrito…»); nunca «solo por escrito» ni «sin llamadas».
- Verifactu: el ERP no lo cumple todavía (aún no es obligatorio). No afirmar cumplimiento.
- Nunca Flownexion ni herramientas internas por marca (n8n, OpenAI, Claude…) en texto público.
- No inventar clientes, testimonios, cifras, resultados ni certificaciones. Ejemplos ficticios marcados («Ejemplo ficticio», «Empresa X», «Talleres Demo SL»). El caso SAP es un **ejemplo**.
- Capturas y demos: siempre datos ficticios.

## Forma de trabajar

- Copia en `_backups/` (ignorado) antes de tocar páginas, snippets o workflows.
- Commits con `git add` archivo a archivo (nunca `git add .`). `n8n/_*.mjs` y `n8n/_t4/` son scripts de usar y tirar (ignorados).
- Revisión antes de publicar: `ecc:code-reviewer` y, si toca formularios o datos, `ecc:security-reviewer`.
- Pruebas de formularios: email `info@transformaconia.com` o nombre «PRUEBA…» → se guardan con `es_prueba=true` y no cuentan en el embudo. Borrar las filas después.

## Estado (14-10-2026)

Hecho y publicado (tandas 1-7 del plan): portada y menú nuevos, páginas locales con contenido propio y enlazadas desde `/consultor-ia-murcia/`, `/erp-industria/` como referencia comercial con capturas `erp-industria-*`, blog en 3 categorías (IA en la industria · Gestión y facturación · Actualidad IA) con CTA por categoría, migas con BreadcrumbList y fechas en español, `/contacto/` con la reserva primero, embudo sin pruebas en `/visitas`, `/casos/` solo industria con fichas y lo demás en `/otros-sectores/`, formularios con límites atómicos y huella de IP HMAC con sal diaria.

Pendiente:
- Artículos programados (martes 9:00): 7720 ERP taller (20-10), 7724 stock repuestos (27-10), 7727 Verifactu (3-11), 7731 compras (10-11), 7734 albarán digital (17-11), 7737 ayudas Murcia (24-11). **Repasar 7727 antes del 3-11** (calendario Verifactu: hay previsión de aplazamiento a 2028 aún no normativa) y **7737 antes del 24-11** (extracto BORM del Cheque TIC y estado de cada ayuda).
- Aviso legal completo (LSSI): faltan NIF y domicilio; el usuario no los dará por ahora. No inventarlos.
- Asistente de la web: código aparcado en la rama local `asistente-web` (falta widget y pruebas). Gasto nuevo (tope 5 €/mes) pendiente de aprobación.
- LinkedIn: rama del publicador preparada y apagada (`seo.settings.linkedin_activo`); falta página de empresa y credencial.
- Autor de los artículos: «Redacción Transforma con IA» (no hay usuario personal y no debe haberlo con nombre).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
