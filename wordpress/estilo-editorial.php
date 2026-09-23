/*
 * Experto en SEO (app): estilo editorial de los artículos del blog (tema Salient).
 * Enlaces sobrios, índice, "Lo esencial", tablas, citas, figuras, relacionados y autor.
 */
add_action( 'wp_head', function () {
	if ( ! is_singular( 'post' ) ) {
		return;
	}
	?>
<style id="experto-seo-editorial">
body.single-post .content-inner { --tca-azul: #2554e8; --tca-tinta: #0f172a; --tca-gris: #64748b; --tca-linea: #e5e7eb; }
body.single-post .content-inner a { color: var(--tca-azul); text-decoration: none; background-image: linear-gradient(currentColor, currentColor); background-size: 100% 1px; background-position: 0 100%; background-repeat: no-repeat; padding-bottom: 1px; transition: color .15s, background-size .2s; }
body.single-post .content-inner a:hover { color: #1c42c4; background-size: 100% 2px; }
body.single-post .content-inner a[href^="mailto:"] { font-weight: 600; }
body.single-post .content-inner h2 { margin-top: 2.2em; margin-bottom: .6em; scroll-margin-top: 110px; }
body.single-post .content-inner h3 { margin-top: 1.6em; margin-bottom: .45em; scroll-margin-top: 110px; }
body.single-post .content-inner h2 a, body.single-post .content-inner h3 a { color: inherit; background-image: none; }
/* Lo esencial */
body.single-post .tca-esencial { background: #f5f8ff; border: 1px solid #dbe6fe; border-left: 4px solid var(--tca-azul); border-radius: 14px; padding: 18px 22px 8px; margin: 0 0 28px; }
body.single-post .tca-esencial .tca-esencial__titulo, body.single-post .tca-esencial > p:first-child { margin: 0 0 6px; text-transform: uppercase; letter-spacing: .06em; font-size: 13px; color: var(--tca-azul); }
body.single-post .tca-esencial ul { margin: 0 0 10px 18px; }
body.single-post .tca-esencial li { margin: 4px 0; }
/* Índice */
body.single-post .tca-indice, body.single-post nav.tabla-contenidos { background: #fafbfc !important; border: 1px solid var(--tca-linea) !important; border-radius: 14px !important; padding: 16px 22px !important; margin: 0 0 32px !important; }
body.single-post .tca-indice .tca-indice__titulo, body.single-post .tca-indice > p:first-child, body.single-post nav.tabla-contenidos > p:first-child { margin: 0 0 6px !important; text-transform: uppercase; letter-spacing: .06em; font-size: 13px; color: var(--tca-gris); }
body.single-post .tca-indice ol, body.single-post nav.tabla-contenidos ul { margin: 0 0 0 20px !important; }
body.single-post .tca-indice li, body.single-post nav.tabla-contenidos li { margin: 3px 0 !important; line-height: 1.5; }
body.single-post .tca-indice a, body.single-post nav.tabla-contenidos a { color: var(--tca-tinta); background-image: none; }
body.single-post .tca-indice a:hover, body.single-post nav.tabla-contenidos a:hover { color: var(--tca-azul); }
/* Citas */
body.single-post .content-inner blockquote { border-left: 4px solid var(--tca-azul); background: #f8fafc; border-radius: 0 12px 12px 0; padding: 14px 20px; margin: 26px 0; font-style: normal; font-size: 1.05em; color: #1e293b; }
body.single-post .content-inner blockquote p { margin: 0; }
/* Tablas */
body.single-post .content-inner table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid var(--tca-linea); border-radius: 12px; overflow: hidden; margin: 26px 0; font-size: .95em; }
body.single-post .content-inner th { background: #f1f5ff; color: var(--tca-tinta); font-weight: 600; text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--tca-linea); }
body.single-post .content-inner td { padding: 10px 12px; border-bottom: 1px solid var(--tca-linea); vertical-align: top; }
body.single-post .content-inner tr:last-child td { border-bottom: 0; }
/* Figuras */
body.single-post .content-inner figure { margin: 34px 0 !important; }
body.single-post .content-inner figure img { border-radius: 14px !important; width: 100%; height: auto; box-shadow: 0 6px 24px rgba(15, 23, 42, .10) !important; }
body.single-post .content-inner figcaption { font-size: .85em !important; color: var(--tca-gris) !important; text-align: center; font-style: normal !important; margin-top: 10px !important; }
/* Relacionados y autor */
body.single-post .tca-relacionados { border: 1px solid var(--tca-linea); border-radius: 14px; padding: 16px 22px; margin: 36px 0 0; }
body.single-post .tca-relacionados > p:first-child { margin: 0 0 6px; text-transform: uppercase; letter-spacing: .06em; font-size: 13px; color: var(--tca-gris); }
body.single-post .tca-relacionados ul { margin: 0 0 0 18px; }
body.single-post .tca-relacionados a { color: var(--tca-tinta); background-image: none; font-weight: 600; }
body.single-post .tca-relacionados a:hover { color: var(--tca-azul); }
body.single-post .tca-autor { display: block; background: linear-gradient(135deg, #0b0f19, #1c2a52); color: #e2e8f0; border-radius: 16px; padding: 22px 26px; margin: 36px 0 10px; font-size: .97em; }
body.single-post .tca-autor p { margin: 0 0 8px; color: #e2e8f0; }
body.single-post .tca-autor p:last-child { margin: 0; }
body.single-post .tca-autor strong { color: #fff; }
body.single-post .tca-autor a { color: #9db7ff; }
/* Fuentes */
body.single-post ul.tca-fuentes { font-size: .92em; }
body.single-post ul.tca-fuentes a { color: var(--tca-gris); }
</style>
	<?php
}, 30 );
