/*
 * Transforma con IA · diseño de la web (portada, soluciones, casos, contacto) sobre el tema Salient.
 * - Las páginas cuyo contenido empieza por <!--tc--> usan el diseño propio (clase tc-landing, sin wpautop).
 * - Shortcodes de noticias dinámicas: [tc_ticker], [tc_destacadas], [tc_categoria], [tc_contador], [tc_fecha].
 * - Pie común, CTA bajo cada artículo, textos del tema en español y datos estructurados de la marca.
 * Fuente: wordpress/web-transformaconia.php (repo Experto en SEO). Desplegar con node n8n/web-snippet.mjs
 */

/* Enlace de la demo del programa (cambiar solo aquí cuando exista demo.transformaconia.com; en n8n/web-paginas.mjs vive DEMO_URL) */
if ( ! defined( 'TC_DEMO_URL' ) ) {
	define( 'TC_DEMO_URL', 'https://demo.transformaconia.com/' );
}

/* ---------- 0. Verificación de Google Search Console (archivo HTML; no borrar nunca) ---------- */
add_action( 'init', function () {
	$ruta = strtok( isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '', '?' );
	if ( '/googlec17d4028eb35f0ab.html' === $ruta ) {
		status_header( 200 );
		header( 'Content-Type: text/html; charset=UTF-8' );
		echo 'google-site-verification: googlec17d4028eb35f0ab.html';
		exit;
	}
}, 0 );

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
	$a   = shortcode_atts( array( 'slug' => '', 'n' => 4, 'excluir_recientes' => 0, 'relleno' => 0, 'relleno_ids' => '' ), $a );
	$cat = get_category_by_slug( $a['slug'] );
	$ps  = array();
	if ( $cat ) {
		$args = array( 'numberposts' => (int) $a['n'], 'post_status' => 'publish', 'category' => $cat->term_id );
		if ( $a['excluir_recientes'] ) {
			$args['exclude'] = get_posts( array( 'numberposts' => 5, 'fields' => 'ids' ) );
		}
		$ps = get_posts( $args );
	}
	// relleno=1: si la categoría aún tiene pocos artículos, se completa con los más recientes
	if ( $a['relleno'] && count( $ps ) < (int) $a['n'] ) {
		$ps = array_merge( $ps, get_posts( array( 'numberposts' => (int) $a['n'] - count( $ps ), 'post_status' => 'publish', 'exclude' => wp_list_pluck( $ps, 'ID' ) ) ) );
	}
	// relleno_ids="1,2,3": si faltan artículos, se completa solo con esos (industriales/de gestión), nunca con los más recientes
	if ( $a['relleno_ids'] && count( $ps ) < (int) $a['n'] ) {
		$ids = array_diff( array_map( 'intval', explode( ',', $a['relleno_ids'] ) ), wp_list_pluck( $ps, 'ID' ) );
		if ( $ids ) {
			$ps = array_merge( $ps, get_posts( array( 'post__in' => $ids, 'orderby' => 'post__in', 'numberposts' => (int) $a['n'] - count( $ps ), 'post_status' => 'publish' ) ) );
		}
	}
	if ( ! $ps ) {
		return '';
	}
	$h  = '<div class="tc-fila">';
	foreach ( $ps as $p ) {
		$h .= tc_tarjeta( $p, '', 'medium_large', 18 );
	}
	return $h . '</div>';
} );

/* [tc_calculadora] «¿Cuánto te cuesta el papeleo?»: cálculo orientativo con las cifras de quien lo usa.
 * Usa el plan Profesional de /erp-industria/ (690 € de puesta en marcha y 69 €/mes desde el mes 4, 3 primeros meses gratis). Planes: Básico 590+59, Profesional 690+69, Pro 990+89.
 * Si cambia la tarifa, cambiar aquí data-puesta / data-cuota / data-gratis y el texto de la página del ERP. */
add_shortcode( 'tc_calculadora', function () {
	static $n = 0;
	++$n;
	$i = 'tc-calc' . $n;
	ob_start();
	?>
<div class="tc-calc tc-box" id="<?php echo esc_attr( $i ); ?>" data-puesta="690" data-cuota="69" data-gratis="3" data-pagos="2" role="group" aria-labelledby="<?php echo esc_attr( $i ); ?>-t">
	<div><h3 id="<?php echo esc_attr( $i ); ?>-t">¿Cuánto te cuesta el papeleo?</h3><p class="tc-calc__sub">Presupuestos, albaranes y facturas a mano. Pon tus cifras y mira el orden de magnitud: es un cálculo orientativo, no una promesa de ahorro.</p></div>
	<div class="tc-calc__grid">
		<div class="tc-field"><label for="<?php echo esc_attr( $i ); ?>-p">Personas en oficina</label><input id="<?php echo esc_attr( $i ); ?>-p" type="number" inputmode="numeric" min="1" max="50" step="1" value="2"></div>
		<div class="tc-field"><label for="<?php echo esc_attr( $i ); ?>-h">Horas por persona y semana con presupuestos, albaranes y facturas</label><input id="<?php echo esc_attr( $i ); ?>-h" type="number" inputmode="decimal" min="0.5" max="40" step="0.5" value="8"></div>
		<div class="tc-field"><label for="<?php echo esc_attr( $i ); ?>-c">Coste por hora de cada persona (€)</label><input id="<?php echo esc_attr( $i ); ?>-c" type="number" inputmode="decimal" min="5" max="150" step="1" value="20"></div>
	</div>
	<div class="tc-calc__rng"><label for="<?php echo esc_attr( $i ); ?>-r">Parte de ese tiempo que supones recortar: <b><output id="<?php echo esc_attr( $i ); ?>-rv">30 %</output></b> <span>(hipótesis tuya: ajústala)</span></label><input id="<?php echo esc_attr( $i ); ?>-r" type="range" min="10" max="60" step="5" value="30"></div>
	<div class="tc-calc__out" role="status" aria-live="polite">
		<div class="tc-calc__big"><span data-o="anual">–</span> € <small>al año en papeleo</small></div>
		<p class="tc-calc__rec" data-o="rec"></p>
		<p class="tc-calc__note">Orientativo y sin IVA. Parte de las horas y el coste que has escrito; el recorte es una suposición para hacer la cuenta, no un resultado garantizado. La cuenta usa el plan Profesional: 690 € de puesta en marcha (un solo pago al empezar) y 69 €/mes desde el cuarto mes. Hay también un plan Básico desde 590 € y 59 €/mes. Los usuarios extra no entran en esta cuenta.</p>
	</div>
	<div class="tc-btns"><button type="button" class="tc-btn" data-o="ir">Quiero ver esto con mis números</button></div>
</div>
<?php if ( 1 === $n ) : ?>
<script>
(function(){
  function num(el,min,max,def){var v=parseFloat(String(el.value).replace(',','.'));if(!isFinite(v))v=def;return Math.min(max,Math.max(min,v));}
  function eur(x){return Math.round(x).toLocaleString('es-ES');}
  document.querySelectorAll('.tc-calc').forEach(function(c){
    var q=function(s){return c.querySelector(s);}, id=c.id, P=q('#'+id+'-p'), H=q('#'+id+'-h'), C=q('#'+id+'-c'), R=q('#'+id+'-r'), RV=q('#'+id+'-rv'),
        puesta=+c.dataset.puesta, cuota=+c.dataset.cuota, gratis=+c.dataset.gratis, r={};
    function calc(){
      var p=num(P,1,50,2), h=num(H,0.5,40,8), co=num(C,5,150,20), pc=num(R,10,60,30)/100;
      var anual=p*h*52*co, ahorro=anual*pc/12, meses=null;
      // coste acumulado al mes m: 690 € al empezar y la cuota desde el mes 4; se busca el mes desde el que lo ahorrado supera siempre lo pagado
      var ultimo=0;for(var m=1;m<=60;m++){var gastado=puesta+cuota*Math.max(0,m-gratis);if(ahorro*m<gastado)ultimo=m;}
      if(ultimo<60)meses=ultimo+1;
      RV.textContent=Math.round(pc*100)+' %';
      q('[data-o=anual]').textContent=eur(anual);
      q('[data-o=rec]').textContent=meses&&meses<=60
        ? 'Si recortaras un '+Math.round(pc*100)+' % ese tiempo (unos '+eur(ahorro)+' € al mes de tiempo liberado), recuperarías lo invertido en '+meses+(meses===1?' mes.':' meses.')
        : 'Con estas cifras y un recorte del '+Math.round(pc*100)+' % la inversión tardaría más de cinco años en compensarse: quizá no sea tu caso, y te lo diremos con franqueza en el diagnóstico.';
      r={p:p,h:h,co:co,pc:Math.round(pc*100),anual:anual,meses:meses};
    }
    [P,H,C,R].forEach(function(e){e.addEventListener('input',calc);});
    calc();
    q('[data-o=ir]').addEventListener('click',function(){
      calc();
      var m='Quiero ver esto con mis números. Cifras de la calculadora «¿Cuánto te cuesta el papeleo?» (orientativas): '+r.p+(r.p===1?' persona':' personas')+' en oficina, '+r.h+' h por persona y semana con presupuestos, albaranes y facturas, a '+r.co+' €/h, unos '+eur(r.anual)+' € al año en papeleo.'+(r.meses&&r.meses<=60?' Suponiendo recortar un '+r.pc+' % ese tiempo, la puesta en marcha se recuperaría en unos '+r.meses+(r.meses===1?' mes.':' meses.'):'')+' Me gustaría revisarlo con mis datos reales.';
      if(window.tcMedir)tcMedir('clic','Calculadora papeleo → quiero ver esto con mis números');
      var t=document.querySelector('form[data-tc-form="contacto"] textarea[name=mensaje]');
      if(t){t.value=m;t.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(function(){t.focus({preventScroll:true});},400);}
      else{try{sessionStorage.setItem('tcCalc',m);}catch(x){}location.href='/contacto/#contacto';}
    });
  });
})();
</script>
<?php endif; ?>
	<?php
	return ob_get_clean();
} );

/* ---------- 3. Sistema de diseño (todas las páginas) ----------
 * El CSS vive en wordpress/web-transformaconia.css. Al desplegar (n8n/web-snippet.mjs) se sustituye el
 * marcador de abajo por su texto y su hash; la primera visita lo escribe en uploads/tc/tc-web-HASH.css
 * y se sirve con wp_enqueue_style (?ver=HASH, cacheable). Si no se pudiera escribir, sale en línea como antes. */
/*@@TC_CSS@@*/
if ( ! function_exists( 'tc_css_enlace' ) ) {
	function tc_css_enlace() {
		if ( ! defined( 'TC_CSS_VER' ) || ! function_exists( 'tc_css_texto' ) ) {
			return;
		}
		$u   = wp_upload_dir( null, false );
		$dir = $u['basedir'] . '/tc';
		$fn  = $dir . '/tc-web-' . TC_CSS_VER . '.css';
		if ( ! file_exists( $fn ) && wp_mkdir_p( $dir ) ) {
			@file_put_contents( $fn, tc_css_texto() );
			// 11-11-2026: los CSS viejos se conservan 30 días. Antes se borraban al momento y las páginas que la
			// caché seguía sirviendo (p. ej. /contacto/) pedían un CSS que ya no existía: salían sin diseño.
			foreach ( (array) glob( $dir . '/tc-web-*.css' ) as $viejo ) {
				if ( $viejo !== $fn && @filemtime( $viejo ) < time() - 30 * DAY_IN_SECONDS ) {
					@unlink( $viejo );
				}
			}
		}
		if ( file_exists( $fn ) && filesize( $fn ) > 1000 ) {
			wp_enqueue_style( 'tc-web', set_url_scheme( $u['baseurl'] ) . '/tc/tc-web-' . TC_CSS_VER . '.css', array(), TC_CSS_VER );
			wp_print_styles( 'tc-web' );
		} else {
			echo '<style id="tc-web">' . tc_css_texto() . '</style>' . "\n";
		}
	}
}
add_action( 'wp_head', function () {
	?>
<script>document.documentElement.classList.add('tc-js')</script>
	<?php
	tc_css_enlace();
}, 20 );

