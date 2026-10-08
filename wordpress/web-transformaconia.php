/*
 * Transforma con IA · diseño de la web (portada, soluciones, casos, contacto) sobre el tema Salient.
 * - Las páginas cuyo contenido empieza por <!--tc--> usan el diseño propio (clase tc-landing, sin wpautop).
 * - Shortcodes de noticias dinámicas: [tc_ticker], [tc_destacadas], [tc_categoria], [tc_contador], [tc_fecha].
 * - Pie común, CTA bajo cada artículo, textos del tema en español y datos estructurados de la marca.
 * Fuente: wordpress/web-transformaconia.php (repo Experto en SEO). Desplegar con node n8n/web-snippet.mjs
 */

if ( ! function_exists( 'tc_es_landing' ) ) {
	function tc_es_landing() {
		if ( ! is_singular( 'page' ) ) {
			return false;
		}
		$p = get_post();
		return $p && 0 === strpos( ltrim( $p->post_content ), '<!--tc-->' );
	}
}

/* ---------- 1. Páginas con diseño propio: sin wpautop y con clase en <body> ---------- */
add_filter( 'the_content', function ( $c ) {
	if ( 0 === strpos( ltrim( $c ), '<!--tc-->' ) ) {
		remove_filter( 'the_content', 'wpautop' );
		remove_filter( 'the_content', 'shortcode_unautop' );
	}
	return $c;
}, 1 );
add_filter( 'body_class', function ( $cl ) {
	if ( tc_es_landing() ) {
		$cl[] = 'tc-landing';
	}
	if ( is_front_page() ) {
		$cl[] = 'tc-home';
	}
	return $cl;
} );

/* ---------- 2. Utilidades de noticias ---------- */
function tc_minutos( $post ) {
	$palabras = str_word_count( wp_strip_all_tags( $post->post_content ) );
	return max( 2, (int) round( $palabras / 220 ) );
}
function tc_hace( $post ) {
	$d = time() - get_post_time( 'U', true, $post );
	if ( $d < 3600 ) {
		return 'hace ' . max( 1, (int) floor( $d / 60 ) ) . ' min';
	}
	if ( $d < 86400 ) {
		return 'hace ' . (int) floor( $d / 3600 ) . ' h';
	}
	if ( $d < 172800 ) {
		return 'ayer';
	}
	if ( $d < 604800 ) {
		return 'hace ' . (int) floor( $d / 86400 ) . ' días';
	}
	return date_i18n( 'j M Y', get_post_time( 'U', false, $post ) );
}
function tc_cat( $post ) {
	$c = get_the_category( $post->ID );
	return $c ? $c[0] : null;
}
function tc_resumen( $post, $n = 26 ) {
	$t = $post->post_excerpt ? $post->post_excerpt : $post->post_content;
	return wp_trim_words( wp_strip_all_tags( strip_shortcodes( $t ) ), $n, '…' );
}
function tc_tarjeta( $post, $clase = '', $img = 'medium_large', $resumen = 0, $eager = false ) {
	$cat   = tc_cat( $post );
	$url   = get_permalink( $post );
	$thumb = get_the_post_thumbnail( $post, $img, array(
		'class'         => 'tc-card__img',
		'loading'       => $eager ? 'eager' : 'lazy',
		'fetchpriority' => $eager ? 'high' : 'auto',
		'decoding'      => 'async',
		'alt'           => esc_attr( get_the_title( $post ) ),
	) );
	$h  = '<article class="tc-card ' . esc_attr( $clase ) . '">';
	$h .= '<a class="tc-card__media" href="' . esc_url( $url ) . '" tabindex="-1" aria-hidden="true">' . ( $thumb ? $thumb : '<span class="tc-card__noimg"></span>' ) . '</a>';
	$h .= '<div class="tc-card__body">';
	if ( $cat ) {
		$h .= '<a class="tc-chip" href="' . esc_url( get_category_link( $cat ) ) . '">' . esc_html( $cat->name ) . '</a>';
	}
	$h .= '<h3 class="tc-card__title"><a href="' . esc_url( $url ) . '">' . esc_html( get_the_title( $post ) ) . '</a></h3>';
	if ( $resumen ) {
		$h .= '<p class="tc-card__excerpt">' . esc_html( tc_resumen( $post, $resumen ) ) . '</p>';
	}
	$h .= '<p class="tc-card__meta"><time data-tc-hace="' . esc_attr( get_post_time( 'c', true, $post ) ) . '" datetime="' . esc_attr( get_post_time( 'c', true, $post ) ) . '">' . esc_html( tc_hace( $post ) ) . '</time><span aria-hidden="true">·</span>' . tc_minutos( $post ) . ' min de lectura</p>';
	$h .= '</div></article>';
	return $h;
}

/* [tc_fecha] → «miércoles, 8 de octubre» */
add_shortcode( 'tc_fecha', function () {
	return '<span data-tc-hoy>' . esc_html( date_i18n( 'l, j \d\e F' ) ) . '</span>';
} );

/* [tc_contador que="posts|fuentes"] */
add_shortcode( 'tc_contador', function ( $a ) {
	$a = shortcode_atts( array( 'que' => 'posts' ), $a );
	if ( 'posts' === $a['que'] ) {
		return (string) (int) wp_count_posts( 'post' )->publish;
	}
	return '';
} );

/* [tc_ticker n=6] titulares recientes en lista con hora */
add_shortcode( 'tc_ticker', function ( $a ) {
	$a = shortcode_atts( array( 'n' => 6 ), $a );
	$ps = get_posts( array( 'numberposts' => (int) $a['n'], 'post_status' => 'publish' ) );
	$h  = '<ol class="tc-ticker">';
	foreach ( $ps as $p ) {
		$cat = tc_cat( $p );
		$h  .= '<li><a href="' . esc_url( get_permalink( $p ) ) . '"><span class="tc-ticker__t"><span data-tc-hace="' . esc_attr( get_post_time( 'c', true, $p ) ) . '">' . esc_html( tc_hace( $p ) ) . '</span>' . ( $cat ? ' · ' . esc_html( $cat->name ) : '' ) . '</span><span class="tc-ticker__h">' . esc_html( get_the_title( $p ) ) . '</span></a></li>';
	}
	return $h . '</ol>';
} );

/* [tc_destacadas] la última grande + 4 en rejilla */
add_shortcode( 'tc_destacadas', function () {
	$ps = get_posts( array( 'numberposts' => 5, 'post_status' => 'publish' ) );
	if ( ! $ps ) {
		return '';
	}
	$h = '<div class="tc-destacadas">' . tc_tarjeta( array_shift( $ps ), 'tc-card--xl', 'large', 34, true ) . '<div class="tc-destacadas__resto">';
	foreach ( $ps as $p ) {
		$h .= tc_tarjeta( $p, 'tc-card--row', 'medium' );
	}
	return $h . '</div></div>';
} );

/* [tc_categoria slug="guias-ia" n=4 desde=0] fila de tarjetas de una categoría */
add_shortcode( 'tc_categoria', function ( $a ) {
	$a   = shortcode_atts( array( 'slug' => '', 'n' => 4, 'excluir_recientes' => 0 ), $a );
	$cat = get_category_by_slug( $a['slug'] );
	if ( ! $cat ) {
		return '';
	}
	$args = array( 'numberposts' => (int) $a['n'], 'post_status' => 'publish', 'category' => $cat->term_id );
	if ( $a['excluir_recientes'] ) {
		$args['exclude'] = get_posts( array( 'numberposts' => 5, 'fields' => 'ids' ) );
	}
	$ps = get_posts( $args );
	$h  = '<div class="tc-fila">';
	foreach ( $ps as $p ) {
		$h .= tc_tarjeta( $p, '', 'medium_large', 18 );
	}
	return $h . '</div>';
} );

