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
| Landing de la demo del ERP | `PROYECTOS CLAUDE\LANDING ERP\transformaconia-gestion` (Vercel `transformaconia-gestion`, sin git) | `vercel deploy --prod` |

Acceso a WordPress: siempre por la pasarela n8n (`n8n/gw.mjs` → `wp(method, path, body)`). La pasarela **no** borra fragmentos (DELETE responde 204 sin borrar). Purgar caché: `wp('POST','/tc/v1/purgar',{})`. Tras purgar puede haber unos segundos de 504 por caché fría.

## Reglas de contenido (obligatorias)

- Posicionamiento: 1) IA y automatización para la **industria** en toda España; 2) Murcia y Región de Murcia; 3) IA general sin diluir.
- Quiénes somos: «un grupo de expertos en IA de Murcia con más de 2 años de experiencia». **Nunca nombres de persona** (ni en texto ni en JSON-LD).
- ERP: «TransformaConIA Gestión», para la industria (nunca «para el metal»). Precios confirmados: 690 € de puesta en marcha en dos pagos de 345 € (al empezar y a los 3 meses), 69 €/mes con los 3 primeros meses gratis, usuario extra 15 €/mes desde el primer mes, sin permanencia (30 días de aviso), sin IVA. No tocar «oferta para las 10 primeras empresas» ni el 990 € tachado sin permiso.
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
- DNS de la demo: registro `A demo → 76.76.21.21` en Hostinger (lo hace el usuario). Después cambiar `DEMO_URL` (`n8n/web-paginas.mjs`) y `TC_DEMO_URL` (`wordpress/web-transformaconia.php`) a `https://demo.transformaconia.com/`. El dominio ya está asociado en Vercel y la landing lleva canonical a `/erp-industria/`.
- Aviso legal completo (LSSI): faltan NIF y domicilio; el usuario no los dará por ahora. No inventarlos.
- Asistente de la web: código aparcado en la rama local `asistente-web` (falta widget y pruebas). Gasto nuevo (tope 5 €/mes) pendiente de aprobación.
- LinkedIn: rama del publicador preparada y apagada (`seo.settings.linkedin_activo`); falta página de empresa y credencial.
- Fragmento 15 de WordPress («TEMP · quitar Flownexion del CSS»): desactivado; borrarlo a mano desde el panel de WordPress.
- Autor de los artículos: «Redacción Transforma con IA» (no hay usuario personal y no debe haberlo con nombre).
