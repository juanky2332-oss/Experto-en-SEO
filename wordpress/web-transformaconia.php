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
			foreach ( (array) glob( $dir . '/tc-web-*.css' ) as $viejo ) {
				if ( $viejo !== $fn ) {
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
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px',threshold:.08});rv.forEach(function(el){io.observe(el);});}
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
    <p>Consultoría de inteligencia artificial y automatización de procesos para la industria. ERP para la industria, asistentes técnicos, gestión documental y mejoras sobre SAP o tu ERP.</p>
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
   <div><h3>Soluciones</h3><ul>
    <li><a href="<?php echo $u( '/erp-industria/' ); ?>">ERP para la industria</a></li>
    <li><a href="<?php echo $u( '/automatizacion-procesos-ia/' ); ?>">Automatización de procesos</a></li>
    <li><a href="<?php echo $u( '/agentes-chatbots-ia/' ); ?>">Asistentes técnicos y chatbots</a></li>
    <li><a href="<?php echo $u( '/gestion-documental-ia/' ); ?>">Gestión documental con IA</a></li>
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
			array( array( '/erp-industria/', 'ERP para la industria →', true ), array( '/gestion-documental-ia/', 'Gestión documental con IA', false ) ),
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
		'description' => 'Consultoría de inteligencia artificial y automatización de procesos especializada en la industria, con base en Murcia: ERP para la industria (talleres de mecanizado, calderería, carpintería metálica, reparación de maquinaria e hidráulica), asistentes técnicos de catálogo, gestión documental con IA, automatizaciones y mejoras sobre SAP o cualquier ERP para empresas de toda España.',
		'address'     => array( '@type' => 'PostalAddress', 'addressLocality' => 'Murcia', 'addressRegion' => 'Región de Murcia', 'addressCountry' => 'ES' ),
		'areaServed'  => array( '@type' => 'Country', 'name' => 'España' ),
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