/* Brillo que sigue al ratón en las tarjetas de servicio y envío de formularios (JS mínimo) */
add_action( 'wp_footer', function () {
	?>
<script id="tc-web-js">
(function(){
  // aparición al hacer scroll
  var rv=document.querySelectorAll('.tc-reveal');
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -5% 0px',threshold:0});rv.forEach(function(el){io.observe(el);});}
  else rv.forEach(function(el){el.classList.add('is-in');});
  document.addEventListener('pointermove',function(e){var b=e.target.closest&&e.target.closest('.tc-box');if(!b)return;var r=b.getBoundingClientRect();b.style.setProperty('--mx',(e.clientX-r.left)+'px');b.style.setProperty('--my',(e.clientY-r.top)+'px');},{passive:true});
  // medición propia sin cookies ni IP: visita, clics en botones de contacto y contactos enviados
  var VIS='https://paneln8n.transformaconia.com/webhook/web-visita', yo=document.body.classList.contains('logged-in')||navigator.webdriver;
  window.tcMedir=function(e,l){if(yo)return;var ref='';try{ref=document.referrer?new URL(document.referrer).hostname:'';}catch(x){}
    var d=JSON.stringify({e:e,r:location.pathname,l:l||'',f:ref,m:matchMedia('(max-width:768px)').matches?'1':'0'});
    try{if(!(navigator.sendBeacon&&navigator.sendBeacon(VIS,new Blob([d],{type:'text/plain'}))))fetch(VIS,{method:'POST',body:d,keepalive:true,mode:'no-cors'});}catch(x){}};
  // atribución de la sesión: página de entrada, procedencia y utm_* la primera vez; el formulario los envía con el contacto
  var ATR={};
  try{ATR=JSON.parse(sessionStorage.getItem('tcAtr')||'{}');
    if(!ATR.p){var q0=new URLSearchParams(location.search),rh='';try{rh=document.referrer?new URL(document.referrer).hostname.replace(/^www./,''):'';}catch(x){}
      if(rh===location.hostname.replace(/^www./,''))rh='';
      ATR={p:location.pathname,r:rh,s:(q0.get('utm_source')||'').slice(0,60),m:(q0.get('utm_medium')||'').slice(0,60),c:(q0.get('utm_campaign')||'').slice(0,80)};
      sessionStorage.setItem('tcAtr',JSON.stringify(ATR));}}catch(x){ATR={};}
  tcMedir('visita');
  document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a');if(!a)return;var h=a.getAttribute('href')||'';
    if(/^mailto:|^tel:|\/contacto\/|\/diseno-web\/|wa\.me/.test(h)||a.matches('.tc-btn,.tc-webband__b,.tc-sticky a'))tcMedir('clic',(a.textContent.trim().replace(/\s+/g,' ').slice(0,60)||h)+' → '+h.replace('https://transformaconia.com',''));},{passive:true});
  try{var cm=sessionStorage.getItem('tcCalc'),ct=document.querySelector('form[data-tc-form="contacto"] textarea[name=mensaje]');
    if(cm&&ct){if(!ct.value)ct.value=cm;sessionStorage.removeItem('tcCalc');}}catch(x){}
  var FORM='https://paneln8n.transformaconia.com/webhook/web-transformaconia';
  document.addEventListener('submit',function(e){
    var f=e.target; if(!f.matches||!f.matches('form[data-tc-form]'))return; e.preventDefault();
    var msg=f.querySelector('.tc-msg'), btn=f.querySelector('button[type=submit]'), txt=btn?btn.innerHTML:'';
    // validación antes de enviar: el formulario lleva novalidate para poner nuestros propios avisos
    f.querySelectorAll('.is-bad').forEach(function(x){x.classList.remove('is-bad');x.removeAttribute('aria-invalid');});
    var fallo=null, em=f.querySelector('[name=email]'), mal=function(el,t){if(!fallo)fallo=[el,t];el.classList.add('is-bad');el.setAttribute('aria-invalid','true');};
    f.querySelectorAll('[required]').forEach(function(el){
      if(el.type==='checkbox'){if(!el.checked)mal(el,'Marca la casilla de la política de privacidad para poder responderte.');}
      else if(!el.value.trim())mal(el,'Rellena el campo «'+((f.querySelector('label[for="'+el.id+'"]')||{}).textContent||'obligatorio').trim()+'».');
      else if(el===em&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim()))mal(el,'Revisa el correo: así no podemos contestarte.');
    });
    if(fallo){msg.className='tc-msg is-err';msg.textContent=fallo[1];fallo[0].focus();return;}
    var d=new URLSearchParams(new FormData(f)); d.set('tipo',f.getAttribute('data-tc-form')); d.set('origen',location.href);
    d.set('entrada',ATR.p||location.pathname);d.set('procedencia',ATR.r||'');d.set('utm_source',ATR.s||'');d.set('utm_medium',ATR.m||'');d.set('utm_campaign',ATR.c||'');
    if(btn){btn.disabled=true;btn.innerHTML='Enviando…';}
    fetch(FORM,{method:'POST',body:d}).then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok||!j.ok)throw j;return j;});}).then(function(){
      msg.className='tc-msg is-ok'; msg.textContent=f.getAttribute('data-ok'); f.reset();
    }).catch(function(j){msg.className='tc-msg is-err'; msg.textContent=(j&&j.error)||'No se ha podido enviar. Escríbenos a info@transformaconia.com y te respondemos igual.';})
    .finally(function(){if(btn){btn.disabled=false;btn.innerHTML=txt;}});
  });
  document.addEventListener('input',function(e){if(e.target.classList&&e.target.classList.contains('is-bad')){e.target.classList.remove('is-bad');e.target.removeAttribute('aria-invalid');}});
  // fecha y «hace X» calculados al visitar (la página puede venir de la caché)
  var hoy=document.querySelectorAll('[data-tc-hoy]');if(hoy.length){var f=new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',timeZone:'Europe/Madrid'});hoy.forEach(function(e){e.textContent=f;});}
  document.querySelectorAll('[data-tc-hace]').forEach(function(e){var t=Date.parse(e.getAttribute('data-tc-hace'));if(!t)return;var d=(Date.now()-t)/1000,x;
    if(d<3600)x='hace '+Math.max(1,Math.floor(d/60))+' min';else if(d<86400)x='hace '+Math.floor(d/3600)+' h';else if(d<172800)x='ayer';else if(d<604800)x='hace '+Math.floor(d/86400)+' días';else x=new Date(t).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/Madrid'});e.textContent=x;});
  var q=new URLSearchParams(location.search).get('estado'), m=document.getElementById('tc-estado');
  // lectura de cotas tipo CAD en el hero de la portada: cruz que sigue al ratón con X/Y sobre la rejilla del plano.
  // Solo escritorio con ratón y sin «reducir movimiento»; se mueve con transform y el bucle se para al llegar.
  var hz=document.querySelector('.tc-hero--home');
  if(hz&&matchMedia('(hover:hover) and (pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
    var cad=document.createElement('div');cad.className='tc-cad';cad.setAttribute('aria-hidden','true');
    cad.innerHTML='<i class="tc-cad__x"></i><i class="tc-cad__y"></i><b class="tc-cad__t"></b>';hz.appendChild(cad);
    var cx=cad.children[0],cy=cad.children[1],ct=cad.children[2],tx=0,ty=0,px=0,py=0,run=0,txt='';
    var paso=function(){px+=(tx-px)*.22;py+=(ty-py)*.22;var fin=Math.abs(tx-px)<.3&&Math.abs(ty-py)<.3;if(fin){px=tx;py=ty;}
      cx.style.transform='translateY('+py+'px)';cy.style.transform='translateX('+px+'px)';ct.style.transform='translate('+(px+14)+'px,'+(py+14)+'px)';
      var t='X '+String(Math.round(px)).padStart(4,'0')+' · Y '+String(Math.round(py)).padStart(4,'0');if(t!==txt){ct.textContent=t;txt=t;}
      run=fin?0:requestAnimationFrame(paso);};
    hz.addEventListener('pointermove',function(e){var r=hz.getBoundingClientRect();tx=e.clientX-r.left;ty=e.clientY-r.top;
      if(!cad.classList.contains('is-on')){px=tx;py=ty;cad.classList.add('is-on');}if(!run)run=requestAnimationFrame(paso);},{passive:true});
    hz.addEventListener('pointerleave',function(){cad.classList.remove('is-on');});
  }
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
	if ( is_singular( 'post' ) ) :
		?>
<aside class="tc-webband tc-webband--erp" aria-label="Diagnóstico gratuito">
 <div class="tc-wrap tc-webband__in">
  <p class="tc-webband__t">¿Trabajas en una empresa industrial? Cuéntanos cómo trabajáis y te enviamos por escrito qué tareas de compras, almacén y facturación se pueden automatizar y cuánto costaría. También puedes ver nuestro ERP para la industria, IndunexIA Gestión.</p>
  <span class="tc-webband__acts"><a class="tc-webband__b" href="<?php echo $u( '/contacto/' ); ?>">Pedir diagnóstico gratis →</a> <a class="tc-webband__b" href="<?php echo $u( '/erp-industria/' ); ?>">Ver el ERP para la industria →</a></span>
 </div>
</aside>
		<?php
	endif;
	?>
<footer class="tc-footer" role="contentinfo">
 <div class="tc-wrap">
  <div class="tc-footer__top">
   <div class="tc-footer__brand">
    <a href="<?php echo $u( '/' ); ?>"><img src="<?php echo esc_url( $logo ); ?>" alt="Transforma con IA" width="220" height="35" loading="lazy"></a>
    <p>Consultoría de inteligencia artificial y automatización de procesos para la industria. Apps IndunexIA (gestión, presupuestos y documentos), asistentes técnicos y mejoras sobre SAP o tu ERP.</p>
    <a class="tc-footer__mail" href="mailto:info@transformaconia.com">info@transformaconia.com</a>
    <a class="tc-footer__ig" href="https://www.instagram.com/transformaconia.oficial/" target="_blank" rel="noopener me" aria-label="Instagram de Transforma con IA (se abre en otra pestaña)"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor"/></svg>@transformaconia.oficial</a>
    <p>Murcia · En persona en la Región de Murcia y en remoto en toda España</p>
   </div>
   <div><h3>Industria</h3><ul>
    <li><a href="<?php echo $u( '/industria/' ); ?>">IA para la industria</a></li>
    <li><a href="<?php echo $u( '/ia-talleres-industriales/' ); ?>">IA para talleres industriales</a></li>
    <li><a href="<?php echo $u( '/distribucion-industrial/' ); ?>">Distribución industrial</a></li>
    <li><a href="<?php echo $u( '/ia-mantenimiento-industrial/' ); ?>">IA para mantenimiento industrial</a></li>
    <li><a href="<?php echo $u( '/ia-empresas-instaladoras/' ); ?>">IA para empresas instaladoras</a></li>
    <li><a href="<?php echo $u( '/ia-fabricacion-industrial/' ); ?>">IA para fabricación industrial</a></li>
    <li><a href="<?php echo $u( '/otros-sectores/' ); ?>">Otros sectores</a></li>
    <li><a href="<?php echo $u( '/consultor-ia-murcia/' ); ?>">Consultoría de IA en Murcia</a></li>
   </ul></div>
   <div><h3>Apps IndunexIA</h3><ul>
    <li><a href="<?php echo $u( '/erp-industria/' ); ?>">IndunexIA Gestión · ERP</a></li>
    <li><a href="<?php echo $u( '/presupuestos-desde-plano/' ); ?>">IndunexIA Presupuestos</a></li>
    <li><a href="<?php echo $u( '/gestion-documental-ia/' ); ?>">IndunexIA Documentos</a></li>
   </ul><h3>Servicios</h3><ul>
    <li><a href="<?php echo $u( '/automatizacion-procesos-ia/' ); ?>">Automatización de procesos</a></li>
    <li><a href="<?php echo $u( '/agentes-chatbots-ia/' ); ?>">Asistentes técnicos y chatbots</a></li>
    <li><a href="<?php echo $u( '/desarrollo-a-medida-ia/' ); ?>">Herramientas a medida y SAP</a></li>
    <li><a href="<?php echo $u( '/soluciones/' ); ?>">Cómo trabajamos y precios</a></li>
   </ul></div>
   <div><h3>Transforma con IA</h3><ul>
    <li><a href="<?php echo $u( '/casos/' ); ?>">Casos</a></li>
    <li><a href="<?php echo $u( '/quienes-somos/' ); ?>">Quiénes somos</a></li>
    <li><a href="<?php echo $u( '/blog/' ); ?>">Blog</a></li>
    <li><a href="<?php echo $u( '/category/ia-en-la-industria/' ); ?>">IA en la industria</a></li>
    <li><a href="<?php echo $u( '/category/gestion-y-facturacion/' ); ?>">Gestión y facturación</a></li>
    <li><a href="<?php echo $u( '/category/actualidad-ia/' ); ?>">Actualidad IA</a></li>
    <li><a href="<?php echo $u( '/contacto/' ); ?>">Diagnóstico gratis</a></li>
    <li><a href="<?php echo $u( '/privacidad/' ); ?>">Privacidad</a></li>
   </ul></div>
  </div>
  <nav class="tc-footer__loc" aria-label="Dónde trabajamos"><span>Dónde trabajamos</span>
   <a href="<?php echo $u( '/consultor-ia-murcia/#donde-trabajamos' ); ?>">Murcia</a>
   <a href="<?php echo $u( '/automatizacion-industria-cartagena/' ); ?>">Cartagena</a>
   <a href="<?php echo $u( '/automatizacion-industria-molina-de-segura/' ); ?>">Molina de Segura</a>
   <a href="<?php echo $u( '/automatizacion-industria-lorca/' ); ?>">Lorca</a>
   <a href="<?php echo $u( '/automatizacion-industria-alcantarilla/' ); ?>">Alcantarilla</a>
   <a href="<?php echo $u( '/automatizacion-industria-elche/' ); ?>">Elche</a>
   <a href="<?php echo $u( '/automatizacion-industria-albacete/' ); ?>">Albacete</a>
  </nav>
  <div class="tc-footer__bottom">
   <span>© <?php echo esc_html( gmdate( 'Y' ) ); ?> Transforma con IA</span>
   <span>Consultoría de IA y automatización industrial · Hecho en Murcia</span>
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
	/* Llamada según la categoría del artículo (tres categorías: IA en la industria, Gestión y facturación, Actualidad IA) */
	$ctas = array(
		'ia-en-la-industria'    => array(
			'¿Tienes un taller o una planta con un caso parecido?',
			'Trabajamos con talleres y empresas industriales de toda España. Cuéntanos qué os quita más tiempo y te decimos, sin compromiso, qué se puede automatizar y cómo encaja con vuestro programa de gestión.',
			array( array( '/industria/', 'IA para la industria →', true ), array( '/erp-industria/', 'ERP para la industria', false ) ),
		),
		'gestion-y-facturacion' => array(
			'¿Sigues tecleando facturas y albaranes a mano?',
			'Montamos programas de gestión y lectura de documentos con IA para pymes y talleres, siempre con una persona que revisa antes de registrar nada. Te enseñamos cómo quedaría en tu empresa.',
			array( array( '/erp-industria/', 'ERP para la industria →', true ), array( '/gestion-documental-ia/', 'IndunexIA Documentos', false ) ),
		),
		'actualidad-ia'         => array(
			'¿Qué puede hacer esto por tu empresa?',
			'Somos una consultoría de IA y automatización especializada en la industria. Gratis y sin compromiso, te enviamos por escrito qué se puede automatizar en tu caso y cuánto costaría.',
			array( array( '/contacto/', 'Pide tu diagnóstico gratis →', true ) ),
		),
	);
	$clave = 'actualidad-ia';
	foreach ( (array) get_the_category() as $cat_ ) {
		if ( isset( $ctas[ $cat_->slug ] ) ) {
			$clave = $cat_->slug;
			break;
		}
	}
	list( $ct, $cp, $cb ) = $ctas[ $clave ];
	$bots = '';
	foreach ( $cb as $b ) {
		$bots .= '<a class="tc-cta-post__b' . ( $b[2] ? '' : ' tc-cta-post__b--2' ) . '" href="' . esc_url( home_url( $b[0] ) ) . '">' . esc_html( $b[1] ) . '</a>';
	}
	$cta = '<div class="tc-cta-post tc-cta-post--' . esc_attr( $clave ) . '"><div><p class="tc-cta-post__t">' . esc_html( $ct ) . '</p><p>' . esc_html( $cp ) . '</p></div><div class="tc-cta-post__bs">' . $bots . '</div></div>';
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
		'Previous Post'                     => 'Anterior',
		'Next Post'                         => 'Siguiente',
		'Recommended For You'               => 'Te puede interesar',
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

/* ---------- 6b. Imagen al compartir (WhatsApp, LinkedIn, Facebook, X) con el logo nuevo ----------
 * Portada, páginas, blog, categorías y archivos usan la tarjeta ancha de marca (id 7486, 1200x630: logo + frase),
 * que en WhatsApp sale como vista previa grande y vende mejor. Los artículos siguen con su imagen destacada.
 * (El icono cuadrado de la «T», id 7487, queda en la biblioteca por si se quiere volver a él.) */
if ( ! defined( 'TC_OG_ID' ) ) {
	define( 'TC_OG_ID', 7486 );
}
foreach ( array( 'facebook', 'twitter' ) as $tc_red ) {
	add_action( "rank_math/opengraph/{$tc_red}/add_images", function ( $img ) {
		if ( is_singular( 'post' ) && has_post_thumbnail() ) {
			return;
		}
		if ( method_exists( $img, 'add_image_by_id' ) ) {
			$img->add_image_by_id( TC_OG_ID );
		}
	} );
}
add_filter( 'option_rank-math-options-titles', function ( $o ) {
	if ( is_array( $o ) ) {
		$o['open_graph_image']    = wp_get_attachment_url( TC_OG_ID );
		$o['open_graph_image_id'] = TC_OG_ID;
	}
	return $o;
} );

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
		'sameAs'      => array( 'https://www.instagram.com/transformaconia.oficial/' ),
		'description' => 'Consultoría de inteligencia artificial y automatización de procesos especializada en la industria, con base en Murcia: ERP para la industria (talleres de mecanizado, calderería, carpintería metálica, reparación de maquinaria e hidráulica), asistentes técnicos de catálogo, las apps IndunexIA Presupuestos (presupuestos desde plano) e IndunexIA Documentos (gestión documental con IA), automatizaciones y mejoras sobre SAP o cualquier ERP para empresas de toda España.',
		'address'     => array( '@type' => 'PostalAddress', 'addressLocality' => 'Murcia', 'addressRegion' => 'Región de Murcia', 'addressCountry' => 'ES' ),
		'areaServed'  => array(
			array( '@type' => 'AdministrativeArea', 'name' => 'Región de Murcia' ),
			array( '@type' => 'AdministrativeArea', 'name' => 'Provincia de Alicante' ),
			array( '@type' => 'AdministrativeArea', 'name' => 'Provincia de Albacete' ),
			array( '@type' => 'Country', 'name' => 'España' ),
		),
		'priceRange'  => '€€',
		'knowsAbout'  => array( 'Automatización de procesos industriales', 'Inteligencia artificial', 'ERP para la industria', 'Talleres de mecanizado', 'Calderería', 'Carpintería metálica', 'Reparación de maquinaria industrial', 'Hidráulica y neumática', 'Distribución industrial', 'Gestión documental', 'SAP', 'Asistentes de IA' ),
		'hasOfferCatalog' => array(
			'@type'           => 'OfferCatalog',
			'name'            => 'Soluciones de IA y automatización para la industria',
				'itemListElement' => array(
					array( '@type' => 'Offer', 'itemOffered' => array( '@type' => 'Service', 'name' => 'ERP para la industria con IA', 'url' => home_url( '/erp-industria/' ) ), 'priceSpecification' => array( '@type' => 'PriceSpecification', 'minPrice' => 590, 'priceCurrency' => 'EUR' ) ),
					array( '@type' => 'Offer', 'itemOffered' => array( '@type' => 'Service', 'name' => 'Automatización de procesos con IA', 'url' => home_url( '/automatizacion-procesos-ia/' ) ), 'priceSpecification' => array( '@type' => 'PriceSpecification', 'minPrice' => 450, 'priceCurrency' => 'EUR' ) ),
					array( '@type' => 'Offer', 'itemOffered' => array( '@type' => 'Service', 'name' => 'Asistentes técnicos y chatbots de IA', 'url' => home_url( '/agentes-chatbots-ia/' ) ), 'priceSpecification' => array( '@type' => 'PriceSpecification', 'minPrice' => 900, 'priceCurrency' => 'EUR' ) ),
					array( '@type' => 'Offer', 'itemOffered' => array( '@type' => 'Service', 'name' => 'Gestión documental con IA', 'url' => home_url( '/gestion-documental-ia/' ) ), 'priceSpecification' => array( '@type' => 'PriceSpecification', 'minPrice' => 450, 'priceCurrency' => 'EUR' ) ),
					array( '@type' => 'Offer', 'itemOffered' => array( '@type' => 'Service', 'name' => 'Herramientas a medida con IA e integración con SAP', 'url' => home_url( '/desarrollo-a-medida-ia/' ) ), 'priceSpecification' => array( '@type' => 'PriceSpecification', 'minPrice' => 2500, 'priceCurrency' => 'EUR' ) ),
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
	// El ERP como producto de software (precio orientativo de la oferta de lanzamiento)
	if ( is_page( 'erp-industria' ) ) {
		$data['TcErp'] = array(
			'@type'               => 'SoftwareApplication',
			'name'                => 'IndunexIA Gestión',
			'alternateName'       => 'IndunexIA Gestión: ERP con IA para la industria',
			'applicationCategory' => 'BusinessApplication',
			'operatingSystem'     => 'Web',
			'url'                 => home_url( '/erp-industria/' ),
			'description'         => 'Programa de gestión (ERP) con IA para talleres industriales: calculadora de costes y margen, presupuestos, albaranes firmados en el móvil, facturas, cobros, gastos por foto y paquete trimestral para la asesoría.',
			'screenshot'          => array(
				'@type'       => 'ImageObject',
				'url'         => 'https://transformaconia.com/wp-content/uploads/2026/10/erp-industria-calculadora.webp',
				'caption'     => 'Calculadora de costes de IndunexIA Gestión con el margen aplicado (datos de ejemplo)',
				'contentUrl'  => 'https://transformaconia.com/wp-content/uploads/2026/10/erp-industria-calculadora.webp',
			),
			'audience'            => array( '@type' => 'BusinessAudience', 'audienceType' => 'Talleres de mecanizado, calderería, carpintería metálica, reparación de maquinaria, hidráulica y neumática' ),
			'offers'              => array(
				array( '@type' => 'Offer', 'name' => 'Plan Básico', 'price' => 590, 'priceCurrency' => 'EUR', 'description' => 'Presupuestos, albaranes, facturas, envío por correo, cobros y gastos. Puesta en marcha en un solo pago al empezar; después 59 €/mes con los 3 primeros meses gratis. Usuario extra 15 €/mes. Sin permanencia. Sin IVA. Precio de temporada hasta el 31/12/2026.', 'url' => home_url( '/erp-industria/#precio' ) ),
				array( '@type' => 'Offer', 'name' => 'Plan Profesional', 'price' => 690, 'priceCurrency' => 'EUR', 'description' => 'Todo lo del Básico más gastos por foto con IA, albaranes firmados, calculadora de costes y margen, fiscal y paquete para el asesor, informes y Telegram. Puesta en marcha en un solo pago al empezar; después 69 €/mes con los 3 primeros meses gratis. Usuario extra 15 €/mes. Sin permanencia. Sin IVA. Precio de temporada hasta el 31/12/2026.', 'url' => home_url( '/erp-industria/#precio' ) ),
				array( '@type' => 'Offer', 'name' => 'Plan Pro', 'price' => 990, 'priceCurrency' => 'EUR', 'description' => 'Todo lo del Profesional más asistente con IA propio, presupuesto desde plano, histórico completo, una automatización a medida y 2 h/mes de mejoras. Puesta en marcha en un solo pago al empezar; después 89 €/mes con los 3 primeros meses gratis. Usuario extra 15 €/mes. Sin permanencia. Sin IVA. Precio de temporada hasta el 31/12/2026.', 'url' => home_url( '/erp-industria/#precio' ) ),
			),
			'provider'            => array( '@id' => home_url( '/#person' ) ),
		);
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
/* Tarjeta de categorías del blog (cabecera de /blog/ y de los archivos): «IA en la industria» primero y destacada */
function tc_panel_categorias( $activa = 0 ) {
	$def = array(
		'ia-en-la-industria'    => array( 'Casos y aplicaciones reales en talleres y fábricas', true ),
		'gestion-y-facturacion' => array( 'Facturas, albaranes y programas de gestión', false ),
		'actualidad-ia'         => array( 'Lo que pasa en la IA, explicado sin jerga', false ),
	);
	$h = '<aside class="tc-hero__panel tc-spec"><div class="tc-hero__panel-h"><span>Elige por dónde empezar</span></div><div class="tc-catpanel">';
	foreach ( $def as $slug => $d ) {
		$t = get_category_by_slug( $slug );
		if ( ! $t ) {
			continue;
		}
		$n  = (int) $t->count;
		$h .= '<a class="' . ( $d[1] ? 'is-star ' : '' ) . ( (int) $activa === (int) $t->term_id ? 'is-on' : '' ) . '" href="' . esc_url( get_category_link( $t ) ) . '"><b>' . esc_html( $t->name ) . ( $d[1] ? '<span class="tc-pilares__tag">Destacada</span>' : '' ) . '</b><small>' . esc_html( $d[0] ) . '</small><em>' . $n . ( 1 === $n ? ' artículo' : ' artículos' ) . '</em></a>';
	}
	return $h . '</div></aside>';
}
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
	$eb     = 'Blog';
	$h1     = 'Blog: IA en la industria y actualidad de la inteligencia artificial';
	$lead   = 'Guías prácticas para talleres y empresas industriales, y lo que pasa en la IA explicado sin jerga.';
	$crumb  = '<span>Noticias</span>';
	$activa = 0;
	if ( is_category() ) {
		$eb     = 'Categoría';
		$h1     = single_cat_title( '', false );
		$lead   = wp_strip_all_tags( category_description() );
		$crumb  = '<a href="' . esc_url( $blog ) . '">Blog</a><span aria-hidden="true">/</span><span>' . esc_html( $h1 ) . '</span>';
		$activa = $obj->term_id;
		$partes = array_values( array_filter( array_map( 'trim', preg_split( '/[
]+/', (string) category_description() ) ) ) );
		if ( $partes ) {
			$lead   = wp_strip_all_tags( $partes[0] );
			$desc_h = count( $partes ) > 1 ? '<p>' . implode( '</p><p>', array_slice( $partes, 1 ) ) . '</p>' : '';
		}
	} elseif ( is_tag() ) {
		$eb    = 'Tema';
		$h1    = single_tag_title( '', false );
		$lead  = 'Artículos sobre ' . $h1 . ' publicados en Transforma con IA.';
		$crumb = '<a href="' . esc_url( $blog ) . '">Blog</a><span aria-hidden="true">/</span><span>' . esc_html( $h1 ) . '</span>';
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
	echo '</div>' . tc_panel_categorias( (int) $activa ) . '</div></header>';
	echo '<nav class="tc-wrap tc-filtros" aria-label="Categorías"><a class="' . ( is_home() ? 'is-on' : '' ) . '" href="' . esc_url( $blog ) . '">Todo</a>';
	foreach ( get_categories( array( 'hide_empty' => true, 'orderby' => 'count', 'order' => 'DESC' ) ) as $c ) {
		echo '<a class="' . ( $activa === $c->term_id ? 'is-on' : '' ) . '" href="' . esc_url( get_category_link( $c ) ) . '">' . esc_html( $c->name ) . '</a>';
	}
	echo '</nav>';
	if ( is_category() && $pag <= 1 && ! empty( $desc_h ) ) {
		/* resto de la descripción de la categoría (con enlaces a los servicios) */
		$resto = $desc_h;
		if ( trim( wp_strip_all_tags( $resto ) ) ) {
			echo '<section class="tc-sec tc-sec--tight"><div class="tc-wrap"><div class="tc-catdesc">' . wp_kses( $resto, array( 'p' => array(), 'a' => array( 'href' => array() ), 'strong' => array(), 'em' => array() ) ) . '</div></div></section>';
		}
	}
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
	echo '<section class="tc-sec tc-sec--tight"><div class="tc-wrap"><div class="tc-band"><div><h2>¿Quieres aplicar la IA en tu empresa?</h2><p>Somos una consultoría de automatización especializada en la industria. Cuéntanos qué tarea os quita más tiempo y te enviamos por escrito qué se puede automatizar y cuánto costaría.</p></div><div class="tc-btns"><a class="tc-btn" href="' . esc_url( home_url( '/contacto/' ) ) . '">Pide tu diagnóstico gratis</a></div></div></div></section>';
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

/* ---------- 11. Velocidad y móvil ---------- */
/* Fuentes: una sola petición (Poppins + Open Sans) que no bloquea el pintado.
 * Fuera Nunito y Montserrat (solo las usan piezas de Salient que no tenemos) y el Open Sans duplicado. */
add_action( 'wp_print_styles', function () {
	if ( is_admin() ) {
		return;
	}
	foreach ( array( 'nectar_default_font_open_sans', 'redux-google-fonts-salient_redux' ) as $h ) {
		wp_dequeue_style( $h );
	}
}, 1 );
add_action( 'wp_head', function () {
	$f = 'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap';
	echo '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
	echo '<link rel="preload" as="style" href="' . esc_url( $f ) . '"><link rel="stylesheet" href="' . esc_url( $f ) . '" media="print" onload="this.media=\'all\'"><noscript><link rel="stylesheet" href="' . esc_url( $f ) . '"></noscript>' . "\n";
}, 2 );
/* jQuery al pie: en <head> no hay nada que lo use y así no frena la primera pintada */
add_action( 'wp_enqueue_scripts', function () {
	if ( is_admin() || is_customize_preview() ) {
		return;
	}
	foreach ( array( 'jquery', 'jquery-core', 'jquery-migrate' ) as $h ) {
		wp_scripts()->add_data( $h, 'group', 1 );
	}
}, 999 );
/* Hojas que no hacen falta para pintar la primera pantalla: se cargan sin bloquear */
add_filter( 'style_loader_tag', function ( $tag, $handle ) {
	if ( is_admin() ) {
		return $tag;
	}
	$diferidas = array( 'font-awesome' );
	if ( tc_es_landing() || tc_es_archivo() ) {
		$diferidas[] = 'wp-block-library'; // las páginas de diseño propio no usan bloques
	}
	if ( in_array( $handle, $diferidas, true ) ) {
		$tag = str_replace( array( "media='all'", 'media="all"' ), "media='print' onload=\"this.media='all'\"", $tag );
	}
	return $tag;
}, 10, 2 );
/* Emojis: el navegador ya los pinta; se quita el script de detección (5 KB + 3 KB en línea) y su hoja */
add_action( 'init', function () {
	if ( is_admin() ) {
		return;
	}
	remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
	remove_action( 'wp_print_styles', 'print_emoji_styles' );
}, 20 );
/* Móvil: la maqueta del teléfono de la portada queda bajo el pliegue; en diferido deja todo el ancho de banda a CSS y texto.
 * (La captura grande del escritorio conserva eager + fetchpriority=high.) */
add_filter( 'the_content', function ( $c ) {
	if ( is_admin() || false === strpos( $c, 'erp-industria-movil.webp' ) ) {
		return $c;
	}
	return preg_replace_callback( '#<img[^>]*erp-industria-movil\.webp[^>]*>#', function ( $m ) {
		return str_replace( array( ' fetchpriority="high"', 'loading="eager"' ), array( '', 'loading="lazy"' ), $m[0] );
	}, $c );
}, 99 );
/* Retoques visuales sobre el contenido de las páginas (repaso visual A):
 * - la píldora de la portada cabe en una línea en el móvil;
 * - «1 · Diagnóstico» bajo «PASO 1» repetía el título del paso: se quita esa línea (las del tipo «Semana 1» o «30 minutos» se quedan). */
add_filter( 'the_content', function ( $c ) {
	if ( is_admin() || false === strpos( $c, 'tc-' ) ) {
		return $c;
	}
	$c = preg_replace( '#(<span class="tc-live"><i></i>)Expertos en IA de Murcia[^<]*(</span>)#u', '$1Expertos en IA · Murcia · Toda España$2', $c );
	$c = preg_replace( '#<span class="tc-step__when">\s*\d+\s*·[^<]*</span>#u', '', $c );
	return $c;
}, 99 );
/* Zoom con dos dedos permitido (Salient lo bloquea: penaliza accesibilidad y molesta a quien ve mal) */
add_action( 'template_redirect', function () {
	if ( is_admin() || wp_doing_ajax() || is_feed() ) {
		return;
	}
	ob_start( function ( $h ) {
		return preg_replace( '#<meta name="viewport" content="[^"]*"\s*/?>#', '<meta name="viewport" content="width=device-width, initial-scale=1" />', $h, 1 );
	} );
}, 0 );
add_action( 'wp_head', function () {
	?>
<style id="tc-movil">
/* móvil: fuera las animaciones infinitas que no van por la tarjeta gráfica (sombras, fondos, bordes, trazos).
 * Salient lee la posición de la página en cada fotograma y con ellas recalculaba estilos sin parar (~20 ms por fotograma). */
@media (max-width:768px){
.tc-live i,.tc-dot,.tc-linea__led i,.tc-shine,.tc-ruta::before,.tc-stats b,.tc-linea__track,.tc-linea__pieza,.tc-linea__est li,.tc-deco__cota,.tc-star::after{animation:none!important}
}
/* tablas de los artículos: se desplazan de lado en el móvil en vez de salirse de la pantalla */
@media (max-width:768px){
body.single-post .content-inner table{display:block;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
body.single-post .content-inner table th,body.single-post .content-inner table td{min-width:110px}
}
/* portada en el móvil: soluciones, sectores, casos y «por qué nosotros» en carrusel (el contenido sigue entero en la página) */
@media (max-width:620px){
.tc-home .tc-sec>.tc-wrap>.tc-grid--3,.tc-home .tc-sec>.tc-wrap>.tc-grid--4,.tc-home .tc-sect4,.tc-home .tc-chips{display:flex!important;flex-wrap:nowrap;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-inline:clamp(18px,4vw,40px);gap:14px;margin-inline:calc(-1*clamp(18px,4vw,40px));padding:4px clamp(18px,4vw,40px) 16px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.tc-home .tc-sec>.tc-wrap>.tc-grid--3::-webkit-scrollbar,.tc-home .tc-sec>.tc-wrap>.tc-grid--4::-webkit-scrollbar,.tc-home .tc-sect4::-webkit-scrollbar,.tc-home .tc-chips::-webkit-scrollbar{display:none}
.tc-home .tc-sec>.tc-wrap>.tc-grid--3>*,.tc-home .tc-sec>.tc-wrap>.tc-grid--4>*,.tc-home .tc-sect4>*{flex:0 0 84%;scroll-snap-align:start}
.tc-home .tc-chips>*{flex:none;scroll-snap-align:start}
.tc-desliza{display:flex;align-items:center;gap:8px;margin:-6px 0 10px;font-family:"Poppins",system-ui,sans-serif;font-size:12.5px;letter-spacing:.08em;text-transform:uppercase;color:#a9a1b4}
}
@media (min-width:621px){.tc-desliza{display:none}}
/* botón fijo de diagnóstico en el móvil */
.tc-sticky{display:none}
@media (max-width:768px){
.tc-sticky{display:flex;position:fixed;left:12px;right:12px;bottom:12px;z-index:9990;transform:translateY(140%);transition:transform .35s cubic-bezier(.2,.7,.2,1)}
.tc-sticky.is-on{transform:none}
.tc-sticky a{flex:1;display:flex;align-items:center;justify-content:center;gap:10px;padding:15px 18px;border-radius:14px;background:#b020ff;color:#fff!important;font-family:"Poppins",system-ui,sans-serif;font-weight:600;font-size:15.5px;line-height:1.28;box-shadow:0 14px 34px -10px rgba(176,32,255,.6),0 0 0 1px rgba(255,255,255,.12) inset;text-decoration:none!important}
}
</style>
	<?php
}, 30 );
/* Botón fijo «Diagnóstico gratis» en el móvil: aparece al bajar y se esconde cuando hay un formulario o la llamada final a la vista */
add_action( 'wp_footer', function () {
	if ( is_page( 'contacto' ) || is_404() ) {
		return;
	}
	?>
<?php $tc_erp = is_page( 'erp-industria' ); ?>
<div class="tc-sticky" aria-hidden="true"><a href="<?php echo esc_url( $tc_erp ? TC_DEMO_URL : home_url( '/contacto/' ) ); ?>" tabindex="-1"><?php echo $tc_erp ? 'Ver IndunexIA Gestión por dentro' : 'Pide tu diagnóstico gratis'; ?> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div>
<script id="tc-sticky-js">
(function(){var s=document.querySelector('.tc-sticky');if(!s)return;document.body.classList.add('tc-con-sticky');
  var tapan=0,antes=null,mostrar=function(){var on=window.scrollY>window.innerHeight*.9&&!tapan;if(on===antes)return;antes=on;s.classList.toggle('is-on',on);s.setAttribute('aria-hidden',on?'false':'true');s.firstElementChild.tabIndex=on?0:-1;};
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){tapan+=e.isIntersecting?1:-1;});tapan=Math.max(0,tapan);mostrar();});
    document.querySelectorAll('form[data-tc-form],.tc-band,.tc-webband,.tc-footer,.tca-cta,.tc-sec table,.tc-table,.tc-ba').forEach(function(el){io.observe(el);});}
  window.addEventListener('scroll',mostrar,{passive:true});mostrar();})();
</script>
	<?php
}, 40 );

/* ---------- 12. Página 404 con el diseño propio y en español ---------- */
add_filter( 'body_class', function ( $cl ) {
	if ( is_404() ) {
		$cl[] = 'tc-landing';
		$cl[] = 'tc-archivo';
	}
	return $cl;
} );
add_filter( 'rank_math/frontend/title', function ( $t ) {
	return is_404() ? 'Página no encontrada | Transforma con IA' : $t;
} );
add_action( 'template_redirect', function () {
	if ( ! is_404() ) {
		return;
	}
	status_header( 404 );
	nocache_headers();
	$ir = array(
		'/'               => 'Inicio',
		'/industria/'     => 'IA para la industria',
		'/erp-industria/' => 'ERP para la industria',
		'/soluciones/'    => 'Soluciones y precios',
		'/casos/'         => 'Casos',
		'/blog/'          => 'Blog',
	);
	get_header();
	echo '<div class="tc">';
	echo '<header class="tc-hero tc-pagehead"><div class="tc-wrap tc-hero__grid"><div class="tc-hero__copy">';
	echo '<nav class="tc-crumbs" aria-label="Migas"><a href="' . esc_url( home_url( '/' ) ) . '">Inicio</a><span aria-hidden="true">/</span><span>Error 404</span></nav>';
	echo '<span class="tc-eyebrow">Error 404</span><h1>Esta página no existe o ha cambiado de sitio</h1>';
	echo '<p class="tc-lead">Puede que el enlace esté mal escrito o que hayamos movido el contenido. Busca lo que necesitabas o sigue por alguna de estas secciones.</p>';
	echo '<form class="tc-inline tc-buscar" role="search" action="' . esc_url( home_url( '/' ) ) . '"><input type="search" name="s" placeholder="Buscar en la web…" aria-label="Buscar en la web"><button class="tc-btn tc-btn--ghost" type="submit">Buscar</button></form>';
	echo '<nav class="tc-filtros" aria-label="Secciones" style="padding:22px 0 0;flex-wrap:wrap;overflow:visible">';
	foreach ( $ir as $u => $t ) {
		echo '<a href="' . esc_url( home_url( $u ) ) . '">' . esc_html( $t ) . '</a>';
	}
	echo '</nav></div><aside class="tc-hero__panel"><div class="tc-hero__panel-h"><span>¿Buscabas cómo automatizar algo?</span></div><p style="margin:4px 0 16px">Cuéntanos qué tarea os quita más tiempo y te enviamos por escrito qué se puede automatizar y cuánto costaría.</p><a class="tc-btn" href="' . esc_url( home_url( '/contacto/' ) ) . '">Pedir diagnóstico gratis</a></aside></div></header>';
	$ult = get_posts( array( 'numberposts' => 3, 'post_status' => 'publish' ) );
	if ( $ult ) {
		echo '<section class="tc-sec tc-sec--tight"><div class="tc-wrap"><h2 style="margin-bottom:22px">Lo último del blog</h2><div class="tc-rejilla">';
		foreach ( $ult as $p ) {
			echo tc_tarjeta( $p, '', 'medium_large', 20 );
		}
		echo '</div></div></section>';
	}
	echo '</div>';
	get_footer();
	exit;
}, 20 );

/* ---------- 13. (retirada) /blog/ ya sale en el mapa de entradas de Rank Math; añadirla también al de páginas la duplicaba ---------- */

/* ---------- 14. Seguridad básica ---------- */
/* La API no publica la lista de usuarios a quien no ha iniciado sesión (daba el nombre de acceso del administrador) */
add_filter( 'rest_endpoints', function ( $e ) {
	if ( ! is_user_logged_in() ) {
		unset( $e['/wp/v2/users'], $e['/wp/v2/users/(?P<id>[\d]+)'] );
	}
	return $e;
} );
add_action( 'send_headers', function () {
	if ( is_admin() ) {
		return;
	}
	header( 'X-Content-Type-Options: nosniff' );
	header( 'X-Frame-Options: SAMEORIGIN' );
	header( 'Referrer-Policy: strict-origin-when-cross-origin' );
	header( 'Strict-Transport-Security: max-age=31536000' );
	header( 'Permissions-Policy: camera=(), microphone=(), geolocation=()' );
} );

/* ---------- 15. Avatar del autor = icono de la marca (sin Gravatar: ni muñeco gris ni petición a un servidor externo) ---------- */
add_filter( 'pre_get_avatar_data', function ( $args ) {
	if ( is_admin() ) {
		return $args;
	}
	$icono = get_site_icon_url( max( 96, (int) ( $args['size'] ?? 96 ) * 2 ) );
	if ( $icono ) {
		$args['url']          = $icono;
		$args['found_avatar'] = true;
	}
	return $args;
} );

/* ---------- 16. Aviso «desliza» sobre los carruseles de la portada en el móvil ---------- */
add_action( 'wp_footer', function () {
	if ( ! is_front_page() ) {
		return;
	}
	?>
<script id="tc-desliza-js">
(function(){document.querySelectorAll('.tc-home .tc-sec>.tc-wrap>.tc-grid--3,.tc-home .tc-sec>.tc-wrap>.tc-grid--4,.tc-home .tc-sect4').forEach(function(g){
  var n=g.children.length;if(n<2)return;var d=document.createElement('p');d.className='tc-desliza';d.setAttribute('aria-hidden','true');d.textContent='Desliza para ver las '+n+' →';g.parentNode.insertBefore(d,g);});})();
</script>
	<?php
}, 41 );

/* ---------- 17. Leer opciones del tema por nombre (solo administradores): GET tc/v1/tema?q=transition ---------- */
add_action( 'rest_api_init', function () {
	register_rest_route( 'tc/v1', '/tema', array(
		'methods'             => 'GET',
		'permission_callback' => function () {
			return current_user_can( 'manage_options' );
		},
		'callback'            => function ( $req ) {
			$q   = sanitize_text_field( (string) $req->get_param( 'q' ) );
			$out = array();
			foreach ( (array) get_option( 'salient_redux', array() ) as $k => $v ) {
				if ( '' === $q || false !== stripos( $k, $q ) ) {
					$out[ $k ] = is_scalar( $v ) ? $v : wp_json_encode( $v );
				}
			}
			return $out;
		},
	) );
} );

/* ---------- 18. Ajustes de Rank Math desde la API (solo administradores): GET/POST tc/v1/rm ---------- */
add_action( 'rest_api_init', function () {
	$permitidas = array( 'general' => 'rank-math-options-general', 'titles' => 'rank-math-options-titles', 'sitemap' => 'rank-math-options-sitemap' );
	register_rest_route( 'tc/v1', '/rm', array(
		'methods'             => array( 'GET', 'POST' ),
		'permission_callback' => function () {
			return current_user_can( 'manage_options' );
		},
		'callback'            => function ( $req ) use ( $permitidas ) {
			$p = $req->get_json_params();
			$k = $req->get_param( 'o' );
			if ( 'POST' === $req->get_method() ) {
				$k = isset( $p['o'] ) ? $p['o'] : '';
			}
			if ( ! isset( $permitidas[ $k ] ) ) {
				return new WP_Error( 'opcion', 'o = general | titles | sitemap', array( 'status' => 400 ) );
			}
			$o = get_option( $permitidas[ $k ], array() );
			if ( 'POST' === $req->get_method() && ! empty( $p['set'] ) && is_array( $p['set'] ) ) {
				$o = array_merge( (array) $o, $p['set'] );
				update_option( $permitidas[ $k ], $o );
			}
			return (object) $o;
		},
	) );
} );


/* ---------- 19. Blog en tres categorías (2026-10-13) ---------- */
/* Título y descripción de Rank Math para los archivos de las tres categorías */
function tc_cats_info() {
	return array(
		'ia-en-la-industria' => array( 'IA en la industria: casos y novedades | Transforma con IA', 'Casos reales de IA en talleres y plantas industriales: visión artificial, mantenimiento, costes y presupuestos. Qué funciona y cómo llevarlo a una pyme.' ),
		'gestion-y-facturacion' => array( 'Gestión y facturación con IA para pymes | Transforma con IA', 'Facturas, albaranes, presupuestos, costes y ROI: cómo quitar el papeleo en una pyme con IA y un programa de gestión, con ejemplos prácticos.' ),
		'actualidad-ia' => array( 'Actualidad de IA para empresas | Transforma con IA', 'Novedades de inteligencia artificial contadas por su impacto práctico: modelos, herramientas, precios y regulación, y qué hacer con ellas en tu empresa.' ),
	);
}
add_filter( 'rank_math/frontend/title', function ( $t ) {
	if ( is_category() ) {
		$i = tc_cats_info();
		$o = get_queried_object();
		if ( $o && isset( $i[ $o->slug ] ) ) {
			$p = max( 1, (int) get_query_var( 'paged' ) );
			return $i[ $o->slug ][0] . ( $p > 1 ? ' (página ' . $p . ')' : '' );
		}
	}
	return $t;
}, 20 );
add_filter( 'rank_math/frontend/description', function ( $d ) {
	if ( is_category() ) {
		$i = tc_cats_info();
		$o = get_queried_object();
		if ( $o && isset( $i[ $o->slug ] ) ) {
			return $i[ $o->slug ][1];
		}
	}
	return $d;
}, 20 );

/* Categorías antiguas (vacías, con 301): si el publicador o el panel crean una entrada con una de ellas, pasa a su equivalente nueva */
add_action( 'rest_after_insert_post', function ( $post ) {
	$mapa = array( 'automatizacion' => 'gestion-y-facturacion', 'sobre-la-ia' => 'gestion-y-facturacion', 'servicios-y-herramientas-de-ia' => 'actualidad-ia', 'noticias-ia' => 'actualidad-ia', 'guias-ia' => 'actualidad-ia', 'trucos-y-consejos-ia' => 'actualidad-ia' );
	$ids  = array();
	foreach ( $mapa as $viejo => $nuevo ) {
		$tv = get_category_by_slug( $viejo );
		$tn = get_category_by_slug( $nuevo );
		if ( $tv && $tn ) {
			$ids[ $tv->term_id ] = $tn->term_id;
		}
	}
	$act = wp_get_post_categories( $post->ID );
	$nue = array();
	foreach ( $act as $c ) {
		$nue[] = isset( $ids[ $c ] ) ? $ids[ $c ] : $c;
	}
	$nue = array_values( array_unique( $nue ) );
	if ( $nue !== $act ) {
		wp_set_post_categories( $post->ID, $nue );
	}
}, 20 );

/* ---------- 20. Migas de pan (Rank Math: pantalla + esquema BreadcrumbList) ---------- */
/* Página de entradas = «Blog»; las páginas de servicio cuelgan de «Soluciones» (igual que las migas escritas a mano en cada página) */
add_filter( 'rank_math/frontend/breadcrumb/items', function ( $crumbs ) {
	foreach ( $crumbs as $k => $c ) {
		if ( isset( $c[1] ) && trailingslashit( (string) $c[1] ) === home_url( '/blog/' ) ) {
			$crumbs[ $k ][0] = 'Blog';
		}
	}
	if ( is_page( array( 'automatizacion-procesos-ia', 'agentes-chatbots-ia', 'gestion-documental-ia', 'desarrollo-a-medida-ia', 'contenido-automatico-ia', 'diseno-web' ) ) && count( $crumbs ) >= 2 ) {
		array_splice( $crumbs, 1, 0, array( array( 'Soluciones', home_url( '/soluciones/' ) ) ) );
	}
	return $crumbs;
}, 20 );
/* En los artículos se muestran, discretas, justo antes del contenido. En las páginas de servicio ya están escritas en su cabecera. */
add_filter( 'the_content', function ( $c ) {
	if ( ! is_singular( 'post' ) || ! in_the_loop() || ! is_main_query() || ! function_exists( 'rank_math_get_breadcrumbs' ) ) {
		return $c;
	}
	$m = rank_math_get_breadcrumbs( array( 'wrap_before' => '<nav class="tc-migas" aria-label="Migas de pan"><p>', 'wrap_after' => '</p></nav>', 'before' => '', 'after' => '', 'separator' => '<span aria-hidden="true"> / </span>' ) );
	return ( is_string( $m ) ? $m : '' ) . $c;
}, 5 );

/* Portada «Tus datos, conectados» (v7, 30-10-2026): acoplamiento de garras que encaja al bajar (y enciende el titular), documentos
 * que salen de la unión y la IA lee, y pantalla del ERP donde acaba todo. Antes («Del plano a la factura», 29-10-2026, v4): engranajes en 3D realista (acero torneado, sombras) sobre fondos
 * fotográficos desenfocados que cambian en cada paso. La historia va POR PASOS (un golpe de rueda o un deslizamiento
 * = un paso): plano en líneas → el escáner lo reconstruye en acero → presupuesto → despiece → la máquina se monta
 * alrededor y los engranajes quedan dentro, girando.
 * - La clase tc-3d se pone en <head> (sin reducir movimiento ni ahorro de datos, con WebGL) y se protege porque
 *   Salient reescribe las clases de <html>. Sin ella: foto de cabecera y rejilla normal de 5 pasos.
 * - El texto y los pasos los lleva un script normal; la librería 3D se carga aparte, después de la carga. */
add_action( 'wp_head', function () {
	if ( ! is_front_page() ) {
		return;
	}
	?>
<link rel="modulepreload" href="https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js" crossorigin fetchpriority="low">
<script>(function(){try{var d=document.documentElement;if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;if(navigator.connection&&navigator.connection.saveData)return;if(!window.WebGLRenderingContext)return;var on=function(){if(!d.classList.contains('tc-3d'))d.classList.add('tc-3d');};on();var mo=new MutationObserver(on);mo.observe(d,{attributes:true,attributeFilter:['class']});addEventListener('load',function(){setTimeout(function(){mo.disconnect();on();},1500);});}catch(e){}})()</script>
	<?php
}, 1 );
add_action( 'wp_footer', function () {
	if ( ! is_front_page() ) {
		return;
	}
	?>
<script id="tc-story-js">
(function(){
  var d=document.documentElement,z=document.querySelector('.tc-3dz');
  if(!z||!d.classList.contains('tc-3d'))return;
  var st=z.querySelector('.tc-story'),he=z.querySelector('.tc-hero'),bar=st.querySelector('.tc-story__bar i'),pin=z.querySelector('.tc-3dz__pin');
  // en la historia ya no hay fotos detrás (se veían a través de los planos): solo la de la cabecera, que se apaga al entrar
  var esc=[].slice.call(pin.querySelectorAll('.tc-esc[data-t="-1"]'));
  // 3 paradas (K) sobre las 5 escenas del 3D (N): plano → presupuesto → máquina montada; las intermedias se ven al pasar
  var m={},q=0,N=4,K=2,mob=matchMedia('(max-width:820px)').matches,tactil=mob||matchMedia('(hover:none) and (pointer:coarse)').matches;
  // en móviles y tabletas el paso a paso lo hace el propio navegador (scroll-snap): mover el scroll por código
  // mientras el dedo y la inercia también lo mueven dejaba la pantalla en blanco en Safari
  if(tactil)d.classList.add('tc-snap');
  var cl=function(v){return v<0?0:v>1?1:v;},L=function(a,b,t){return a+(b-a)*t;},suave=function(v){v=cl(v);return v*v*(3-2*v);};
  window.tcStory={p:0,h:0,paso:0};
  // pasos bien visibles: riel 1-5 encima del texto, «Paso 02 de 05» grande y aviso de que abajo sigue
  var txt=st.querySelector('.tc-story__txt'),ol=st.querySelector('.tc-story__steps'),rail=document.createElement('ol'),tCam=0;
  rail.className='tc-rail';rail.setAttribute('aria-label','Pasos');
  var lab=['Conecta','Lee','Ordena'];z.setAttribute('data-paso',0);
  for(var i=0;i<=K;i++)rail.insertAdjacentHTML('beforeend','<li><button type="button" data-k="'+i+'" aria-label="Paso '+(i+1)+'"'+(tactil?' tabindex="-1" style="pointer-events:none"':'')+'><span class="tc-rail__n">0'+(i+1)+'</span><span class="tc-rail__t">'+(lab[i]||'')+'</span></button></li>');
  ol.parentNode.insertBefore(rail,ol);
  st.querySelectorAll('.tc-story__n').forEach(function(n,i){n.innerHTML='Paso <span class="tc-num">0'+(i+1)+'</span> de 0'+(K+1);});
  var sig=document.createElement('div');sig.className='tc-sigue';sig.setAttribute('aria-hidden','true');
  sig.innerHTML='<span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg><i style="font-style:normal">Baja: '+lab[1]+'</i></span>'+(tactil?'':'<a href="#" tabindex="-1">Saltar</a>');
  txt.appendChild(sig);
  function marcar(n){[].forEach.call(rail.children,function(li,i){li.classList.toggle('is-on',i===n);li.classList.toggle('is-hecho',i<n);});
    if(n<K)sig.querySelector('i').textContent=(n?'Siguiente':'Baja')+': '+lab[n+1];
    txt.classList.add('is-cambio');clearTimeout(tCam);tCam=setTimeout(function(){txt.classList.remove('is-cambio');},420);}
  marcar(0);
  // fondos de los pasos: después de la carga, la versión del tamaño de la pantalla
  addEventListener('load',function(){setTimeout(function(){esc.forEach(function(i){var s=(mob&&i.getAttribute('data-srcm'))||i.getAttribute('data-src');if(s&&!i.src)i.src=s;});},200);});
  var pos=function(k){return m.st+(k/K)*(m.sh-m.vh);};
  function medir(){var y=scrollY;m.ht=he.getBoundingClientRect().top+y;m.hh=he.offsetHeight;m.st=st.getBoundingClientRect().top+y;m.sh=st.offsetHeight;m.vh=innerHeight;m.fin=pos(K);
    // hueco libre para la pieza en el móvil: DEBAJO del texto de la cabecera (primero se lee el titular) y, en la historia,
    // entre la tarjeta de texto (arriba) y la de datos (abajo); los dos huecos quedan a media altura y la pieza apenas se mueve
    var zt=z.getBoundingClientRect().top,cp=he.querySelector('.tc-hero__copy'),sp=st.querySelector('.tc-story__pin'),tx=st.querySelector('.tc-story__txt'),ht=1e9,spt=sp.getBoundingClientRect().top;
    st.querySelectorAll('.tc-hud__box').forEach(function(b){ht=Math.min(ht,b.getBoundingClientRect().top-spt);});
    var hu={h0:cp.getBoundingClientRect().bottom-zt+10,h1:Math.min(he.getBoundingClientRect().bottom-zt,m.vh)-14,s0:tx.getBoundingClientRect().bottom-spt+6,s1:ht-6};
    if(mob&&hu.h1-hu.h0<120)hu.h0=hu.h1-120;
    // en escritorio: rectángulo libre a la derecha del texto y encima de la tarjeta de datos, para que nada tape la pieza
    if(!mob){var tr=tx.getBoundingClientRect();hu.d={x0:tr.right+32,x1:innerWidth-40,y0:84,y1:ht-20};}
    if(!(hu.h1-hu.h0>100)){hu.h0=m.vh*.6;hu.h1=m.vh*.94;}if(!(hu.s1-hu.s0>90)){hu.s0=m.vh*.42;hu.s1=m.vh*.78;}
    window.tcStory.hueco=hu;
    upd();}
  function upd(){q=0;var y=scrollY,s=window.tcStory;s.h=cl((y-m.ht)/Math.max(1,m.hh*.85));s.p=cl((y-m.st)/Math.max(1,m.sh-m.vh));
    var n=Math.round(s.p*K);if(n!==s.paso){s.paso=n;st.setAttribute('data-paso',n*N/K);z.setAttribute('data-paso',n);marcar(n);}
    bar.style.transform='scaleX('+s.p.toFixed(4)+')';
    // el ajuste por pasos solo dentro de la historia: al bajar desde el último paso se apaga y la página sigue normal
    // encendido desde lo alto de la página: si solo se encendía al llegar a la historia, un deslizamiento con fuerza desde la
    // cabecera se pasaba el paso 1 antes de que el navegador empezara a ajustar y caía en el 2
    if(tactil){var on=y<=m.fin+2;if(on!==m.on){m.on=on;d.classList.toggle('tc-snap-on',on);}}
    // «Tus datos, conectados»: la palabra se enciende cuando las dos mitades del acoplamiento encajan (el 3D usa el mismo avance)
    var con=s.h>.8;if(con!==m.con){m.con=con;z.classList.toggle('is-conectado',con);}
    var den=y>m.st-m.vh*.5&&y<m.fin+m.vh*.5;if(den!==m.den){m.den=den;document.body.classList.toggle('tc-en-historia',den);}
    pedir();}
  // fondos: t va de -1 (cabecera) a N (último paso); cada foto entra con fundido y un zoom que se asienta
  var raf=0,ts=-1;
  function pedir(){if(!raf)raf=requestAnimationFrame(pintar);}
  function pintar(){raf=0;var S=window.tcStory,t=-1+suave(S.h)+S.p*N;ts=L(ts,t,.16);
    for(var k=0;k<esc.length;k++){var e=esc[k],dd=ts-(+e.getAttribute('data-t')),a=cl(1-Math.abs(dd));
      if(a<=.001){if(e._a!==0){e.style.opacity=0;e.style.visibility='hidden';e._a=0;}continue;}if(!e._a)e.style.visibility='visible';e._a=a;
      e.style.opacity=a.toFixed(3);e.style.transform='scale('+(1.04+.1*(1-a)).toFixed(4)+')';}
    if(Math.abs(ts-t)>.002)pedir();}
  // paso a paso: un golpe de rueda o un deslizamiento = un paso, con transición animada
  var anim=false,finA=0,espera=false,ultW=0,toca=false,ty=null,yIni=0,yAnt=scrollY,tFin=0;
  var dentro=function(y){return y>=m.st-6&&y<=m.fin+6;};
  var actual=function(){return Math.round(window.tcStory.p*K);};
  var sale=function(dir,y){return (dir>0&&actual()>=K&&y>=m.fin-6)||(dir<0&&actual()<=0&&y<=m.st+6);};
  function ir(k){k=Math.max(0,Math.min(K,k));var y0=scrollY,y1=Math.round(pos(k)),t0=performance.now(),D=Math.min(850,480+Math.abs(y1-y0)*.22);
    if(Math.abs(y1-y0)<2)return;anim=true;espera=true;
    (function f(t){var x=Math.min(1,(t-t0)/D),e=x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;scrollTo(0,y0+(y1-y0)*e);
      if(x<1)requestAnimationFrame(f);else{anim=false;finA=performance.now();}})(t0);}
  if(!tactil)addEventListener('wheel',function(e){if(e.ctrlKey)return;var y=scrollY,now=performance.now(),gap=now-ultW;ultW=now;
    if(!dentro(y))return;var dir=e.deltaY>0?1:e.deltaY<0?-1:0;if(!dir||sale(dir,y))return;
    e.preventDefault();if(anim)return;
    // la inercia del trackpad sigue mandando eventos: no cuentan como otro golpe hasta que haya una pausa
    if(espera){if(gap>160||now-finA>900)espera=false;else return;}
    ir(actual()+dir);},{passive:false});
  if(!tactil){addEventListener('touchstart',function(e){toca=true;ty=e.touches[0].clientY;yIni=scrollY;},{passive:true});
  addEventListener('touchmove',function(e){if(ty===null)return;var y=scrollY;if(!dentro(y))return;var dy=ty-e.touches[0].clientY;if(Math.abs(dy)<2)return;
    if(sale(dy>0?1:-1,y))return;if(e.cancelable)e.preventDefault();},{passive:false});
  addEventListener('touchend',function(e){toca=false;if(ty===null)return;var dy=ty-e.changedTouches[0].clientY;ty=null;var y=scrollY;
    if(!dentro(y)||anim)return;var dir=dy>0?1:-1;
    // si el gesto empezó fuera de la historia, se entra por el primer (o el último) paso
    if(dir>0&&yIni<m.st-6){ir(0);return;}if(dir<0&&yIni>m.fin+6){ir(K);return;}
    if(Math.abs(dy)<24||sale(dir,y))return;ir(actual()+dir);},{passive:true});}
  addEventListener('scroll',function(){if(!q)q=requestAnimationFrame(upd);var y=scrollY;
    // si llega lanzado desde arriba o desde abajo, se para en el primer o último paso
    if(!tactil&&!anim&&!toca&&m.st){if(yAnt<m.st-2&&y>m.st+2&&y<m.fin)ir(0);else if(yAnt>m.fin+2&&y<m.fin-2&&y>m.st)ir(K);}
    yAnt=y;clearTimeout(tFin);
    // al parar a medias (teclado, barra de scroll) se coloca en el paso más cercano
    if(!tactil)tFin=setTimeout(function(){var y=scrollY;if(anim||toca||!(y>m.st+6&&y<m.fin-6))return;var k=Math.round((y-m.st)/(m.fin-m.st)*K);if(Math.abs(y-pos(k))>6)ir(k);},180);},{passive:true});
  if(!tactil){rail.addEventListener('click',function(e){var b=e.target.closest('button');if(b)ir(+b.getAttribute('data-k'));});
  // «Saltar»: a la sección siguiente, sin pasar por los pasos
  sig.querySelector('a').addEventListener('click',function(e){e.preventDefault();anim=true;scrollTo({top:m.fin+m.vh,behavior:'smooth'});setTimeout(function(){anim=false;},1400);});}
  var anchoAnt=innerWidth;addEventListener('resize',function(){if(!tactil||innerWidth!==anchoAnt){anchoAnt=innerWidth;medir();}});addEventListener('load',medir);medir();setTimeout(medir,1200);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(medir);
})();
</script>
<script id="tc-foco-js">
/* v8 (10-11-2026): foco de luz que sigue al ratón en las tarjetas (solo con ratón y sin reducir movimiento) */
(function(){if(!matchMedia('(hover:hover) and (pointer:fine)').matches||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  document.querySelectorAll('.tc-home .tc-demo,.tc-home .tc-fsol,.tc-home .tc-card').forEach(function(c){c.classList.add('tc-foco');
    c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--fx',(e.clientX-r.left)+'px');c.style.setProperty('--fy',(e.clientY-r.top)+'px');},{passive:true});});})();
</script>
<script type="module" id="tc-3d-js">
const d=document.documentElement,stage=document.getElementById('tc-3d');
if(stage&&d.classList.contains('tc-3d')){
  const go=()=>import('https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js').then(init).catch(()=>{});
  const tarde=()=>('requestIdleCallback' in window)?requestIdleCallback(go,{timeout:600}):setTimeout(go,200);
  if(document.readyState!=='loading')tarde();else addEventListener('DOMContentLoaded',tarde,{once:true});
}
function init(T){
  const mob=matchMedia('(max-width:820px)').matches,raton=matchMedia('(hover:hover) and (pointer:fine)').matches;
  let r;try{r=new T.WebGLRenderer({antialias:!mob,alpha:true,powerPreference:'high-performance'});}catch(e){return;}
  // resolución: empieza alta y baja sola si el equipo no llega a 60 fps (ver «adaptar» en frame)
  // (no en el móvil ni en Safari: WebKit deja el lienzo en blanco si se cambia de tamaño en marcha)
  const safari=/^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent),adapta=!mob&&!safari;
  let dpr=Math.min(devicePixelRatio||1,mob?1.5:2);r.setPixelRatio(dpr);r.outputColorSpace=T.SRGBColorSpace;
  r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.02;
  stage.appendChild(r.domElement);
  // si el teléfono se queda sin memoria gráfica, se oculta y se recupera solo
  let perdido=false;r.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();perdido=true;stage.classList.remove('is-ready');},false);
  r.domElement.addEventListener('webglcontextrestored',()=>{perdido=false;listo=false;pedir();},false);
  const sc=new T.Scene(),cam=new T.PerspectiveCamera(30,1,.1,100);cam.position.set(0,0,10);
  // estudio de luz: cajas de luz cálidas y frías y un contraluz violeta, para reflejos de acero creíbles
  const pm=new T.PMREMGenerator(r),es=new T.Scene();
  es.add(new T.Mesh(new T.SphereGeometry(30,32,16),new T.MeshBasicMaterial({color:0x1d1a24,side:T.BackSide})));
  const panelLuz=(c,k,x,y,z,w,h)=>{const p=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(c).multiplyScalar(k),side:T.DoubleSide}));p.position.set(x,y,z);p.lookAt(0,0,0);es.add(p);};
  panelLuz(0xfff1e0,1.05,0,9,1,10,2.5);panelLuz(0xf4ecff,1.5,0,6,-7,14,5);panelLuz(0xffa860,3.2,-8,2,4,2.5,8);panelLuz(0xb98cff,1.5,8,0,-2,2.5,8);panelLuz(0xffffff,2.4,7,4,3,3,6);panelLuz(0xffffff,1.8,2,-1,9,8,1.5);panelLuz(0x6a4cff,.7,-3,-6,-4,8,2);
  sc.environment=pm.fromScene(es,.03).texture;sc.environmentIntensity=1.45;pm.dispose();
  const key=new T.DirectionalLight(0xffe2c4,2.4);key.position.set(-3,6,4);sc.add(key);sc.add(key.target);
  const rim=new T.PointLight(0xb020ff,16,30);rim.position.set(4,2,-3);sc.add(rim);
  const D=Math.PI/180,aniso=Math.min(8,r.capabilities.getMaxAnisotropy());
  // marcas de torneado (anillos) como mapa de rugosidad: el acero deja de parecer de plástico
  const anillos=()=>{const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle='#8c8c8c';x.fillRect(0,0,512,512);
    for(let rr=1;rr<256;rr+=1.1){const g=120+Math.random()*100|0;x.strokeStyle='rgba('+g+','+g+','+g+',.6)';x.lineWidth=.5+Math.random()*.9;x.beginPath();x.arc(256,256,rr,0,7);x.stroke();}
    return new T.CanvasTexture(c);};
  const rug=anillos();
  const acero=new T.MeshStandardMaterial({color:0xe2dfe8,metalness:1,roughness:.4,roughnessMap:rug});
  const acero2=new T.MeshStandardMaterial({color:0xc4c7d4,metalness:1,roughness:.36,roughnessMap:rug});
  const pulido=new T.MeshStandardMaterial({color:0xeeeef4,metalness:1,roughness:.16});
  const oscuro=new T.MeshStandardMaterial({color:0x2a2630,metalness:.8,roughness:.5});
  // la estrella elástica del acoplamiento, en el violeta de la marca
  const goma=new T.MeshStandardMaterial({color:0x7a2bd6,metalness:0,roughness:.5,emissive:0x2a0650,emissiveIntensity:.6});
  const aditivo=o=>new T.MeshBasicMaterial(Object.assign({color:0xd27bff,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,toneMapped:false},o));
  const rig=new T.Group();sc.add(rig);

  /* ---- 1. el acoplamiento de garras: dos mitades (cubo + 3 garras + eje) y la estrella en medio ----
     cada mitad se construye a lo largo de su eje Y y se tumba sobre el eje X; las garras de una caen en los huecos de la otra */
  const sector=(r0,r1,a0,a1)=>{const s=new T.Shape();s.absarc(0,0,r1,a0,a1,false);s.absarc(0,0,r0,a1,a0,true);s.closePath();return s;};
  const garrasG=new T.ExtrudeGeometry([0,120,240].map(c=>sector(.27,.55,(c-25)*D,(c+25)*D)),{depth:.38,bevelEnabled:true,bevelThickness:.014,bevelSize:.012,bevelSegments:2,curveSegments:18});
  garrasG.rotateX(-Math.PI/2);garrasG.translate(0,.8,0);
  const cuboG=new T.LatheGeometry([[.2,0],[.5,0],[.55,.05],[.55,.75],[.52,.8],[.2,.8]].map(([x,y])=>new T.Vector2(x,y)),64);
  const ejeG=new T.CylinderGeometry(.2,.2,.62,40);ejeG.translate(0,-.31,0);
  const prisioneroG=new T.CylinderGeometry(.055,.055,.04,16);prisioneroG.rotateX(Math.PI/2);prisioneroG.translate(0,.4,.548);
  const estrellaG=(()=>{const s=new T.Shape(),p=[],h=4*D;
    for(let k=0;k<6;k++){const c=(30+60*k)*D,n=(90+60*k)*D;p.push([.27,c-h],[.545,c-h],[.545,c+h],[.27,c+h]);for(let j=1;j<6;j++)p.push([.27,c+h+(n-h-c-h)*j/6]);}
    p.forEach(([rr,a],i)=>i?s.lineTo(rr*Math.cos(a),rr*Math.sin(a)):s.moveTo(rr*Math.cos(a),rr*Math.sin(a)));s.closePath();
    const hu=new T.Path();hu.absarc(0,0,.12,0,Math.PI*2,true);s.holes.push(hu);
    const g=new T.ExtrudeGeometry(s,{depth:.36,bevelEnabled:true,bevelThickness:.02,bevelSize:.012,bevelSegments:2});g.rotateX(-Math.PI/2);g.translate(0,.81,0);return g;})();
  const acople=new T.Group();rig.add(acople);
  const mitad=(mat,giro)=>{const g=new T.Group(),inn=new T.Group();g.rotation.z=giro;g.add(inn);acople.add(g);
    inn.add(new T.Mesh(cuboG,mat),new T.Mesh(garrasG,mat),new T.Mesh(ejeG,pulido),new T.Mesh(prisioneroG,oscuro));return {g,inn};};
  const A=mitad(acero,-Math.PI/2),B=mitad(acero2,Math.PI/2);
  const estrella=new T.Mesh(estrellaG,goma);A.inn.add(estrella);
  // pulso de luz en la unión al encajar, y sombra de contacto pintada
  // tres ondas seguidas al encajar (con una sola, si no estabas mirando, se te pasaba)
  const anilloG=new T.RingGeometry(.6,.65,96),pulsos=[0,1,2].map(()=>{const m=new T.Mesh(anilloG,aditivo({color:0xf0d4ff}));m.rotation.y=Math.PI/2;acople.add(m);return m;});
  const brillo=new T.Mesh(new T.CircleGeometry(.62,64),aditivo({color:0xb020ff}));brillo.rotation.y=Math.PI/2;acople.add(brillo);
  const c0=document.createElement('canvas');c0.width=c0.height=128;{const x=c0.getContext('2d'),g=x.createRadialGradient(64,64,4,64,64,64);g.addColorStop(0,'rgba(0,0,0,.8)');g.addColorStop(.5,'rgba(0,0,0,.35)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128);}
  /* v8 (10-11-2026): flujo de datos que atraviesa el acoplamiento: entra por «Tu empresa», se enciende al pasar por la IA
     (la estrella) y sale hacia «Optimización». Puntos de luz en la CPU (pocos), un solo dibujado */
  const NF=mob?70:150,fx=new Float32Array(NF*3),fc=new Float32Array(NF*3),fd=[];
  for(let i=0;i<NF;i++)fd.push({x:Math.random()*6.4-3.2,a:Math.random()*6.283,r:.62+Math.random()*.4,v:.6+Math.random()*.9,f:Math.random()*6.283});
  const flujoG=new T.BufferGeometry();flujoG.setAttribute('position',new T.BufferAttribute(fx,3));flujoG.setAttribute('color',new T.BufferAttribute(fc,3));
  const cP=document.createElement('canvas');cP.width=cP.height=64;{const x=cP.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.75)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);}
  const flujoM=new T.PointsMaterial({size:mob?.13:.11,map:new T.CanvasTexture(cP),vertexColors:true,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false});
  const flujo=new T.Points(flujoG,flujoM);flujo.frustumCulled=false;acople.add(flujo);
  const cFr=new T.Color(0x8a6cff),cIA=new T.Color(0xfff0ff),cSal=new T.Color(0xd27bff),cTmp=new T.Color();
  const manchaTx=new T.CanvasTexture(c0),mancha=new T.Mesh(new T.PlaneGeometry(3.6,1.3),new T.MeshBasicMaterial({map:manchaTx,transparent:true,depthWrite:false}));mancha.rotation.x=-Math.PI/2;mancha.position.y=-.78;acople.add(mancha);

  /* ---- 2. los documentos (factura, albarán, pedido) pintados en un lienzo; datos ficticios ---- */
  const FS='"Open Sans",Arial,sans-serif',FD='Poppins,Arial,sans-serif';
  const lienzo=(w,h,pinta)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=aniso;
    const dib=()=>{x.clearRect(0,0,w,h);x.textAlign='left';pinta(x,w,h);tx.needsUpdate=true;};dib();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(dib);return tx;};
  const der=(x,t,X,Y)=>{x.textAlign='right';x.fillText(t,X,Y);x.textAlign='left';};
  const papel=(tit,num,ca,cb,lineas,tot,firma)=>lienzo(512,724,(x,w)=>{
    x.fillStyle='#fbfaff';x.fillRect(0,0,w,724);x.fillStyle='#7c1fd1';x.fillRect(0,0,w,8);
    x.fillStyle='#1b1622';x.font='700 32px '+FD;x.fillText(tit,34,66);
    x.font='600 16px '+FS;x.fillStyle='#7a7287';x.fillText(num,34,94);der(x,'Ejemplo ficticio',w-34,94);
    x.fillStyle='#ece3fb';x.fillRect(w-120,36,86,30);x.fillStyle='#9b6fd6';x.font='700 13px '+FS;x.fillText('EMPRESA',w-112,56);
    const campo=([l,v],X)=>{x.font='600 15px '+FS;x.fillStyle='#8a8296';x.fillText(l,X,158);x.font='700 21px '+FS;x.fillStyle='#1b1622';x.fillText(v,X,186);};
    campo(ca,34);campo(cb,336);
    x.fillStyle='#efeaf6';x.fillRect(34,224,w-68,30);x.font='700 13px '+FS;x.fillStyle='#6b6478';x.fillText('CONCEPTO',46,244);der(x,tot.length?'IMPORTE':'CANTIDAD',w-46,244);
    lineas.forEach(([a,b],i)=>{const Y=290+i*40;x.font='500 16px '+FS;x.fillStyle='#3a3344';x.fillText(a,46,Y);der(x,b,w-46,Y);x.fillStyle='#eee9f4';x.fillRect(34,Y+14,w-68,1.5);});
    x.font='500 15px '+FS;x.fillStyle='#8a8296';x.fillText(firma?'Mercancía revisada en la entrega':'Vencimiento a 30 días · transferencia',34,446);
    tot.forEach(([a,b],i)=>{const last=i===tot.length-1,Y=548+i*34+(last?8:0);if(last){x.fillStyle='#e3dcec';x.fillRect(250,Y-30,w-284,1.5);}
      x.font=(last?'700 21px ':'500 16px ')+FS;x.fillStyle=last?'#1b1622':'#4a4356';x.fillText(a,256,Y);der(x,b,w-46,Y);});
    if(firma){x.font='600 15px '+FS;x.fillStyle='#8a8296';x.fillText('Recibido',300,560);x.strokeStyle='#4b2a8a';x.lineWidth=2.5;x.beginPath();x.moveTo(300,620);
      x.bezierCurveTo(330,580,350,640,380,600);x.bezierCurveTo(400,575,420,640,450,598);x.stroke();}});
  const DW=1.06,DH=1.5,docUV=(px,py)=>new T.Vector3((px/512-.5)*DW,(.5-py/724)*DH,.009);
  const borde=new T.MeshBasicMaterial({color:0xbfb9ca,toneMapped:false}),docG=new T.BoxGeometry(DW,DH,.014);
  const texs=[papel('FACTURA','F-2291',['Proveedor','Aceros Demo SL'],['Fecha','14/11/2026'],[['Barra 42CrMo4 Ø50','620,00 €'],['Chapa S275 10 mm','410,00 €'],['Corte y transporte','210,00 €']],[['Base imponible','1.240,00 €'],['IVA 21 %','260,40 €'],['Total','1.500,40 €']]),
    papel('ALBARÁN','ALB-0874',['Cliente','Talleres Demo SL'],['Entrega','13/11/2026'],[['Barra 42CrMo4 Ø50','4 ud'],['Chapa S275 10 mm','2 ud'],['Palé','1 ud']],[],true),
    papel('PEDIDO','PED-1203',['Proveedor','Aceros Demo SL'],['Plazo','10 días'],[['Barra 42CrMo4 Ø50','620,00 €'],['Chapa S275 10 mm','410,00 €'],['Corte y transporte','210,00 €']],[['Total pedido','1.240,00 €']])];
  const docs=texs.map(tx=>{const g=new T.Group();g.add(new T.Mesh(docG,[borde,borde,borde,borde,new T.MeshBasicMaterial({map:tx,toneMapped:false,color:0xe8e4ee}),borde]));rig.add(g);return g;});
  // dónde queda cada documento en el paso 2: la factura delante y los otros dos abiertos en abanico
  const TG=[{p:new T.Vector3(0,.5,.35),ry:0,rz:0},{p:new T.Vector3(-1.12,.42,0),ry:.34,rz:.05},{p:new T.Vector3(1.12,.42,0),ry:-.34,rz:-.05}];
  // en el móvil el abanico se cierra un poco: así los tres documentos salen más grandes en el mismo ancho
  // y se centran en el hueco (en el escritorio van un poco más arriba para dejar el acoplamiento debajo)
  if(mob){TG[1].p.x=-.8;TG[2].p.x=.8;TG[1].ry=.26;TG[2].ry=-.26;TG.forEach(g=>g.p.y-=.45);}
  // escáner que recorre la factura y recuadros de los campos que la IA lee (con su etiqueta en HTML)
  const haz=new T.Group(),hazL=new T.Mesh(new T.PlaneGeometry(DW*1.06,.016),aditivo({color:0xf6e6ff})),hazH=new T.Mesh(new T.PlaneGeometry(DW*1.06,.2),aditivo({color:0xb020ff}));
  haz.add(hazH,hazL);haz.position.z=.012;docs[0].add(haz);
  const campos=[[24,136,324,198],[328,136,488,198],[244,512,488,640]].map(([x0,y0,x1,y1])=>{const a=docUV(x0,y0),b=docUV(x1,y1),g=new T.Group();
    const caja=new T.Mesh(new T.PlaneGeometry(b.x-a.x,a.y-b.y),aditivo({color:0xb020ff}));const lin=new T.LineSegments(new T.EdgesGeometry(caja.geometry),new T.LineBasicMaterial({color:0xd27bff,transparent:true,opacity:0,toneMapped:false}));
    g.add(caja,lin);g.position.set((a.x+b.x)/2,(a.y+b.y)/2,.011);docs[0].add(g);return {g,caja,lin,y:(a.y+b.y)/2,ancla:new T.Vector3(a.x,a.y,.011)};});

  /* ---- 3. la pantalla del ERP donde acaba todo ---- */
  const filas=[['F-2291','Aceros Demo SL','14/11/2026','1.500,40 €','Registrada'],['ALB-0874','Aceros Demo SL','13/11/2026','—','Vinculado'],['PED-1203','Aceros Demo SL','10/11/2026','1.240,00 €','Servido'],['F-2288','Transportes Demo','12/11/2026','320,00 €','Pagada'],['F-2281','Suministros Demo','08/11/2026','86,90 €','Pagada']];
  const erpTx=lienzo(1024,640,(x,w,h)=>{x.fillStyle='#0e0b14';x.fillRect(0,0,w,h);x.fillStyle='#16121e';x.fillRect(0,0,w,58);
    const gr=x.createLinearGradient(20,14,48,42);gr.addColorStop(0,'#d27bff');gr.addColorStop(1,'#6d0fb0');x.fillStyle=gr;x.fillRect(22,15,28,28);
    x.fillStyle='#fff';x.font='600 20px '+FD;x.fillText('IndunexIA Gestión',62,37);x.font='500 14px '+FS;x.fillStyle='#8f86a0';der(x,'Ejemplo ficticio',w-24,36);
    x.fillStyle='#120f19';x.fillRect(0,58,200,h-58);
    ['Inicio','Documentos','Compras','Facturas','Informes'].forEach((t,i)=>{const Y=104+i*46;if(i===1){x.fillStyle='rgba(176,32,255,.28)';x.fillRect(12,Y-26,176,38);}x.font=(i===1?'600 ':'500 ')+'16px '+FS;x.fillStyle=i===1?'#fff':'#9a91aa';x.fillText(t,28,Y);});
    x.fillStyle='#fff';x.font='700 26px '+FD;x.fillText('Documentos de proveedor',230,104);x.font='500 15px '+FS;x.fillStyle='#a99fb8';x.fillText('Leídos con IA · listos para revisar',230,132);
    x.fillStyle='#191422';x.fillRect(220,160,w-244,36);x.font='700 13px '+FS;x.fillStyle='#8f86a0';
    [['DOCUMENTO',236],['PROVEEDOR',380],['FECHA',588],['ESTADO',872]].forEach(([t,X])=>x.fillText(t,X,184));der(x,'IMPORTE',842,184);
    filas.forEach((f,i)=>{const Y=196+56*i+34;x.font='600 16px '+FS;x.fillStyle='#fff';x.fillText(f[0],236,Y);x.font='500 16px '+FS;x.fillStyle='#d6cfe0';x.fillText(f[1],380,Y);x.fillText(f[2],588,Y);der(x,f[3],842,Y);
      x.fillStyle=i<3?'rgba(74,222,128,.16)':'rgba(255,255,255,.07)';x.fillRect(866,Y-21,120,30);x.font='600 14px '+FS;x.fillStyle=i<3?'#4ade80':'#a99fb8';x.fillText('✓ '+f[4],876,Y);
      x.fillStyle='#1d1826';x.fillRect(220,196+56*(i+1),w-244,1.5);});});
  const SW=3.24,SH=2.025,erpUV=(px,py)=>new T.Vector3((px/1024-.5)*SW,(.5-py/640)*SH,.05);
  const pantalla=new T.Group();rig.add(pantalla);pantalla.position.set(0,mob?0:.36,0);
  const marcoM=new T.MeshStandardMaterial({color:0x1d1925,metalness:.7,roughness:.32,transparent:true}),pantM=new T.MeshBasicMaterial({map:erpTx,toneMapped:false,transparent:true});
  pantalla.add(new T.Mesh(new T.BoxGeometry(SW+.12,SH+.12,.08),marcoM));const pl=new T.Mesh(new T.PlaneGeometry(SW,SH),pantM);pl.position.z=.042;pantalla.add(pl);
  const luzFila=filas.slice(0,3).map((f,i)=>{const m=new T.Mesh(new T.PlaneGeometry((1000-220)/1024*SW,56/640*SH*.92),aditivo({color:0xb020ff}));m.position.copy(erpUV(610,196+56*i+28));pantalla.add(m);return m;});

  // etiquetas en HTML que siguen a los campos de la factura
  // rótulos en HTML: los campos que la IA lee en la factura y, en la cabecera, el nombre de cada pieza del acoplamiento
  const caja2=stage.parentNode.querySelector('.tc-3dz__labels'),etq=caja2?[...caja2.querySelectorAll('span:not(.tc-pz)')]:[],pzs=caja2?[...caja2.querySelectorAll('.tc-pz')]:[];
  // anclas (en el acoplamiento): Tu empresa bajo la mitad izquierda, IA encima de la estrella, Optimización bajo la derecha
  const anclaPz=[()=>v3.set(A.g.position.x-.25,-.72,0),()=>v3.set(0,.8+.3*(B.g.position.x-.99)/1.15,0),()=>v3.set(B.g.position.x+.25,-.72,0)];
  let W=1,H=1;
  const medir=()=>{W=stage.clientWidth||1;H=stage.clientHeight||1;r.setSize(W,H,false);cam.aspect=W/H;cam.updateProjectionMatrix();};
  new ResizeObserver(medir).observe(stage);medir();
  let mx=0,my=0,sx=0,sy=0;if(raton)addEventListener('pointermove',e=>{mx=e.clientX/innerWidth*2-1;my=e.clientY/innerHeight*2-1;},{passive:true});
  let vis=true;new IntersectionObserver(es=>{vis=es[0].isIntersecting;if(vis)pedir();}).observe(stage.closest('.tc-3dz'));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)pedir();});
  const L=(a,b,t)=>a+(b-a)*t,cl=v=>v<0?0:v>1?1:v,suave=v=>{v=cl(v);return v*v*(3-2*v);},tramo=(p,a,b)=>suave((p-a)/(b-a));
  // plano de cada paso (1 conecta · 2 lee · 3 ordena): inclinación, giro, zoom, altura y tamaño del acoplamiento
  const P={tilt:[.26,.1,.14],yaw:[-.4,-.04,.16],zoom:mob?[1.05,1.95,1.36]:[1.1,1.5,1.5],ay:[0,-1.05,-1.36],as:[1,.68,.52]};
  // en el móvil el hueco es bajo: en los pasos 2 y 3 el acoplamiento se recoge y los documentos y la pantalla lo ocupan
  if(mob){P.ay=[0,-.86,-1.24];P.as=[1,.2,.18];}
  const por=(arr,s)=>{const i=Math.min(arr.length-2,Math.floor(s)),f=suave(s-i);return L(arr[i],arr[i+1],f);};
  const v3=new T.Vector3(),dst=new T.Vector3();
  let hs=0,ps=0,giro=0,ult=performance.now(),raf=0,listo=false,compilado=false,t0=0,lentos=0,cuenta=0,tPulso=-1e9,armado=true;
  // suavizado igual a 30 que a 120 fps (antes dependía de los fps: en un equipo lento la pieza se arrastraba)
  const a=(k,dt)=>1-Math.pow(1-k,dt*60);
  function pedir(){if(!raf&&compilado)raf=requestAnimationFrame(frame);}
  function frame(t){raf=0;if(!vis||document.hidden||perdido)return;
    const S=window.tcStory||{p:0,h:0},quieto=Math.abs(ps-S.p)<.0015&&Math.abs(hs-S.h)<.0015;
    // en el móvil, en reposo a 30 fps (batería); durante los cambios de paso, a todos los que dé
    if(mob&&quieto&&t-ult<31){pedir();return;}const dt=Math.min(.05,Math.max(0,(t-ult)/1000));ult=t;
    // adaptar: si los fotogramas pasan de 22 ms de forma seguida, baja la resolución (nunca la vuelve a subir para no oscilar)
    if(adapta&&listo&&dt>0){cuenta++;if(dt>(mob&&quieto?.045:.022))lentos++;if(cuenta>=45){if(lentos>22&&dpr>1){dpr=Math.max(1,dpr-.25);r.setPixelRatio(dpr);medir();}cuenta=lentos=0;}}
    hs=L(hs,S.h,a(.14,dt));ps=L(ps,S.p,a(.12,dt));sx=L(sx,mx,a(.06,dt));sy=L(sy,my,a(.06,dt));
    // entrada al cargar: la pieza llega girando un poco y se asienta (1,6 s), en vez de aparecer de golpe
    if(!t0)t0=t;const en=1-Math.pow(1-cl((t-t0)/1600),3);
    const w=suave(hs),s=ps*2,tr=Math.sin(Math.PI*(s-Math.floor(s)))*w;
    // sitio de la pieza: en la cabecera a la derecha del titular (en el móvil, debajo); en la historia, en el hueco libre
    const hy=cam.position.z*Math.tan(T.MathUtils.degToRad(cam.fov/2)),hx=hy*cam.aspect,peq=Math.min(hx,hy);
    let nx=L(.5,.42,w),ny=L(-.02,0,w),k=L(.68,.64,w);
    if(mob){const hu=S.hueco||{h0:H*.6,h1:H*.94,s0:H*.4,s1:H*.78};const cy=L((hu.h0+hu.h1)/2,(hu.s0+hu.s1)/2,w),bh=Math.max(60,L(hu.h1-hu.h0,hu.s1-hu.s0,w));
      nx=0;ny=1-2*cy/H;k=Math.min(.82,bh*.8/(.46*W));}
    else if(S.hueco&&S.hueco.d&&S.hueco.d.x1-S.hueco.d.x0>200&&S.hueco.d.y1-S.hueco.d.y0>200){const Dd=S.hueco.d,bw=Dd.x1-Dd.x0,bh=Dd.y1-Dd.y0;
      nx=L(nx,(Dd.x0+Dd.x1)/W-1,w);ny=L(ny,1-(Dd.y0+Dd.y1)/H,w);k=L(k,Math.min(.66,bw*.78/(.46*H),bh*.78/(.4*H)),w);}
    // en la cabecera las mitades están separadas y la pieza es más ancha: algo más pequeña
    k*=L(mob?.74:.84,por(P.zoom,s),w)*(1-.05*tr)*L(.86,1,en);
    rig.position.set(nx*hx,ny*hy-(1-en)*hy*.08,0);rig.scale.setScalar(peq*k/2.35);
    rig.rotation.set(L(.32,por(P.tilt,s),w)+sy*.05+(1-en)*.25,L(-.62,por(P.yaw,s),w)+sx*.12-(1-en)*.9,0);
    // ENCAJE: al pasar de la cabecera a la historia las mitades se acercan, giran hasta alinear las garras y encajan
    const junta=tramo(w,.28,.88),sep=1.15*(1-junta);
    giro+=dt*(.22+.5*junta);
    A.g.position.x=-.99-sep;B.g.position.x=.99+sep;A.inn.rotation.y=giro;B.inn.rotation.y=-giro+(1-junta)*.9;
    // la IA, protagonista mientras está suelta: algo mayor y con brillo que late; al encajar vuelve a su medida exacta
    estrella.position.y=sep;{const ex=1+.22*(1-junta);estrella.scale.set(ex,1,ex);}goma.emissiveIntensity=.6+(1-junta)*(.5+.4*Math.sin(t/520));
    acople.position.set(0,L(0,por(P.ay,s),w),0);acople.scale.setScalar(L(1,por(P.as,s),w));
    mancha.scale.x=1+.55*(1-junta);mancha.material.opacity=.85*en;
    // flujo de datos: más rápido y más brillante cuando las dos mitades están unidas; se apaga al salir los documentos
    {const of=en*(1-tramo(s,.12,.45))*(listo?1:0);flujoM.opacity=.95*of;flujo.visible=of>.01;
      if(flujo.visible){const vel=dt*(1.1+1.6*junta);
        for(let i=0;i<NF;i++){const p=fd[i];p.x+=p.v*vel;if(p.x>3.2){p.x=-3.2;p.a=Math.random()*6.283;}p.a+=dt*.8;
          const cerca=Math.max(0,1-Math.abs(p.x)/.7),rr=p.r*(1-.6*cerca);
          fx[i*3]=p.x;fx[i*3+1]=Math.sin(p.a)*rr;fx[i*3+2]=Math.cos(p.a)*rr;
          const borde=Math.min(1,(3.2-Math.abs(p.x))/.8);cTmp.copy(p.x<0?cFr:cSal).lerp(cIA,cerca);
          const lu=borde*(.45+.55*cerca)*(.7+.3*Math.sin(t/300+p.f));fc[i*3]=cTmp.r*lu;fc[i*3+1]=cTmp.g*lu;fc[i*3+2]=cTmp.b*lu;}
        flujoG.attributes.position.needsUpdate=true;flujoG.attributes.color.needsUpdate=true;}}
    // pulso de luz al encajar (una vez por encaje; se rearma al volver a separarlas)
    if(junta>.985&&armado){armado=false;tPulso=t;}if(junta<.7)armado=true;
    let pf=0;pulsos.forEach((m,i)=>{const q=cl((t-tPulso-i*700)/1100),f=t<tPulso+i*700?0:(1-q)*(1-q);m.visible=f>.002;m.scale.setScalar(1+2.4*q);m.material.opacity=.95*f;pf=Math.max(pf,f*(i?.7:1));});
    brillo.material.opacity=Math.max(.55*pf,(1-junta)*(.16+.08*Math.sin(t/520)));brillo.visible=brillo.material.opacity>.005;brillo.scale.setScalar(1+.35*(1-junta));
    // DOCUMENTOS: salen de la unión en el paso 2 y vuelan a la pantalla del ERP en el 3
    docs.forEach((g,i)=>{const e=tramo(s,.06+i*.1,.62+i*.1),f=tramo(s,1.04+i*.09,1.5+i*.09);g.visible=w>.6&&e>.002&&f<.985;if(!g.visible)return;
      const tg=TG[i];v3.copy(acople.position);
      g.position.set(L(v3.x,tg.p.x,e),L(v3.y+.1,tg.p.y,e)+Math.sin(e*Math.PI)*.3,L(0,tg.p.z,e));
      g.rotation.set(L(-1.25,0,e),L(0,tg.ry,e),L(0,tg.rz,e));let esc=L(.12,1,e);
      if(f>0){dst.copy(erpUV(300,196+56*i+28)).add(pantalla.position);g.position.lerp(dst,f);g.rotation.y*=1-f;g.rotation.z*=1-f;esc*=L(1,.1,f);}
      g.scale.setScalar(esc);});
    // escáner sobre la factura y campos que se encienden a su paso
    const b=tramo(s,.5,.98),lee=Math.abs(s-1)<.03&&w>.9,fuera=1-tramo(s,1.08,1.3);
    const hyz=lee?Math.sin(t/1100)*.64:L(.72,-.72,b);haz.position.y=hyz;
    const hop=((b>0&&b<1)||lee)?fuera:0;hazL.material.opacity=.95*hop;hazH.material.opacity=.16*hop;haz.visible=hop>.01;
    campos.forEach((c,i)=>{const lit=tramo(s,.5+.48*(.72-c.y)/1.44-.01,.5+.48*(.72-c.y)/1.44+.07)*fuera;c.lit=lit;c.caja.material.opacity=.2*lit;c.lin.material.opacity=lit;c.g.visible=lit>.01;});
    // PANTALLA del ERP: aparece desde abajo, inclinada, y las filas nuevas se iluminan cuando llega su documento
    const p3=tramo(s,1.05,1.75);pantalla.visible=p3>.002&&w>.6;pantalla.scale.setScalar(L(.86,1,p3));pantalla.rotation.x=L(-.35,0,p3);
    marcoM.opacity=pantM.opacity=p3;
    luzFila.forEach((m,i)=>{m.material.opacity=.3*tramo(s,1.45+i*.09,1.6+i*.09)*(.75+.25*Math.sin(t/700+i))*p3;});
    // la luz principal sigue a la pieza; a mitad de cada cambio barre el metal y el contraluz se enciende (más al encajar)
    key.target.position.copy(rig.position);key.position.set(rig.position.x-3+tr*7,rig.position.y+6,4-tr*2);rim.intensity=16+tr*22+pf*40;
    r.render(sc,cam);
    // etiquetas de los campos leídos (Proveedor, Fecha, Importe e IVA) pegadas a su recuadro
    if(caja2&&!caja2._v){caja2._v=1;caja2.style.opacity=1;}
    // nombres de las piezas: en la cabecera y en el paso 1; se apagan cuando salen los documentos
    const opz=(1-tramo(s,.2,.55))*en*(listo?1:0);
    pzs.forEach((e,i)=>{if(Math.abs(opz-(e._o||0))>.01||opz>.01){e._o=opz;e.style.opacity=opz.toFixed(2);}if(opz<.01)return;anclaPz[i]();acople.localToWorld(v3);v3.project(cam);
      if(!e._w)e._w=e.offsetWidth||80;e.style.transform='translate('+Math.min(W-e._w-8,Math.max(8,(v3.x*.5+.5)*W-e._w/2)).toFixed(1)+'px,'+((-v3.y*.5+.5)*H-(i===1?28:0)).toFixed(1)+'px)';});
    const ve=w>.6&&s<1.35;etq.forEach(e=>{if(!ve&&e._o!==0){e._o=0;e.style.opacity=0;}});
    if(ve)etq.forEach((e,i)=>{const c=campos[i];if(!c)return;e._o=c.lit;e.style.opacity=c.lit.toFixed(2);if(c.lit<.01)return;v3.copy(c.ancla);docs[0].localToWorld(v3);v3.project(cam);
      e.style.transform='translate('+Math.min(W-130,Math.max(8,(v3.x*.5+.5)*W-6)).toFixed(1)+'px,'+((-v3.y*.5+.5)*H-16).toFixed(1)+'px)';});
    if(!listo){listo=true;stage.classList.add('is-ready');}
    pedir();}
  // todo se prepara ANTES de enseñarlo (documentos, pantalla, escáner): la gráfica compila mientras la página sigue
  // respondiendo, y un dibujado de ensayo con el lienzo aún invisible sube ya las geometrías, así no hay tirones a mitad
  const todos=[...docs,pantalla,haz,flujo,...pulsos,brillo,...campos.map(c=>c.g)];todos.forEach(o=>o.visible=true);[rug,manchaTx,erpTx,...texs].forEach(x=>r.initTexture(x));
  const arrancar=()=>{try{r.render(sc,cam);}catch(e){}compilado=true;pedir();};
  (r.compileAsync?r.compileAsync(sc,cam):Promise.resolve(r.compile(sc,cam))).then(arrancar,arrancar);
}
</script>
	<?php
}, 40 );

/* Blog centrado en el cliente industrial (29-10-2026): las noticias generales de IA (categoría «Actualidad IA») siguen
 * en la web pero fuera de Google y del mapa del sitio, para que Google vea una consultoría de IA industrial y no un blog
 * de noticias. También fuera los artículos que giran en torno a una herramienta interna por su marca. */
function tc_fuera_de_google( $id ) {
	$id = (int) $id;
	if ( ! $id || 'post' !== get_post_type( $id ) ) {
		return false;
	}
	if ( in_array( $id, array( 6675 ), true ) ) {
		return true;
	}
	return has_category( 'actualidad-ia', $id );
}
add_filter( 'rank_math/frontend/robots', function ( $robots ) {
	if ( is_singular( 'post' ) && tc_fuera_de_google( get_queried_object_id() ) ) {
		$robots['index'] = 'noindex';
		$robots['follow'] = 'follow';
	}
	if ( is_category( 'actualidad-ia' ) ) {
		$robots['index'] = 'noindex';
	}
	return $robots;
} );
add_filter( 'rank_math/sitemap/entry', function ( $url, $type, $object ) {
	if ( 'post' === $type && is_object( $object ) && tc_fuera_de_google( $object->ID ) ) {
		return false;
	}
	return $url;
}, 10, 3 );