/* ---------- 3. Sistema de diseño (todas las páginas) ---------- */
add_action( 'wp_head', function () {
	?>
<style id="tc-web">
:root{--tc-bg:#08070b;--tc-bg2:#0f0d14;--tc-card:#14111b;--tc-line:rgba(255,255,255,.09);--tc-line2:rgba(255,255,255,.16);--tc-fg:#f4f0f8;--tc-muted:#a9a1b4;--tc-dim:#7d7588;--tc-m:#b020ff;--tc-m2:#d27bff;--tc-m3:#6d0fb0;--tc-glow:rgba(176,32,255,.35);--tc-ok:#4ade80;--tc-r:18px;--tc-ease:cubic-bezier(.2,.7,.2,1);--tc-display:"Poppins",system-ui,sans-serif;--tc-body:"Open Sans",system-ui,sans-serif}
/* lienzo de las páginas de diseño propio */
body.tc-landing,body.tc-landing .container-wrap,body.tc-landing #ajax-content-wrap{background:var(--tc-bg)!important}
body.tc-landing .container-wrap{padding:0!important;min-height:0!important}
body.tc-landing .container-wrap>.container.main-content{max-width:none!important;width:100%!important;padding:0!important}
body.tc-landing .main-content>.row{padding:0!important;margin:0!important}
body.tc-landing .tc strong,body.tc-landing .tc b,.tc-footer strong,.tc-cta-post strong{color:inherit!important}
.tc{color:var(--tc-fg);font-family:var(--tc-body);font-size:17px;line-height:1.65;-webkit-font-smoothing:antialiased;overflow-x:clip}
.tc *,.tc *::before,.tc *::after{box-sizing:border-box}
.tc h1,.tc h2,.tc h3,.tc h4{font-family:var(--tc-display);color:var(--tc-fg);letter-spacing:-.02em;text-wrap:balance;margin:0}
.tc h1{font-size:clamp(34px,5vw,60px);line-height:1.04;font-weight:700}
.tc h2{font-size:clamp(28px,3.6vw,44px);line-height:1.1;font-weight:700}
.tc h3{font-size:20px;line-height:1.3;font-weight:600}
.tc p{margin:0;color:var(--tc-muted)}
.tc a{color:inherit;text-decoration:none}
.tc ul,.tc ol{margin:0;padding:0;list-style:none}
.tc-wrap{max-width:1240px;margin:0 auto;padding-inline:clamp(18px,4vw,40px)}
.tc-sec{padding-block:clamp(64px,9vw,120px);position:relative}
.tc-sec--tight{padding-block:clamp(40px,6vw,72px)}
.tc-sec--alt{background:var(--tc-bg2);border-block:1px solid var(--tc-line)}
.tc-eyebrow{display:inline-flex;align-items:center;gap:10px;font-family:var(--tc-display);font-size:12.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--tc-m2)}
.tc-eyebrow::before{content:"";width:22px;height:2px;border-radius:2px;background:linear-gradient(90deg,var(--tc-m),transparent)}
.tc-head{display:flex;flex-wrap:wrap;align-items:end;justify-content:space-between;gap:16px 40px;margin-bottom:clamp(28px,4vw,48px)}
.tc-head>div{display:grid;gap:14px;max-width:760px}
.tc-head p{font-size:18px}
.tc-lead{font-size:clamp(18px,1.6vw,21px);line-height:1.6;max-width:62ch}
.tc-grad{background:linear-gradient(100deg,#fff 10%,var(--tc-m2) 55%,var(--tc-m) 90%);-webkit-background-clip:text;background-clip:text;color:transparent!important}
/* botones */
.tc-btns{display:flex;flex-wrap:wrap;gap:12px}
.tc-btn{--b:var(--tc-m);position:relative;display:inline-flex;align-items:center;gap:10px;padding:14px 22px;border-radius:12px;font-family:var(--tc-display);font-weight:600;font-size:15.5px;line-height:1;color:#fff!important;background:var(--b);box-shadow:0 10px 30px -10px var(--tc-glow),inset 0 1px 0 rgba(255,255,255,.25);transition:transform .25s var(--tc-ease),box-shadow .25s,background .25s;isolation:isolate;overflow:hidden;cursor:pointer;border:0}
.tc-btn::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.28) 50%,transparent 70%);transform:translateX(-120%);transition:transform .7s var(--tc-ease);z-index:-1}
.tc-btn:hover{transform:translateY(-2px);box-shadow:0 16px 40px -12px var(--tc-glow),inset 0 1px 0 rgba(255,255,255,.25)}
.tc-btn:hover::after{transform:translateX(120%)}
.tc-btn svg{width:18px;height:18px;transition:transform .25s var(--tc-ease)}
.tc-btn:hover svg{transform:translateX(3px)}
.tc-btn--ghost{background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 1px var(--tc-line2)}
.tc-btn--ghost:hover{background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px var(--tc-m2)}
.tc-link{display:inline-flex;align-items:center;gap:8px;font-family:var(--tc-display);font-weight:600;font-size:15px;color:var(--tc-m2)!important;white-space:nowrap}
.tc-link::after{content:"→";transition:transform .25s var(--tc-ease)}
.tc-link:hover::after{transform:translateX(4px)}
.tc a:focus-visible,.tc button:focus-visible,.tc input:focus-visible,.tc select:focus-visible,.tc textarea:focus-visible,.tc summary:focus-visible{outline:2px solid var(--tc-m2);outline-offset:3px;border-radius:8px}
/* hero */
.tc-hero{position:relative;padding-block:clamp(40px,6vw,80px) clamp(44px,5vw,72px);overflow:hidden;isolation:isolate}
.tc-hero::before{content:"";position:absolute;inset:-20% -10% auto;height:120%;z-index:-2;background:radial-gradient(600px 380px at 78% 18%,rgba(176,32,255,.28),transparent 70%),radial-gradient(520px 340px at 8% 90%,rgba(109,15,176,.25),transparent 70%)}
.tc-hero::after{content:"";position:absolute;inset:0;z-index:-1;background-image:linear-gradient(var(--tc-line) 1px,transparent 1px),linear-gradient(90deg,var(--tc-line) 1px,transparent 1px);background-size:56px 56px;mask-image:radial-gradient(ellipse 70% 60% at 50% 30%,#000 30%,transparent 75%);-webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 30%,#000 30%,transparent 75%);opacity:.55}
.tc-hero__grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,.9fr);gap:clamp(32px,5vw,72px);align-items:start}
.tc-hero__copy{display:grid;gap:24px;align-content:start}
.tc-live{display:inline-flex;align-items:center;gap:10px;width:max-content;max-width:100%;padding:7px 14px 7px 10px;border-radius:99px;background:rgba(176,32,255,.1);box-shadow:inset 0 0 0 1px rgba(210,123,255,.28);font-size:13.5px;color:var(--tc-fg);font-family:var(--tc-display);font-weight:500}
.tc-live i{width:8px;height:8px;border-radius:50%;background:var(--tc-ok);box-shadow:0 0 0 0 rgba(74,222,128,.6);animation:tc-pulse 2s infinite}
@keyframes tc-pulse{70%{box-shadow:0 0 0 9px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}
.tc-hero__panel{background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015));border:1px solid var(--tc-line);border-radius:var(--tc-r);padding:22px 22px 10px;backdrop-filter:blur(8px);box-shadow:0 30px 80px -40px rgba(0,0,0,.9)}
.tc-hero__panel-h{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:6px;font-family:var(--tc-display);font-size:13px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--tc-dim)}
.tc .tc-ticker{counter-reset:t;list-style:none!important;margin:0!important;padding:0!important}.tc .tc-ticker li{list-style:none!important;margin:0!important;padding:0!important}
.tc-ticker li{counter-increment:t;border-top:1px solid var(--tc-line)}
.tc-ticker li:first-child{border-top:0}
.tc-ticker a{display:grid;grid-template-columns:28px 1fr;gap:2px 12px;padding:14px 0;transition:padding .25s var(--tc-ease)}
.tc-ticker a::before{content:counter(t,decimal-leading-zero);grid-row:span 2;font-family:var(--tc-display);font-weight:600;font-size:13px;color:var(--tc-m2);padding-top:2px}
.tc-ticker__t{font-size:12.5px;color:var(--tc-dim)}
.tc-ticker__h{font-family:var(--tc-display);font-weight:500;font-size:15.5px;line-height:1.35;color:var(--tc-fg);transition:color .2s}
.tc-ticker a:hover{padding-left:6px}
.tc-ticker a:hover .tc-ticker__h{color:var(--tc-m2)}
.tc-proof{display:flex;flex-wrap:wrap;gap:10px 28px;padding-top:8px;font-size:14px;color:var(--tc-dim)}
.tc-proof b{font-family:var(--tc-display);color:var(--tc-fg)!important;font-weight:600}
/* tarjetas de noticia */
.tc-card{position:relative;display:flex;flex-direction:column;background:var(--tc-card);border:1px solid var(--tc-line);border-radius:var(--tc-r);overflow:hidden;transition:transform .35s var(--tc-ease),border-color .35s,box-shadow .35s;min-width:0}
.tc-card:hover{transform:translateY(-4px);border-color:rgba(210,123,255,.35);box-shadow:0 24px 60px -30px var(--tc-glow)}
.tc-card__media{display:block;aspect-ratio:16/9;overflow:hidden;background:#1b1724}
.tc-card__img{width:100%!important;height:100%!important;object-fit:cover;display:block;transition:transform .8s var(--tc-ease),filter .5s;filter:saturate(.92)}
.tc-card:hover .tc-card__img{transform:scale(1.045);filter:saturate(1.05)}
.tc-card__noimg{display:block;width:100%;height:100%;background:radial-gradient(circle at 30% 30%,var(--tc-m3),transparent 60%),#15111c}
.tc-card__body{display:grid;gap:10px;padding:18px 20px 20px;align-content:start;flex:1}
.tc-card__title{font-size:18.5px!important;line-height:1.3!important}
.tc-card__title a{background-image:linear-gradient(var(--tc-m2),var(--tc-m2));background-size:0 1px;background-repeat:no-repeat;background-position:0 100%;transition:background-size .4s var(--tc-ease)}
.tc-card:hover .tc-card__title a{background-size:100% 1px}
.tc-card__title a::after{content:"";position:absolute;inset:0}
.tc-card__excerpt{font-size:15px;line-height:1.55}
.tc-card__meta{display:flex;gap:8px;font-size:13px;color:var(--tc-dim)!important;margin-top:auto}
.tc-chip{position:relative;z-index:1;justify-self:start;display:inline-block;padding:4px 10px;border-radius:99px;font-family:var(--tc-display);font-size:11.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--tc-m2)!important;background:rgba(176,32,255,.12);transition:background .2s}
.tc-chip:hover{background:rgba(176,32,255,.25)}
.tc-destacadas{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:22px}
.tc-card--xl .tc-card__media{aspect-ratio:16/10}
.tc-card--xl .tc-card__title{font-size:clamp(22px,2.3vw,30px)!important;line-height:1.18!important}
.tc-card--xl .tc-card__body{padding:24px 26px 26px;gap:14px}
.tc-destacadas__resto{display:grid;gap:14px}
.tc-card--row{flex-direction:row;align-items:stretch}
.tc-card--row .tc-card__media{width:38%;flex:none;aspect-ratio:auto;min-height:118px}
.tc-card--row .tc-card__body{padding:14px 16px;gap:8px}
.tc-card--row .tc-card__title{font-size:16px!important}
.tc-fila{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}
.tc-fila .tc-card__title{font-size:16.5px!important}
.tc-cats{display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(48px,6vw,80px)}.tc-cats>div,.tc-wrap>*{min-width:0}
/* tarjetas de servicio */
.tc-grid{display:grid;gap:20px}
.tc-grid--2{grid-template-columns:repeat(2,minmax(0,1fr))}
.tc-grid--3{grid-template-columns:repeat(3,minmax(0,1fr))}
.tc-grid--4{grid-template-columns:repeat(4,minmax(0,1fr))}
.tc-box{position:relative;display:grid;gap:14px;align-content:start;padding:28px;border-radius:var(--tc-r);background:var(--tc-card);border:1px solid var(--tc-line);transition:transform .35s var(--tc-ease),border-color .35s,background .35s;overflow:hidden;isolation:isolate;min-width:0}
.tc-box::before{content:"";position:absolute;inset:0;z-index:-1;opacity:0;transition:opacity .4s;background:radial-gradient(420px 220px at var(--mx,30%) var(--my,0%),rgba(176,32,255,.18),transparent 70%)}
.tc-box:hover{border-color:rgba(210,123,255,.32);transform:translateY(-3px)}
.tc-box:hover::before{opacity:1}
.tc-box p{font-size:15.5px}
.tc-ico{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(140deg,rgba(176,32,255,.28),rgba(176,32,255,.06));box-shadow:inset 0 0 0 1px rgba(210,123,255,.3);color:var(--tc-m2)}
.tc-ico svg{width:24px;height:24px}
.tc-price{display:flex;align-items:baseline;gap:8px;margin-top:4px;padding-top:14px;border-top:1px dashed var(--tc-line2);font-size:14px;color:var(--tc-dim)}
.tc-price b{font-family:var(--tc-display);font-size:22px;font-weight:700;color:var(--tc-fg)!important}
.tc-list{display:grid;gap:9px}
.tc-list li{position:relative;padding-left:26px;font-size:15.5px;color:var(--tc-muted)}
.tc-list li::before{content:"";position:absolute;left:0;top:.45em;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle,var(--tc-m2) 0 3px,transparent 4px),rgba(176,32,255,.18)}
.tc-box .tc-link::before{content:"";position:absolute;inset:0}
/* banda de llamada */
.tc-band{position:relative;overflow:hidden;border-radius:calc(var(--tc-r) + 6px);padding:clamp(28px,4vw,48px);background:linear-gradient(120deg,#2a0b44 0%,#16091f 55%,#0f0b15 100%);border:1px solid rgba(210,123,255,.28);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px 40px;align-items:center;isolation:isolate}
.tc-band::before{content:"";position:absolute;width:520px;height:520px;right:-160px;top:-260px;z-index:-1;background:radial-gradient(circle,rgba(176,32,255,.45),transparent 65%);animation:tc-float 9s ease-in-out infinite alternate}
@keyframes tc-float{to{transform:translate(-60px,40px) scale(1.1)}}
.tc-band h2{font-size:clamp(24px,2.8vw,34px)}
.tc-band p{color:#cdbfda;margin-top:10px;max-width:60ch}
/* cifras */
.tc-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--tc-line);border-radius:var(--tc-r);overflow:hidden;background:var(--tc-card)}
.tc-stats>div{padding:26px 24px;border-left:1px solid var(--tc-line);display:grid;gap:6px;min-width:0}
.tc-stats>div:first-child{border-left:0}
.tc-stats b{font-family:var(--tc-display);font-size:clamp(28px,3.4vw,40px);font-weight:700;line-height:1;color:var(--tc-fg)!important;font-variant-numeric:tabular-nums}
.tc-stats span{font-size:14.5px;color:var(--tc-muted)}
/* pasos */
.tc-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;counter-reset:s}
.tc-step{position:relative;padding:28px;border-radius:var(--tc-r);border:1px solid var(--tc-line);background:linear-gradient(180deg,var(--tc-card),transparent);display:grid;gap:12px;align-content:start;counter-increment:s}
.tc-step::before{content:"Paso " counter(s);font-family:var(--tc-display);font-size:12.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--tc-m2)}
.tc-step__when{font-size:13.5px;color:var(--tc-dim)!important}
/* casos */
.tc-case{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:0;border:1px solid var(--tc-line);border-radius:var(--tc-r);overflow:hidden;background:var(--tc-card)}
.tc-case__side{padding:30px;background:linear-gradient(160deg,rgba(176,32,255,.16),transparent 70%);border-right:1px solid var(--tc-line);display:grid;gap:12px;align-content:start}
.tc-case__main{padding:30px;display:grid;gap:18px;align-content:start}
.tc-case dl{display:grid;gap:14px;margin:0}
.tc-case dt{font-family:var(--tc-display);font-size:12.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--tc-m2)}
.tc .tc-case dd{margin:4px 0 0!important;padding:0!important;color:var(--tc-muted);font-size:15.5px}
.tc-tags{display:flex;flex-wrap:wrap;gap:8px}
.tc-tags span{font-size:12.5px;padding:4px 10px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid var(--tc-line);color:var(--tc-muted)}
/* FAQ */
.tc-faq{display:grid;gap:12px;max-width:900px}
.tc-faq details{border:1px solid var(--tc-line);border-radius:14px;background:var(--tc-card);transition:border-color .3s}
.tc-faq details[open]{border-color:rgba(210,123,255,.3)}
.tc-faq summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;gap:16px;align-items:center;padding:18px 22px;font-family:var(--tc-display);font-weight:600;font-size:17px;color:var(--tc-fg)}
.tc-faq summary::-webkit-details-marker{display:none}
.tc-faq summary::after{content:"+";flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:rgba(176,32,255,.15);color:var(--tc-m2);font-size:18px;transition:transform .3s var(--tc-ease)}
.tc-faq details[open] summary::after{transform:rotate(45deg)}
.tc-faq details p{padding:0 22px 20px;font-size:16px}
/* formularios */
.tc-form{display:grid;gap:14px}
.tc-form__row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.tc-field{display:grid;gap:6px;min-width:0}
.tc-field label{font-family:var(--tc-display);font-size:13.5px;font-weight:500;color:var(--tc-fg)}
.tc .tc-field input,.tc .tc-field select,.tc .tc-field textarea,.tc .tc-inline input{width:100%;padding:13px 15px!important;border-radius:11px!important;border:1px solid var(--tc-line2)!important;background:rgba(255,255,255,.035)!important;color:var(--tc-fg)!important;font:inherit;font-size:15.5px!important;transition:border-color .2s,box-shadow .2s,background .2s;box-shadow:none!important}
.tc .tc-field select option{background:#14111b;color:var(--tc-fg)}
.tc .tc-field input:focus,.tc .tc-field select:focus,.tc .tc-field textarea:focus,.tc .tc-inline input:focus{border-color:var(--tc-m2)!important;background:rgba(176,32,255,.06)!important;box-shadow:0 0 0 4px rgba(176,32,255,.15)!important;outline:none}
.tc .tc-field textarea{min-height:130px;resize:vertical}
.tc .tc-check{font-weight:400!important;font-family:var(--tc-body)!important;color:var(--tc-muted)!important;font-size:14px!important;line-height:1.5!important}.tc-check{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:var(--tc-muted)}
.tc-check input{margin-top:4px;accent-color:var(--tc-m)}
.tc-check a{color:var(--tc-m2)!important;text-decoration:underline}
.tc-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;overflow:hidden}
.tc-msg{display:none;padding:14px 16px;border-radius:12px;font-size:15px}
.tc-msg.is-ok{display:block;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.35);color:#c9f7d8}
.tc-msg.is-err{display:block;background:rgba(255,90,90,.1);border:1px solid rgba(255,90,90,.35);color:#ffd2d2}
.tc-inline{display:flex;gap:10px;flex-wrap:wrap}
.tc-inline input{flex:1 1 240px;min-width:0}
.tc-newsletter{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:32px 56px;align-items:center}
.tc-mail{display:inline-flex;align-items:center;gap:10px;font-family:var(--tc-display);font-weight:600;font-size:clamp(20px,2.4vw,28px);color:var(--tc-fg)!important;border-bottom:2px solid var(--tc-m);padding-bottom:4px;word-break:break-all}
/* cabeceras de página interior */
.tc-pagehead{padding-block:clamp(56px,8vw,96px) clamp(32px,4vw,56px)}
.tc-pagehead .tc-hero__copy{max-width:880px}
.tc-crumbs{display:flex;gap:8px;font-size:13.5px;color:var(--tc-dim)}
.tc-crumbs a:hover{color:var(--tc-m2)}
.tc-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(28px,5vw,72px);align-items:start}
.tc-prose{display:grid;gap:16px}
.tc-prose p{font-size:17px}
.tc-quote{font-family:var(--tc-display);font-size:clamp(20px,2.2vw,26px);line-height:1.4;font-weight:500;color:var(--tc-fg);padding-left:22px;border-left:3px solid var(--tc-m)}
/* archivo de noticias */
.tc-filtros{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:6px}
.tc-filtros::-webkit-scrollbar{display:none}
.tc-filtros a{flex:none;display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:99px;border:1px solid var(--tc-line2);font-family:var(--tc-display);font-size:14px;font-weight:500;color:var(--tc-muted)!important;transition:all .2s;white-space:nowrap}
.tc-filtros a small{font-size:11.5px;color:var(--tc-dim)}
.tc-filtros a:hover{border-color:var(--tc-m2);color:var(--tc-fg)!important}
.tc-filtros a.is-on{background:var(--tc-m);border-color:var(--tc-m);color:#fff!important}
.tc-filtros a.is-on small{color:rgba(255,255,255,.75)}
.tc-rejilla{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.tc-card--wide{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)}
.tc-card--wide .tc-card__media{aspect-ratio:auto;min-height:340px}
.tc-card--wide .tc-card__body{padding:32px;align-content:center;gap:14px}
.tc-card--wide .tc-card__title{font-size:clamp(24px,2.6vw,34px)!important;line-height:1.15!important}
.tc-paginas{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:40px}
.tc-paginas .page-numbers{min-width:44px;height:44px;padding:0 14px;display:inline-grid;place-items:center;border-radius:12px;border:1px solid var(--tc-line2);font-family:var(--tc-display);font-weight:500;color:var(--tc-muted)!important;transition:all .2s}
.tc-paginas a.page-numbers:hover{border-color:var(--tc-m2);color:var(--tc-fg)!important}
.tc-paginas .current{background:var(--tc-m);border-color:var(--tc-m);color:#fff!important}
.tc button.tc-btn,.tc input[type=submit].tc-btn{padding:14px 22px!important;border-radius:12px!important;font-family:var(--tc-display)!important;font-weight:600!important;font-size:15.5px!important;line-height:1!important;color:#fff!important;background:var(--b)!important;height:auto!important;letter-spacing:0!important;text-transform:none!important}
.tc button.tc-btn--ghost{background:rgba(255,255,255,.04)!important}
.tc button.tc-btn:disabled{opacity:.6;cursor:wait}
@media (max-width:900px){.tc-archivo .tc-pagehead .tc-hero__panel{display:none}}
.tc-buscar{max-width:520px}
.tc .tc-buscar input{flex:1 1 220px}
@media (max-width:1000px){.tc-rejilla{grid-template-columns:repeat(2,minmax(0,1fr))}.tc-card--wide{grid-template-columns:minmax(0,1fr)}.tc-card--wide .tc-card__media{min-height:0;aspect-ratio:16/9}}
@media (max-width:620px){.tc-rejilla{grid-template-columns:minmax(0,1fr)}.tc-card--wide .tc-card__body{padding:22px}}
/* ---- piezas v2: marquesina, demo de chat, galería, casos, planes ---- */
.tc-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--tc-ok);margin-right:8px;vertical-align:middle;animation:tc-pulse 2s infinite}
.tc-hero--home{padding-bottom:28px}
.tc-marquee{display:flex;align-items:center;gap:22px;margin-top:clamp(36px,5vw,56px);padding-top:22px;border-top:1px solid var(--tc-line);overflow:hidden}
.tc-marquee__label{flex:none;font-family:var(--tc-display);font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--tc-dim)}
.tc-marquee__track{flex:1;min-width:0;overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.tc-marquee__row{display:flex;gap:40px;width:max-content;animation:tc-scroll 45s linear infinite}
.tc-marquee__row span{font-family:var(--tc-display);font-weight:600;font-size:17px;color:#6f6880;white-space:nowrap;transition:color .2s}
.tc-marquee:hover .tc-marquee__row{animation-play-state:paused}
.tc-marquee__row span:hover{color:var(--tc-fg)}
@keyframes tc-scroll{to{transform:translateX(-50%)}}
.tc-split--center{align-items:center}
.tc-subhead{display:grid;gap:6px;margin:44px 0 16px}
.tc-chips{display:flex;flex-wrap:wrap;gap:10px}
.tc-chips a{padding:10px 16px;border-radius:12px;background:var(--tc-card);border:1px solid var(--tc-line);font-family:var(--tc-display);font-weight:500;font-size:14.5px;color:var(--tc-fg)!important;transition:all .25s var(--tc-ease)}
.tc-chips a:hover{border-color:var(--tc-m2);background:rgba(176,32,255,.12);transform:translateY(-2px)}
.tc-price span{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--tc-dim);margin-right:2px}
.tc-nota{margin-top:16px!important;font-size:14px;color:var(--tc-dim)!important;text-align:center}
/* demo de chat */
.tc-chat{margin:0;border-radius:22px;background:#0f0c14;border:1px solid var(--tc-line2);box-shadow:0 40px 90px -40px rgba(176,32,255,.45),0 0 0 6px rgba(255,255,255,.02);overflow:hidden;max-width:520px;justify-self:center;width:100%}
.tc-chat__top{display:flex;align-items:center;gap:12px;padding:14px 18px;background:rgba(255,255,255,.04);border-bottom:1px solid var(--tc-line)}
.tc-chat__top b{display:block;font-family:var(--tc-display);font-size:15px;color:var(--tc-fg)}
.tc-chat__top small{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--tc-dim)}
.tc-chat__top small i{width:7px;height:7px;border-radius:50%;background:var(--tc-ok)}
.tc-chat__av{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--tc-m),var(--tc-m3));font-family:var(--tc-display);font-weight:700;font-size:13px;color:#fff}
.tc-chat__body{display:flex;flex-direction:column;gap:10px;padding:20px 18px 22px;min-height:340px;background:radial-gradient(400px 200px at 80% 0%,rgba(176,32,255,.08),transparent 70%)}
.tc-chat__m{margin:0!important;max-width:82%;padding:11px 14px;border-radius:16px;font-size:14.5px!important;line-height:1.5!important;animation:tc-msg .5s var(--tc-ease) both;animation-delay:var(--d)}
.tc-chat__m--c{align-self:flex-end;background:linear-gradient(135deg,#7b16c4,#a020f0);color:#fff!important;border-bottom-right-radius:5px}
.tc-chat__m--b{align-self:flex-start;background:rgba(255,255,255,.07);color:var(--tc-fg)!important;border-bottom-left-radius:5px}
.tc-chat__typing{align-self:flex-start;display:flex;gap:4px;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.05);margin:0!important;animation:tc-msg .4s var(--tc-ease) both;animation-delay:var(--d)}
.tc-chat__typing span{width:6px;height:6px;border-radius:50%;background:var(--tc-muted);animation:tc-bounce 1.2s infinite}
.tc-chat__typing span:nth-child(2){animation-delay:.15s}.tc-chat__typing span:nth-child(3){animation-delay:.3s}
.tc-chat figcaption{padding:12px 18px 16px;font-size:12.5px;color:var(--tc-dim);border-top:1px solid var(--tc-line)}
@keyframes tc-msg{from{opacity:0;transform:translateY(10px) scale(.97)}}
@keyframes tc-bounce{0%,60%,100%{transform:none;opacity:.5}30%{transform:translateY(-4px);opacity:1}}
.tc-chat--mini .tc-chat__body{min-height:0}
/* antes / después */
.tc-ad{border:1px solid var(--tc-line);border-radius:var(--tc-r);background:var(--tc-card);overflow:hidden}
.tc-ad__h{display:grid;grid-template-columns:1fr 1fr;padding:12px 20px;font-family:var(--tc-display);font-size:12.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--tc-dim);border-bottom:1px solid var(--tc-line)}
.tc-ad__h span:last-child{color:var(--tc-m2);padding-left:34px}
.tc-ad__row{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;padding:16px 20px;border-top:1px solid var(--tc-line);transition:background .25s}
.tc-ad__row:first-of-type{border-top:0}
.tc-ad__row:hover{background:rgba(176,32,255,.06)}
.tc-ad__antes{font-size:15px!important;color:var(--tc-dim)!important;text-decoration:line-through;text-decoration-color:rgba(255,120,120,.5)}
.tc-ad__despues{font-size:15px!important;color:var(--tc-fg)!important;font-weight:600}
.tc-ad__arrow{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:rgba(176,32,255,.15);color:var(--tc-m2)}
.tc-ad__arrow svg{width:15px;height:15px}
/* sectores */
.tc-sectores{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.tc-sector{display:flex;gap:14px;align-items:flex-start;padding:18px;border-radius:16px;background:var(--tc-card);border:1px solid var(--tc-line);transition:all .3s var(--tc-ease);min-width:0}
.tc-sector:hover{border-color:rgba(210,123,255,.35);transform:translateY(-3px)}
.tc-sector .tc-ico{width:40px;height:40px;flex:none;border-radius:12px}
.tc-sector .tc-ico svg{width:20px;height:20px}
.tc-sector b{display:block;font-family:var(--tc-display);font-weight:600;font-size:15px;color:var(--tc-fg)!important;line-height:1.3}
.tc-sector small{display:block;margin-top:4px;font-size:13px;color:var(--tc-dim);line-height:1.45}
/* problema / solución */
.tc-pc__l{display:inline-block;justify-self:start;padding:3px 10px;border-radius:7px;font-family:var(--tc-display);font-size:11.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;background:rgba(176,32,255,.14);color:var(--tc-m2)}
.tc-pc__l--p{background:rgba(255,110,110,.12);color:#ff9b9b}
.tc-pc p{font-size:15px}
/* capturas en marco de navegador */
.tc-shot{margin:0;border-radius:14px;overflow:hidden;background:#15121b;border:1px solid var(--tc-line2);box-shadow:0 30px 70px -35px rgba(0,0,0,.9),0 0 0 1px rgba(176,32,255,.08)}
.tc-shot__bar{display:flex;gap:6px;padding:9px 12px;background:#1b1722;border-bottom:1px solid var(--tc-line)}
.tc-shot__bar i{width:9px;height:9px;border-radius:50%;background:#3a3344}
.tc-shot__bar i:first-child{background:#ff5f57}.tc-shot__bar i:nth-child(2){background:#febc2e}.tc-shot__bar i:nth-child(3){background:#28c840}
.tc-shot img{display:block;width:100%;height:auto;transition:transform .8s var(--tc-ease)}
.tc-shot:hover img{transform:scale(1.02)}
.tc-shot figcaption{padding:10px 14px;font-size:13px;color:var(--tc-dim)}
.tc-shots{display:grid;position:relative}
.tc-shots>.tc-shot{grid-area:1/1;animation:tc-fade calc(var(--n)*4s) infinite;opacity:0}
.tc-shots>.tc-shot:nth-child(1){animation-delay:0s}.tc-shots>.tc-shot:nth-child(2){animation-delay:4s}.tc-shots>.tc-shot:nth-child(3){animation-delay:8s}
@keyframes tc-fade{0%{opacity:0;transform:translateY(8px)}6%,30%{opacity:1;transform:none}36%,100%{opacity:0}}
.tc-box .tc-shot{margin:-6px -6px 6px}
/* galería en movimiento */
.tc-sec--gal{overflow:hidden}
.tc-gal{overflow:hidden;padding:10px 0 30px;mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
.tc-gal__row{display:flex;gap:22px;width:max-content;animation:tc-scroll 70s linear infinite}
.tc-gal:hover .tc-gal__row{animation-play-state:paused}
.tc-gal__item{position:relative;flex:none;width:clamp(260px,32vw,440px);border-radius:16px;overflow:hidden;border:1px solid var(--tc-line2);background:#15121b;box-shadow:0 26px 60px -30px rgba(0,0,0,.9);transition:transform .45s var(--tc-ease),border-color .3s}
.tc-gal__item img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top}
.tc-gal__item span{position:absolute;left:12px;bottom:12px;padding:7px 12px;border-radius:10px;background:rgba(8,7,11,.82);backdrop-filter:blur(6px);font-family:var(--tc-display);font-size:13.5px;font-weight:600;color:#fff}
.tc-gal__item:hover{transform:translateY(-6px) rotate(-.6deg);border-color:var(--tc-m2)}
/* casos */
.tc-casos{display:grid;gap:clamp(40px,6vw,72px)}
.tc-caso{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:clamp(24px,4vw,56px);align-items:center;scroll-margin-top:110px}
.tc-caso--rev .tc-caso__txt{order:2}
.tc-caso__txt{display:grid;gap:18px;min-width:0}
.tc-caso__vis{min-width:0}
.tc-caso__h{display:flex;gap:16px;align-items:flex-start}
.tc-caso__h .tc-ico{flex:none}
.tc-caso__h h3{font-size:clamp(21px,2.2vw,27px)!important;margin-top:6px!important}
.tc-caso__pc{display:grid;gap:14px}
.tc-caso__pc>div{display:grid;gap:8px;padding:16px 18px;border-radius:14px;background:var(--tc-card);border:1px solid var(--tc-line)}
.tc-caso__pc p{font-size:15.5px}
.tc-caso__p{border-left:3px solid rgba(255,110,110,.55)!important}
.tc-caso__s{border-left:3px solid var(--tc-m)!important}
.tc-caso__r{display:flex;gap:12px;align-items:flex-start}
.tc-caso__r p{color:var(--tc-fg)!important;font-size:15.5px}
.tc-caso__ok{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:rgba(74,222,128,.15);color:var(--tc-ok);font-weight:700;font-size:14px}
.tc-caso__flowbig{padding:28px;border-radius:var(--tc-r);background:linear-gradient(160deg,rgba(176,32,255,.14),transparent 70%),var(--tc-card);border:1px solid var(--tc-line)}
.tc-caso__flowbig .tc-flow{flex-direction:column;align-items:stretch}
.tc-caso__flowbig .tc-flow li{padding:16px 18px;font-size:16px}
.tc-flow{display:flex;flex-wrap:wrap;gap:8px;margin:0!important;padding:0!important;list-style:none!important;counter-reset:f}
.tc-flow li{counter-increment:f;position:relative;display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid var(--tc-line);font-family:var(--tc-display);font-size:13.5px;font-weight:500;color:var(--tc-fg);margin:0!important;list-style:none!important}
.tc-flow li::before{content:counter(f);display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--tc-m);color:#fff;font-size:11px;font-weight:700}
/* planes del boletín */
.tc-planes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;align-items:stretch}
.tc-plan{position:relative;display:grid;gap:14px;align-content:start;padding:28px;border-radius:var(--tc-r);background:var(--tc-card);border:1px solid var(--tc-line);transition:transform .35s var(--tc-ease),border-color .3s}
.tc-plan:hover{transform:translateY(-4px);border-color:rgba(210,123,255,.35)}
.tc-plan--pro{background:linear-gradient(170deg,rgba(176,32,255,.2),rgba(176,32,255,.03) 60%),var(--tc-card);border-color:rgba(210,123,255,.45);box-shadow:0 30px 70px -40px var(--tc-glow)}
.tc-plan__tag{justify-self:start;padding:4px 11px;border-radius:99px;font-family:var(--tc-display);font-size:11.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;background:rgba(255,255,255,.07);color:var(--tc-muted)}
.tc-plan--pro .tc-plan__tag{background:var(--tc-m);color:#fff}
.tc-plan__precio{font-size:15px;color:var(--tc-dim)!important}
.tc-plan__precio b{font-family:var(--tc-display);font-size:42px;font-weight:700;color:var(--tc-fg)!important;letter-spacing:-.02em}
.tc-plan .tc-btn{justify-self:start;margin-top:6px}
@media (max-width:1100px){.tc-sectores{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:900px){.tc-caso,.tc-planes{grid-template-columns:minmax(0,1fr)}.tc-caso--rev .tc-caso__txt{order:0}}
@media (max-width:620px){.tc-sectores{grid-template-columns:minmax(0,1fr)}.tc-ad__row{grid-template-columns:minmax(0,1fr);gap:6px}.tc-ad__arrow{transform:rotate(90deg)}.tc-ad__h{display:none}.tc-marquee{flex-direction:column;align-items:flex-start;gap:10px}.tc-marquee__track{width:100%}}
@media (prefers-reduced-motion:reduce){.tc-shots>.tc-shot{animation:none!important;opacity:0}.tc-shots>.tc-shot:first-child{opacity:1}.tc-gal__row,.tc-marquee__row{animation:none!important}}
/* cabecera de portada v3 */
body.tc-landing .tc .tc-lead .tc-lead__k{font-size:1.08em;display:block;margin-bottom:6px;font-family:var(--tc-display);font-weight:600;color:var(--tc-fg)!important}
.tc .tc-h1-home{font-size:clamp(32px,4.3vw,56px);line-height:1.06}
.tc-h1-home span{display:block}
.tc-shine{background-size:200% auto!important;animation:tc-shine 6s linear infinite}
@keyframes tc-shine{to{background-position:200% center}}
.tc-perfiles{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.tc-perfil{display:grid;gap:4px;padding:14px 16px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid var(--tc-line);transition:border-color .3s,background .3s}
.tc-perfil:hover{border-color:rgba(210,123,255,.4);background:rgba(176,32,255,.07)}
.tc-perfil b{font-family:var(--tc-display);font-size:15px;color:var(--tc-fg)!important}
.tc-perfil span{font-size:14px;line-height:1.5;color:var(--tc-muted)}
.tc-ruta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;position:relative}
.tc-ruta::before{content:"";position:absolute;left:8%;right:8%;top:52px;height:2px;background:linear-gradient(90deg,transparent,var(--tc-m),var(--tc-m2),var(--tc-m),transparent);background-size:200% 100%;animation:tc-shine 4s linear infinite;opacity:.6;z-index:0}
.tc-ruta__paso{position:relative;z-index:1;display:grid;gap:12px;justify-items:start;padding:26px;border-radius:var(--tc-r);background:var(--tc-card);border:1px solid var(--tc-line);transition:transform .35s var(--tc-ease),border-color .3s}
.tc-ruta__paso:hover{transform:translateY(-4px);border-color:rgba(210,123,255,.35)}
.tc-ruta__n{position:absolute;top:18px;right:22px;font-family:var(--tc-display);font-weight:700;font-size:34px;color:rgba(255,255,255,.06)}
@media (max-width:900px){.tc-ruta{grid-template-columns:minmax(0,1fr)}.tc-ruta::before{display:none}}
@media (max-width:620px){.tc-perfiles{grid-template-columns:minmax(0,1fr)}}
/* panel de datos en cabeceras interiores */
.tc-facts{display:grid;margin:0}
.tc-facts>div{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:13px 0;border-top:1px solid var(--tc-line)}
.tc-facts>div:first-child{border-top:0}
.tc .tc-facts dt{font-size:14.5px;color:var(--tc-muted);margin:0;font-weight:400}
.tc .tc-facts dd{margin:0!important;font-family:var(--tc-display);font-weight:600;font-size:16px;color:var(--tc-fg);text-align:right}
.tc-facts a{color:var(--tc-fg)}.tc-facts a:hover{color:var(--tc-m2)}
.tc-pagehead .tc-hero__grid{align-items:center}
/* animación de entrada (solo si el navegador la soporta; el contenido es visible igualmente) */
@supports (animation-timeline:view()){
  .tc-reveal{animation:tc-in linear both;animation-timeline:view();animation-range:entry 0% entry 38%}
  @keyframes tc-in{from{opacity:.001;transform:translateY(28px)}}
}
.tc-hero .tc-hero__copy>*{animation:tc-up .8s var(--tc-ease) both}
.tc-hero .tc-hero__copy>*:nth-child(2){animation-delay:.06s}.tc-hero .tc-hero__copy>*:nth-child(3){animation-delay:.12s}.tc-hero .tc-hero__copy>*:nth-child(4){animation-delay:.18s}.tc-hero .tc-hero__copy>*:nth-child(5){animation-delay:.24s}
.tc-hero__panel{animation:tc-up .9s .2s var(--tc-ease) both}
@keyframes tc-up{from{opacity:0;transform:translateY(18px)}}
@media (prefers-reduced-motion:reduce){.tc *,.tc *::before,.tc *::after{animation:none!important;transition:none!important}}
/* responsive */
@media (max-width:1100px){.tc-fila{grid-template-columns:repeat(2,minmax(0,1fr))}.tc-grid--4{grid-template-columns:repeat(2,minmax(0,1fr))}.tc-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.tc-stats>div:nth-child(3){border-left:0}.tc-stats>div:nth-child(n+3){border-top:1px solid var(--tc-line)}}
@media (max-width:900px){.tc-hero__grid,.tc-destacadas,.tc-split,.tc-newsletter,.tc-case{grid-template-columns:minmax(0,1fr)}.tc-grid--3,.tc-steps{grid-template-columns:minmax(0,1fr)}.tc-case__side{border-right:0;border-bottom:1px solid var(--tc-line)}.tc-band{grid-template-columns:minmax(0,1fr)}}
@media (max-width:620px){.tc{font-size:16px}.tc-fila{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-inline:clamp(18px,4vw,40px);gap:14px;margin-inline:calc(-1*clamp(18px,4vw,40px));padding:4px clamp(18px,4vw,40px) 14px;scrollbar-width:none}.tc-fila::-webkit-scrollbar{display:none}.tc-fila>.tc-card{flex:0 0 82%;scroll-snap-align:start}.tc-fila>.tc-card:hover{transform:none}
.tc-grid--2,.tc-grid--2,.tc-grid--4,.tc-form__row{grid-template-columns:minmax(0,1fr)}.tc-card--row .tc-card__media{width:34%}.tc-box,.tc-step,.tc-case__side,.tc-case__main{padding:22px}.tc-stats{grid-template-columns:minmax(0,1fr)}.tc-stats>div{border-left:0!important;border-top:1px solid var(--tc-line)}.tc-stats>div:first-child{border-top:0}}

/* ---- cabecera del tema: menú y botón ---- */
#header-outer #top nav>ul>li>a,#header-outer .sf-menu li a,#slide-out-widget-area .menu li a{font-family:var(--tc-display)!important;font-weight:500!important;text-transform:none!important}
#header-outer #top nav>ul>li.tc-menu-cta>a{padding:0!important}
#header-outer #top nav>ul>li.tc-menu-cta>a .menu-title-text{display:inline-block;padding:10px 18px;border-radius:10px;background:var(--tc-m);color:#fff!important;box-shadow:0 8px 24px -10px var(--tc-glow);transition:transform .2s,box-shadow .2s}
#header-outer #top nav>ul>li.tc-menu-cta>a:hover .menu-title-text{transform:translateY(-1px);box-shadow:0 12px 30px -10px var(--tc-glow)}
#header-outer #top nav>ul>li.tc-menu-cta>a::after,#header-outer #top nav>ul>li.tc-menu-cta>a .menu-title-text::after{display:none!important}
#header-outer .sf-menu .sub-menu{border-radius:12px!important;overflow:hidden;box-shadow:0 24px 60px -20px rgba(0,0,0,.8)!important}
#footer-outer{display:none!important}

/* ---- pie común ---- */
.tc-footer{position:relative;z-index:5;background:#060509;color:var(--tc-muted);border-top:1px solid var(--tc-line);font-family:var(--tc-body);font-size:15px;line-height:1.6}
.tc-footer *{box-sizing:border-box}
.tc-footer a{color:var(--tc-muted)!important;text-decoration:none;transition:color .2s}
.tc-footer a:hover{color:var(--tc-m2)!important}
.tc-footer__top{display:grid;grid-template-columns:minmax(0,1.4fr) repeat(3,minmax(0,1fr));gap:40px;padding-block:64px 48px}
.tc-footer h4{font-family:var(--tc-display);font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--tc-fg)!important;margin:0 0 16px}
.tc-footer ul{list-style:none;margin:0;padding:0;display:grid;gap:9px}
.tc-footer__brand{display:grid;gap:16px;align-content:start}
.tc-footer__brand img{width:220px;height:auto}
.tc-footer__brand p{margin:0;max-width:40ch}
.tc-footer__mail{font-family:var(--tc-display);font-weight:600;color:var(--tc-fg)!important;font-size:17px}
.tc-footer__bottom{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;padding-block:22px;border-top:1px solid var(--tc-line);font-size:13.5px;color:var(--tc-dim)}
@media (max-width:900px){.tc-footer__top{grid-template-columns:repeat(2,minmax(0,1fr))}.tc-footer__brand{grid-column:1/-1}}
@media (max-width:520px){.tc-footer__top{grid-template-columns:minmax(0,1fr)}}

/* ---- barra de progreso de lectura (solo CSS, navegadores modernos) ---- */
@supports (animation-timeline:scroll()){body.single-post::before{content:"";position:fixed;top:0;left:0;right:0;height:3px;z-index:100000;background:linear-gradient(90deg,#6d0fb0,#b020ff,#d27bff);transform-origin:0 50%;transform:scaleX(0);animation:tc-prog linear both;animation-timeline:scroll(root)}@keyframes tc-prog{to{transform:scaleX(1)}}}
/* ---- llamada al final de cada artículo ---- */
.tc-cta-post{margin:40px 0 8px;padding:28px;border-radius:18px;background:linear-gradient(120deg,#2a0b44,#120a1a);color:#e9dff2;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px 28px;align-items:center;font-family:var(--tc-body)}
.tc-cta-post>div{display:grid;gap:8px}body.single-post .content-inner .tc-cta-post p{padding:0!important;line-height:1.55!important}.tc-cta-post p{margin:0!important;color:#cdbfda!important;font-size:16px!important}
.tc-cta-post .tc-cta-post__t{font-family:var(--tc-display);font-size:21px!important;font-weight:600;color:#fff!important;margin-bottom:6px!important}
body.single-post .content-inner .tc-cta-post a.tc-cta-post__b{display:inline-block;padding:13px 20px;border-radius:11px;background:#b020ff;color:#fff!important;font-family:var(--tc-display);font-weight:600;background-image:none;white-space:nowrap;transition:transform .2s}
body.single-post .content-inner .tc-cta-post a.tc-cta-post__b:hover{transform:translateY(-2px);color:#fff!important}
body.single-post .tca-autor .tca-autor__titulo,body.single-post .tca-autor .tca-autor__cta{display:none!important}body.single-post .tca-autor .tca-autor__bio{margin-bottom:0!important}
@media (max-width:640px){.tc-cta-post{grid-template-columns:minmax(0,1fr)}}
</style>
	<?php
}, 20 );

/* Brillo que sigue al ratón en las tarjetas de servicio y envío de formularios (JS mínimo) */
add_action( 'wp_footer', function () {
	?>
<script id="tc-web-js">
(function(){
  document.addEventListener('pointermove',function(e){var b=e.target.closest&&e.target.closest('.tc-box');if(!b)return;var r=b.getBoundingClientRect();b.style.setProperty('--mx',(e.clientX-r.left)+'px');b.style.setProperty('--my',(e.clientY-r.top)+'px');},{passive:true});
  var URL='https://paneln8n.transformaconia.com/webhook/web-transformaconia';
  document.addEventListener('submit',function(e){
    var f=e.target; if(!f.matches||!f.matches('form[data-tc-form]'))return; e.preventDefault();
    var msg=f.querySelector('.tc-msg'), btn=f.querySelector('button[type=submit]'), txt=btn?btn.innerHTML:'';
    var d=new URLSearchParams(new FormData(f)); d.set('tipo',f.getAttribute('data-tc-form')); d.set('origen',location.href);
    if(btn){btn.disabled=true;btn.innerHTML='Enviando…';}
    fetch(URL,{method:'POST',body:d}).then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(){
      msg.className='tc-msg is-ok'; msg.textContent=f.getAttribute('data-ok'); f.reset();
      if(window.gtag)gtag('event','generate_lead',{tipo:f.getAttribute('data-tc-form')});
    }).catch(function(){msg.className='tc-msg is-err'; msg.textContent='No se ha podido enviar. Escríbenos a info@transformaconia.com y te respondemos igual.';})
    .finally(function(){if(btn){btn.disabled=false;btn.innerHTML=txt;}});
  });
  // fecha y «hace X» calculados al visitar (la página puede venir de la caché)
  var hoy=document.querySelectorAll('[data-tc-hoy]');if(hoy.length){var f=new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',timeZone:'Europe/Madrid'});hoy.forEach(function(e){e.textContent=f;});}
  document.querySelectorAll('[data-tc-hace]').forEach(function(e){var t=Date.parse(e.getAttribute('data-tc-hace'));if(!t)return;var d=(Date.now()-t)/1000,x;
    if(d<3600)x='hace '+Math.max(1,Math.floor(d/60))+' min';else if(d<86400)x='hace '+Math.floor(d/3600)+' h';else if(d<172800)x='ayer';else if(d<604800)x='hace '+Math.floor(d/86400)+' días';else x=new Date(t).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/Madrid'});e.textContent=x;});
  var q=new URLSearchParams(location.search).get('estado'), m=document.getElementById('tc-estado');
  if(q&&m){var t={ok:['is-ok','¡Listo! Suscripción confirmada. El próximo lunes recibirás tu primer boletín.'],baja:['is-ok','Te has dado de baja. No recibirás más correos del boletín.'],error:['is-err','El enlace no es válido o ha caducado. Vuelve a apuntarte con tu correo.']}[q];if(t){m.className='tc-msg '+t[0];m.textContent=t[1];}}
})();
</script>
	<?php
}, 30 );

/* ---------- 4. Pie común ---------- */
add_action( 'get_footer', function () {
	$logo = 'https://transformaconia.com/wp-content/uploads/2026/10/transforma-con-ia-logo-v2.png';
	$u    = function ( $s ) {
		return esc_url( home_url( $s ) );
	};
	?>
<footer class="tc-footer" role="contentinfo">
 <div class="tc-wrap">
  <div class="tc-footer__top">
   <div class="tc-footer__brand">
    <a href="<?php echo $u( '/' ); ?>"><img src="<?php echo esc_url( $logo ); ?>" alt="Transforma con IA" width="220" height="35" loading="lazy"></a>
    <p>Noticias de inteligencia artificial explicadas para empresas y una agencia de IA que las pone a trabajar: automatizaciones, asistentes y herramientas a medida.</p>
    <a class="tc-footer__mail" href="mailto:info@transformaconia.com">info@transformaconia.com</a>
    <p>Equipo en Murcia · Trabajamos en remoto en toda España</p>
   </div>
   <div><h4>Leer</h4><ul>
    <li><a href="<?php echo $u( '/blog/' ); ?>">Todas las noticias</a></li>
    <li><a href="<?php echo $u( '/category/noticias-ia/' ); ?>">Noticias de IA</a></li>
    <li><a href="<?php echo $u( '/category/guias-ia/' ); ?>">Guías prácticas</a></li>
    <li><a href="<?php echo $u( '/category/servicios-y-herramientas-de-ia/' ); ?>">Herramientas de IA</a></li>
    <li><a href="<?php echo $u( '/category/automatizacion/' ); ?>">Automatización y agentes</a></li>
    <li><a href="<?php echo $u( '/category/sobre-la-ia/' ); ?>">IA en la empresa</a></li>
    <li><a href="<?php echo $u( '/boletin/' ); ?>">Boletín semanal</a></li>
   </ul></div>
   <div><h4>Soluciones</h4><ul>
    <li><a href="<?php echo $u( '/automatizacion-procesos-ia/' ); ?>">Automatización de procesos</a></li>
    <li><a href="<?php echo $u( '/agentes-chatbots-ia/' ); ?>">Agentes y chatbots de IA</a></li>
    <li><a href="<?php echo $u( '/desarrollo-a-medida-ia/' ); ?>">Herramientas a medida</a></li>
    <li><a href="<?php echo $u( '/gestion/' ); ?>">Programa de gestión con IA</a></li>
    <li><a href="<?php echo $u( '/contenido-automatico-ia/' ); ?>">Noticias y páginas automáticas</a></li>
    <li><a href="<?php echo $u( '/sectores-industriales/' ); ?>">IA para la industria</a></li>
   </ul></div>
   <div><h4>Transforma con IA</h4><ul>
    <li><a href="<?php echo $u( '/casos/' ); ?>">Casos de éxito</a></li>
    <li><a href="<?php echo $u( '/soluciones/' ); ?>">Cómo trabajamos y precios</a></li>
    <li><a href="<?php echo $u( '/quienes-somos/' ); ?>">Quiénes somos</a></li>
    <li><a href="<?php echo $u( '/consultor-ia-murcia/' ); ?>">Agencia de IA en Murcia</a></li>
    <li><a href="<?php echo $u( '/contacto/' ); ?>">Contacto</a></li>
    <li><a href="<?php echo $u( '/privacidad/' ); ?>">Privacidad</a></li>
   </ul></div>
  </div>
  <div class="tc-footer__bottom">
   <span>© <?php echo esc_html( gmdate( 'Y' ) ); ?> Transforma con IA</span>
   <span>Noticias revisadas cada mañana · Hecho en Murcia</span>
  </div>
 </div>
</footer>
	<?php
}, 1 );

/* ---------- 5. Llamada a la acción al final de cada artículo ---------- */
add_filter( 'the_content', function ( $c ) {
	if ( ! is_singular( 'post' ) || ! in_the_loop() || ! is_main_query() ) {
		return $c;
	}
	$cta = '<div class="tc-cta-post"><div><p class="tc-cta-post__t">¿Te gustaría aplicar esto en tu empresa?</p><p>Cuéntanos qué tarea os quita más tiempo y te decimos, sin compromiso, qué se puede automatizar y cuánto costaría.</p></div><a class="tc-cta-post__b" href="' . esc_url( home_url( '/contacto/' ) ) . '">Diagnóstico gratis →</a></div>';
	if ( false !== strpos( $c, '<aside class="tca-autor"' ) ) {
		return str_replace( '<aside class="tca-autor"', $cta . '<aside class="tca-autor"', $c );
	}
	return $c . $cta;
}, 30 );

/* ---------- 6. Textos del tema en español ---------- */
add_filter( 'gettext', function ( $t, $orig, $dom ) {
	static $mapa = array(
		'Read More'                          => 'Leer más',
		'Read more'                          => 'Leer más',
		'Next'                               => 'Siguiente',
		'Previous'                           => 'Anterior',
		'Skip to main content'               => 'Saltar al contenido',
		'Search'                             => 'Buscar',
		'Hit enter to search or ESC to close' => 'Pulsa Intro para buscar o Esc para cerrar',
		'Close Search'                       => 'Cerrar búsqueda',
		'Menu'                               => 'Menú',
		'Close Menu'                         => 'Cerrar menú',
		'Navigation'                         => 'Navegación',
		'Start Typing'                       => 'Escribe para buscar',
		'Related Posts'                      => 'Artículos relacionados',
		'Older Entries'                      => 'Anteriores',
		'Newer Entries'                      => 'Más recientes',
		'Back to top'                        => 'Volver arriba',
	);
	if ( ( 'salient' === $dom || 'salient-core' === $dom ) && isset( $mapa[ $orig ] ) ) {
		return $mapa[ $orig ];
	}
	return $t;
}, 20, 3 );

/* ---------- 6b. Páginas antiguas fuera del índice de Google ---------- */
add_filter( 'rank_math/frontend/robots', function ( $r ) {
	if ( is_page( array( 'auditoria', 'xperto-industrial', 'gestoria-tu-gestor-de-documentos', 'app-transforma-note' ) ) ) {
		$r['index'] = 'noindex';
		$r['follow'] = 'follow';
	}
	return $r;
} );
add_filter( 'rank_math/sitemap/entry', function ( $url, $type, $obj ) {
	if ( 'post' === $type && is_object( $obj ) && isset( $obj->ID ) && in_array( (int) $obj->ID, array( 6344, 6320, 6332, 6355 ), true ) ) {
		return false;
	}
	return $url;
}, 10, 3 );

/* ---------- 7. Datos estructurados de la marca (Rank Math) ---------- */
add_filter( 'rank_math/json_ld', function ( $data ) {
	$org = home_url( '/#organization' );
	$data['TcServicio'] = array(
		'@type'       => array( 'ProfessionalService', 'Organization' ),
		'@id'         => home_url( '/#servicio' ),
		'name'        => 'Transforma con IA',
		'url'         => home_url( '/' ),
		'logo'        => 'https://transformaconia.com/wp-content/uploads/2026/10/transforma-con-ia-logo-v2.png',
		'image'       => 'https://transformaconia.com/wp-content/uploads/2026/10/transforma-con-ia-icono-v2.png',
		'email'       => 'info@transformaconia.com',
		'description' => 'Medio de noticias de inteligencia artificial para empresas y agencia de IA y automatización con base en Murcia: automatizaciones, agentes de IA, chatbots, herramientas a medida y contenido automático para pymes e industria de toda España.',
		'address'     => array( '@type' => 'PostalAddress', 'addressLocality' => 'Murcia', 'addressRegion' => 'Región de Murcia', 'addressCountry' => 'ES' ),
		'areaServed'  => array( '@type' => 'Country', 'name' => 'España' ),
		'priceRange'  => '€€',
		'knowsAbout'  => array( 'Inteligencia artificial', 'Automatización de procesos', 'Agentes de IA', 'Chatbots', 'n8n', 'OpenAI', 'Claude', 'ERP' ),
		'hasOfferCatalog' => array(
			'@type'           => 'OfferCatalog',
			'name'            => 'Soluciones de IA para empresas',
			'itemListElement' => array(
				array( '@type' => 'Offer', 'itemOffered' => array( '@type' => 'Service', 'name' => 'Automatización de procesos con IA', 'url' => home_url( '/automatizacion-procesos-ia/' ) ), 'priceSpecification' => array( '@type' => 'PriceSpecification', 'minPrice' => 450, 'priceCurrency' => 'EUR' ) ),
				array( '@type' => 'Offer', 'itemOffered' => array( '@type' => 'Service', 'name' => 'Agentes y chatbots de IA', 'url' => home_url( '/agentes-chatbots-ia/' ) ), 'priceSpecification' => array( '@type' => 'PriceSpecification', 'minPrice' => 900, 'priceCurrency' => 'EUR' ) ),
				array( '@type' => 'Offer', 'itemOffered' => array( '@type' => 'Service', 'name' => 'Herramientas a medida con IA', 'url' => home_url( '/desarrollo-a-medida-ia/' ) ), 'priceSpecification' => array( '@type' => 'PriceSpecification', 'minPrice' => 2500, 'priceCurrency' => 'EUR' ) ),
				array( '@type' => 'Offer', 'itemOffered' => array( '@type' => 'Service', 'name' => 'Programa de gestión (ERP) con IA', 'url' => home_url( '/gestion/' ) ), 'priceSpecification' => array( '@type' => 'PriceSpecification', 'minPrice' => 690, 'priceCurrency' => 'EUR' ) ),
				array( '@type' => 'Offer', 'itemOffered' => array( '@type' => 'Service', 'name' => 'Noticias y páginas automáticas con IA', 'url' => home_url( '/contenido-automatico-ia/' ) ), 'priceSpecification' => array( '@type' => 'PriceSpecification', 'minPrice' => 600, 'priceCurrency' => 'EUR' ) ),
			),
		),
	);
	// el nodo principal de Rank Math (Person+Organization) pasa a ser la empresa, con los datos completos
	foreach ( $data as $k => $nodo ) {
		if ( is_array( $nodo ) && isset( $nodo['@id'] ) && home_url( '/#person' ) === $nodo['@id'] && isset( $data['TcServicio'] ) ) {
			$extra = $data['TcServicio'];
			unset( $extra['@id'] );
			$data[ $k ] = array_merge( $nodo, $extra );
			unset( $data['TcServicio'] );
		}
		
	}
	// el autor nunca expone el correo personal
	foreach ( $data as $k => $nodo ) {
		if ( is_array( $nodo ) && isset( $nodo['@type'] ) && 'Person' === $nodo['@type'] && isset( $nodo['name'] ) && false !== strpos( $nodo['name'], '@' ) ) {
			$data[ $k ]['name'] = 'Transforma con IA';
		}
	}
	// FAQ declaradas en la propia página (<script type="application/json" class="tc-faq-data">)
	if ( is_singular( 'page' ) ) {
		$p = get_post();
		if ( $p && preg_match( '#<script type="application/json" class="tc-faq-data">(.*?)</script>#s', $p->post_content, $m ) ) {
			$faq = json_decode( $m[1], true );
			if ( is_array( $faq ) ) {
				$data['TcFaq'] = array(
					'@type'      => 'FAQPage',
					'mainEntity' => array_map( function ( $q ) {
						return array( '@type' => 'Question', 'name' => $q[0], 'acceptedAnswer' => array( '@type' => 'Answer', 'text' => $q[1] ) );
					}, $faq ),
				);
			}
		}
	}
	return $data;
}, 99 );

/* Las páginas no son noticias: fuera el NewsArticle que Rank Math añade por defecto (va después del resto) */
add_filter( 'rank_math/json_ld', function ( $data ) {
	if ( is_page() ) {
		foreach ( $data as $k => $nodo ) {
			if ( is_array( $nodo ) && isset( $nodo['@id'] ) && false !== strpos( $nodo['@id'], '#richSnippet' ) ) {
				unset( $data[ $k ] );
			}
		}
	}
	return $data;
}, 9999 );

/* ---------- 8. Vaciar la caché de LiteSpeed desde la API (solo administradores) ---------- */
add_action( 'rest_api_init', function () {
	register_rest_route( 'tc/v1', '/purgar', array(
		'methods'             => 'POST',
		'permission_callback' => function () {
			return current_user_can( 'manage_options' );
		},
		'callback'            => function () {
			do_action( 'litespeed_purge_all' );
			return array( 'ok' => true );
		},
	) );
} );

/* ---------- 9. Archivo de noticias, categorías, etiquetas, autor y búsqueda con el diseño propio ---------- */
function tc_es_archivo() {
	return ! is_admin() && ( is_home() || is_category() || is_tag() || is_author() || is_search() );
}
add_action( 'pre_get_posts', function ( $q ) {
	if ( ! is_admin() && $q->is_main_query() && ( $q->is_home() || $q->is_category() || $q->is_tag() || $q->is_author() || $q->is_search() ) ) {
		$q->set( 'posts_per_page', 12 );
		if ( $q->is_search() ) {
			$q->set( 'post_type', 'post' );
		}
	}
} );
add_filter( 'body_class', function ( $cl ) {
	if ( tc_es_archivo() ) {
		$cl[] = 'tc-landing';
		$cl[] = 'tc-archivo';
	}
	return $cl;
} );
add_action( 'template_redirect', function () {
	if ( ! tc_es_archivo() ) {
		return;
	}
	global $wp_query;
	$pag    = max( 1, (int) get_query_var( 'paged' ) );
	$obj    = get_queried_object();
	$blog   = home_url( '/blog/' );
	$eb     = 'Noticias';
	$h1     = 'Noticias de inteligencia artificial para empresas';
	$lead   = 'Todo lo que publicamos: actualidad, guías prácticas, herramientas y casos de IA aplicada a la empresa, revisado cada mañana.';
	$crumb  = '<span>Noticias</span>';
	$activa = 0;
	if ( is_category() ) {
		$eb     = 'Categoría';
		$h1     = single_cat_title( '', false );
		$lead   = wp_strip_all_tags( category_description() );
		$crumb  = '<a href="' . esc_url( $blog ) . '">Noticias</a><span aria-hidden="true">/</span><span>' . esc_html( $h1 ) . '</span>';
		$activa = $obj->term_id;
	} elseif ( is_tag() ) {
		$eb    = 'Tema';
		$h1    = single_tag_title( '', false );
		$lead  = 'Artículos sobre ' . $h1 . ' publicados en Transforma con IA.';
		$crumb = '<a href="' . esc_url( $blog ) . '">Noticias</a><span aria-hidden="true">/</span><span>' . esc_html( $h1 ) . '</span>';
	} elseif ( is_author() ) {
		$eb    = 'Autor';
		$h1    = $obj->display_name;
		$lead  = $obj->description ? $obj->description : 'Artículos de ' . $h1 . '.';
		$crumb = '<span>Autor</span>';
	} elseif ( is_search() ) {
		$eb    = 'Búsqueda';
		$h1    = 'Resultados para «' . get_search_query() . '»';
		$lead  = $wp_query->found_posts ? $wp_query->found_posts . ' artículos encontrados.' : 'No hemos encontrado artículos con esa búsqueda. Prueba con otras palabras o mira las categorías.';
		$crumb = '<span>Búsqueda</span>';
	}
	if ( $pag > 1 ) {
		$lead = 'Página ' . $pag . ' de ' . max( 1, (int) $wp_query->max_num_pages ) . '. ' . $lead;
	}
	get_header();
	echo '<div class="tc">';
	echo '<header class="tc-hero tc-pagehead"><div class="tc-wrap tc-hero__grid"><div class="tc-hero__copy">';
	echo '<nav class="tc-crumbs" aria-label="Migas"><a href="' . esc_url( home_url( '/' ) ) . '">Inicio</a><span aria-hidden="true">/</span>' . $crumb . '</nav>';
	echo '<span class="tc-eyebrow">' . esc_html( $eb ) . '</span><h1>' . esc_html( $h1 ) . '</h1>';
	if ( $lead ) {
		echo '<p class="tc-lead">' . esc_html( $lead ) . '</p>';
	}
	echo '<form class="tc-inline tc-buscar" role="search" action="' . esc_url( home_url( '/' ) ) . '"><input type="search" name="s" value="' . esc_attr( get_search_query() ) . '" placeholder="Buscar en el blog…" aria-label="Buscar en el blog"><button class="tc-btn tc-btn--ghost" type="submit">Buscar</button></form>';
	echo '</div><aside class="tc-hero__panel"><div class="tc-hero__panel-h"><span>Lo mejor, cada lunes</span></div><p style="margin:4px 0 16px">El boletín semanal con las noticias de IA que importan a una empresa. Cinco minutos de lectura, gratis.</p><a class="tc-btn" href="' . esc_url( home_url( '/boletin/' ) ) . '">Suscribirme</a></aside></div></header>';
	echo '<nav class="tc-wrap tc-filtros" aria-label="Categorías"><a class="' . ( is_home() ? 'is-on' : '' ) . '" href="' . esc_url( $blog ) . '">Todo</a>';
	foreach ( get_categories( array( 'hide_empty' => true, 'orderby' => 'count', 'order' => 'DESC' ) ) as $c ) {
		echo '<a class="' . ( $activa === $c->term_id ? 'is-on' : '' ) . '" href="' . esc_url( get_category_link( $c ) ) . '">' . esc_html( $c->name ) . '</a>';
	}
	echo '</nav>';
	echo '<section class="tc-sec tc-sec--tight"><div class="tc-wrap">';
	if ( have_posts() ) {
		echo '<div class="tc-rejilla">';
		$i = 0;
		while ( have_posts() ) {
			the_post();
			$ancha = ( 0 === $i && 1 === $pag );
			echo tc_tarjeta( get_post(), $ancha ? 'tc-card--wide' : '', $ancha ? 'large' : 'medium_large', $ancha ? 40 : 20, $i < 3 );
			$i++;
		}
		echo '</div>';
		$links = paginate_links( array( 'type' => 'array', 'prev_text' => '← Anteriores', 'next_text' => 'Siguientes →', 'mid_size' => 1 ) );
		if ( $links ) {
			echo '<nav class="tc-paginas" aria-label="Páginas">' . implode( '', $links ) . '</nav>';
		}
	} else {
		echo '<p class="tc-lead">Todavía no hay artículos aquí.</p>';
	}
	echo '</div></section>';
	echo '<section class="tc-sec tc-sec--tight"><div class="tc-wrap"><div class="tc-band"><div><h2>¿Quieres aplicar la IA en tu empresa?</h2><p>Cuéntanos qué tarea os quita más tiempo y en 30 minutos sabrás qué se puede automatizar y cuánto costaría.</p></div><div class="tc-btns"><a class="tc-btn" href="' . esc_url( home_url( '/contacto/' ) ) . '">Pide tu diagnóstico gratis</a></div></div></div></section>';
	echo '</div>';
	get_footer();
	exit;
}, 20 );

/* ---------- 10. Logo del tema (Salient/Redux) desde la API (solo administradores) ---------- */
add_action( 'rest_api_init', function () {
	register_rest_route( 'tc/v1', '/logo', array(
		array(
			'methods'             => 'GET',
			'permission_callback' => function () {
				return current_user_can( 'manage_options' );
			},
			'callback'            => function () {
				$o   = get_option( 'salient_redux', array() );
				$out = array();
				foreach ( (array) $o as $k => $v ) {
					if ( false !== stripos( $k, 'logo' ) || false !== stripos( $k, 'favicon' ) ) {
						$out[ $k ] = $v;
					}
				}
				return $out;
			},
		),
		array(
			'methods'             => 'POST',
			'permission_callback' => function () {
				return current_user_can( 'manage_options' );
			},
			'callback'            => function ( $req ) {
				$o = get_option( 'salient_redux', array() );
				foreach ( (array) $req->get_json_params() as $k => $v ) {
					$o[ sanitize_key( $k ) ] = $v;
				}
				update_option( 'salient_redux', $o );
				return array( 'ok' => true );
			},
		),
	) );
} );
