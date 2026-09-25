# Experto en SEO · transformaconia.com

Centro de control SEO y de contenidos del blog de [Transformaconia](https://transformaconia.com): audita cada artículo, propone y aplica mejoras con IA, publica noticias de IA con SEO completo y deja trazabilidad de todo en Telegram.

## Qué hace

| Pantalla | Para qué |
|---|---|
| **Resumen** | Salud SEO media, evolución diaria, qué arreglar primero, qué publicar hoy y últimos cambios. |
| **Artículos** | Todos los posts con puntuación SEO, problemas y filtros. Limpieza segura masiva. |
| **Editor** | Título, URL, SEO de Rank Math con vista previa de Google, contenido (vista/HTML), puntuación en vivo, «Mejorar con IA» (actualizar a hoy, FAQ, enlaces internos…), alt de imágenes con visión, nueva portada con gpt-image-2 y deshacer. |
| **Publicar** | Pegas una URL → brief editorial → apruebas → artículo redactado, revisado, con fotos y publicado. |
| **Radar IA** | Interruptor ON/OFF y configuración: avisos diarios, semanales o solo en el panel, hora, temas preferidos (también se buscan en la web), temas a evitar y tipos de contenido. Lee 21 fuentes, clasifica cada noticia por tipo (actualidad, truco, guía, herramienta, automatización, empresa) y la puntúa. |
| **Guía editorial** | La línea editorial viva: audiencias, pilares, tipos de contenido (estructura, CTA y estilo de imagen de cada uno), reglas SEO y para buscadores con IA. Cobertura real por tipo y pilar, «qué publicar después» (se recalcula cada lunes) y «Pide un cambio» en lenguaje normal. La leen el radar y el redactor. |
| **Estrategia** | Plan SEO con IA: diagnóstico, clusters/pilares, qué publicar, qué no, qué actualizar, fusionar o eliminar. |
| **Auditoría** | Robots, sitemap, llms.txt, portada, arquitectura, canibalización, huérfanos, imágenes y PageSpeed. |
| **Historial** | Cada cambio (app, Telegram, n8n) con estado anterior y botón de deshacer. |

## Arquitectura

```
Telegram ─┐                        ┌─> WordPress REST (Rank Math, IndexNow)
          ├─> n8n ── SEO PASARELA ─┤
App ──────┘   │                    └─> Telegram (avisos con botones)
              ├─ Publicador IA SEO v3 (brief → investigación web → redacción → QC SEO → fotos → publicación)
              └─ RADAR IA (comprueba cada hora su configuración; trabaja a la hora elegida)
App / n8n ──> Postgres (Supabase, esquema `seo`)
App ──> OpenAI (gpt-5.5, gpt-5.4-mini, gpt-image-2)
```

- La app **nunca** tiene la contraseña de WordPress ni el token del bot: pasa por el webhook `seo-pasarela` de n8n con la cabecera `X-Seo-Key`.
- Los flujos de n8n se generan desde código: `node n8n/publicador.mjs`, `node n8n/radar.mjs`, `node n8n/pasarela.mjs <id>` (leen `N8N_API_KEY` de `.env.local`).
- La guía editorial y la configuración del radar viven en `seo.settings` (`guia`, `radar`, `radar_estado`); los valores de partida están en `src/lib/guia-base.ts`, que también importan los scripts de n8n. Migración: `node n8n/migrar-radar-guia.mjs`. `node n8n/radar.mjs --guardar` despliega el radar guardando también las ejecuciones correctas (para depurar).
- `wordpress/` contiene los dos snippets PHP instalados con Code Snippets (campos de Rank Math en la API y `/llms.txt`).

## Desarrollo

```bash
cp .env.example .env.local   # rellenar
npm install
npm run dev
```

Despliegue en Vercel (proyecto `experto-en-seo`). El cron diario (`/api/cron/diario`) guarda la foto SEO y avisa por Telegram si algo empeora; los lunes manda el informe semanal y recalcula «qué publicar después» de la guía.
