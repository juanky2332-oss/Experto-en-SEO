# Experto en SEO · transformaconia.com

Centro de control SEO y de contenidos del blog de [Transformaconia](https://transformaconia.com): audita cada artículo, propone y aplica mejoras con IA, publica noticias de IA con SEO completo y deja trazabilidad de todo en Telegram.

## Qué hace

| Pantalla | Para qué |
|---|---|
| **Resumen** | Salud SEO media, evolución diaria, qué arreglar primero, qué publicar hoy y últimos cambios. |
| **Artículos** | Todos los posts con puntuación SEO, problemas y filtros. Limpieza segura masiva. |
| **Editor** | Título, URL, SEO de Rank Math con vista previa de Google, contenido (vista/HTML), puntuación en vivo, «Mejorar con IA» (actualizar a hoy, FAQ, enlaces internos…), alt de imágenes con visión, nueva portada con gpt-image-2 y deshacer. |
| **Publicar** | Pegas una URL → brief editorial → apruebas → artículo redactado, revisado, con fotos y publicado. |
| **Radar IA** | Resumen diario de la actualidad de IA (14 fuentes) y noticias puntuadas por potencial SEO. |
| **Estrategia** | Plan SEO con IA: diagnóstico, clusters/pilares, qué publicar, qué no, qué actualizar, fusionar o eliminar. |
| **Auditoría** | Robots, sitemap, llms.txt, portada, arquitectura, canibalización, huérfanos, imágenes y PageSpeed. |
| **Historial** | Cada cambio (app, Telegram, n8n) con estado anterior y botón de deshacer. |

## Arquitectura

```
Telegram ─┐                        ┌─> WordPress REST (Rank Math, IndexNow)
          ├─> n8n ── SEO PASARELA ─┤
App ──────┘   │                    └─> Telegram (avisos con botones)
              ├─ Publicador IA SEO v3 (brief → investigación web → redacción → QC SEO → fotos → publicación)
              └─ RADAR IA DIARIO (8:30)
App / n8n ──> Postgres (Supabase, esquema `seo`)
App ──> OpenAI (gpt-5.5, gpt-5.4-mini, gpt-image-2)
```

- La app **nunca** tiene la contraseña de WordPress ni el token del bot: pasa por el webhook `seo-pasarela` de n8n con la cabecera `X-Seo-Key`.
- Los flujos de n8n se generan desde código: `node n8n/publicador.mjs`, `node n8n/radar.mjs`, `node n8n/pasarela.mjs <id>` (leen `N8N_API_KEY` de `.env.local`).
- `wordpress/` contiene los dos snippets PHP instalados con Code Snippets (campos de Rank Math en la API y `/llms.txt`).

## Desarrollo

```bash
cp .env.example .env.local   # rellenar
npm install
npm run dev
```

Despliegue en Vercel (proyecto `experto-en-seo`). El cron diario (`/api/cron/diario`) guarda la foto SEO y avisa por Telegram si algo empeora; los lunes manda el informe semanal.
