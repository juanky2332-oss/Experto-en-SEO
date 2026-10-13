/*
 * Transforma con IA · reserva del diagnóstico gratuito (30 min) directamente en el calendario.
 * Shortcode: [tc_reserva]   (opcional: titulo="0" para ocultar el encabezado)
 * Independiente del snippet «diseño de la web»: solo lee sus variables de color y tipografía (--tc-*)
 * con valores de respaldo, así que se ve bien aunque ese snippet cambie o esté desactivado.
 * Habla con el flujo de n8n «WEB TRANSFORMACONIA → reserva del diagnóstico»:
 *   GET  /webhook/web-reserva-huecos?dias=3   POST /webhook/web-reserva
 * Fuente: wordpress/reserva.php (repo Experto en SEO). Desplegar con node n8n/web-reserva-snippet.mjs
 */
if ( ! function_exists( 'tcr_marcado' ) ) {
	function tcr_marcado( $titulo ) {
		$cab = $titulo
			? '<header class="tcr-head"><h2 class="tcr-h" id="tcr-titulo">Reserva tu diagnóstico gratis</h2><p class="tcr-sub">30 minutos para ver qué se puede automatizar en tu empresa. Elige el día y la hora que mejor te vengan: sin compromiso.</p></header>'
			: '';
		return <<<HTML
<section class="tcr" aria-labelledby="tcr-titulo">
{$cab}
<form class="tcr-form" novalidate>
<fieldset class="tcr-fs tcr-slotsfs"><legend class="tcr-leg"><span class="tcr-n">1</span> Elige día y hora <small>(hora de Madrid)</small></legend>
<div class="tcr-slots" aria-live="polite" aria-busy="true"><p class="tcr-info">Buscando huecos libres…</p></div>
<button type="button" class="tcr-more" hidden>Ver más días</button></fieldset>
<fieldset class="tcr-fs"><legend class="tcr-leg"><span class="tcr-n">2</span> Cómo prefieres hacerlo</legend>
<div class="tcr-mod">
<label class="tcr-opt"><input type="radio" name="modalidad" value="videollamada" checked><span><b>Videollamada</b><small>Desde cualquier lugar de España</small></span></label>
<label class="tcr-opt"><input type="radio" name="modalidad" value="en tu empresa"><span><b>En tu empresa</b><small>Solo Región de Murcia</small></span></label>
</div>
<div class="tcr-field tcr-loc" hidden><label for="tcr-localidad">Localidad de tu empresa (Región de Murcia)</label><input id="tcr-localidad" name="localidad" autocomplete="address-level2" maxlength="120"></div>
</fieldset>
<fieldset class="tcr-fs"><legend class="tcr-leg"><span class="tcr-n">3</span> Tus datos</legend>
<div class="tcr-row">
<div class="tcr-field"><label for="tcr-nombre">Nombre</label><input id="tcr-nombre" name="nombre" required autocomplete="name" maxlength="120"></div>
<div class="tcr-field"><label for="tcr-empresa">Empresa <small>(opcional)</small></label><input id="tcr-empresa" name="empresa" autocomplete="organization" maxlength="160"></div>
</div>
<div class="tcr-row">
<div class="tcr-field"><label for="tcr-email">Correo</label><input id="tcr-email" name="email" type="email" required autocomplete="email" maxlength="160"></div>
<div class="tcr-field"><label for="tcr-telefono">Teléfono <small class="tcr-tel-nota">(opcional)</small></label><input id="tcr-telefono" name="telefono" type="tel" autocomplete="tel" maxlength="30"></div>
</div>
<label class="tcr-hp" aria-hidden="true">Web <input name="web" tabindex="-1" autocomplete="off"></label>
<label class="tcr-check"><input type="checkbox" id="tcr-acepto" name="acepto" value="si" required> <span>He leído la <a href="/privacidad/">política de privacidad</a> y acepto que uséis mis datos para gestionar esta cita.</span></label>
</fieldset>
<div class="tcr-actions"><button type="submit" class="tcr-go">Reservar mi diagnóstico</button><span class="tcr-pick" aria-live="polite"></span></div>
<p class="tcr-msg" role="status" aria-live="polite"></p>
</form>
<div class="tcr-done" tabindex="-1" role="status" hidden></div>
<noscript><p class="tcr-info">Para reservar necesitas activar JavaScript. También puedes escribirnos a <a href="mailto:info@transformaconia.com">info@transformaconia.com</a> y te damos hora.</p></noscript>
</section>
HTML;
	}
}

if ( ! function_exists( 'tcr_estilos' ) ) {
	function tcr_estilos() {
		return <<<'CSS'
<style id="tcr-css">
.tcr{--r-bg:var(--tc-card,#14111b);--r-fg:var(--tc-fg,#f4f0f8);--r-mut:var(--tc-muted,#a9a1b4);--r-dim:var(--tc-muted,#a9a1b4);--r-line:var(--tc-line,rgba(255,255,255,.09));--r-line2:var(--tc-line2,rgba(255,255,255,.16));--r-m:var(--tc-m,#b020ff);--r-m2:var(--tc-m2,#d27bff);--r-glow:var(--tc-glow,rgba(176,32,255,.35));--r-disp:var(--tc-display,"Poppins",system-ui,sans-serif);--r-body:var(--tc-body,"Open Sans",system-ui,sans-serif);
max-width:880px;margin:0 auto;padding:clamp(20px,4vw,40px);background:var(--r-bg);border:1px solid var(--r-line);border-radius:var(--tc-r,18px);color:var(--r-fg);font-family:var(--r-body);font-size:16px;line-height:1.6;box-shadow:0 30px 80px -40px rgba(0,0,0,.9);text-align:left}
.tcr *,.tcr *::before,.tcr *::after{box-sizing:border-box}
.tcr .tcr-h{font-family:var(--r-disp);font-size:clamp(24px,3vw,34px);line-height:1.15;font-weight:700;letter-spacing:-.02em;color:var(--r-fg);margin:0 0 8px}
.tcr .tcr-sub{margin:0 0 6px;color:var(--r-mut);font-size:16.5px}
.tcr-head{margin-bottom:22px}
.tcr-form{display:grid;gap:22px}
.tcr .tcr-fs{border:0;margin:0;padding:0;min-width:0;display:grid;gap:14px}
.tcr .tcr-leg{display:flex;align-items:center;gap:10px;padding:0;margin-bottom:2px;font-family:var(--r-disp);font-weight:600;font-size:17px;color:var(--r-fg)}
.tcr .tcr-leg small{font-family:var(--r-body);font-weight:400;font-size:13px;color:var(--r-dim)}
.tcr .tcr-n{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:rgba(176,32,255,.18);box-shadow:inset 0 0 0 1px rgba(210,123,255,.4);color:var(--r-m2);font-size:13px;font-weight:600}
.tcr .tcr-info{margin:0;color:var(--r-mut);font-size:15px}
.tcr .tcr-info a,.tcr .tcr-check a,.tcr .tcr-msg a{color:var(--r-m2)!important;text-decoration:underline}
/* espacio reservado para 3 días de huecos (2 por día) mientras cargan: evita el salto de diseño (CLS) */
.tcr-slots{display:grid;gap:14px;align-content:start;min-height:292px}
.tcr .tcr-leg small,.tcr .tcr-opt small,.tcr .tcr-field label small{color:var(--r-mut)!important}
/* el tema pinta <b> y los botones con su color de acento (#ad49e1, poco contraste): se fijan los de la marca con más especificidad */
body .tcr .tcr-opt span b{color:#f4f0f8!important}
body .tcr button.tcr-go{background-color:#b020ff!important;color:#fff!important}
body .tcr .tcr-leg .tcr-n{color:#e3b0ff!important}
body .tcr label.tcr-opt>span{color:#f4f0f8!important;font-weight:400!important}
body .tcr label.tcr-check>span{color:#a9a1b4!important;font-weight:400!important}
body .tcr .tcr-check a,body .tcr .tcr-info a,body .tcr .tcr-msg a{color:#e3b0ff!important}
.tcr .tcr-day{display:grid;gap:8px}
.tcr .tcr-dayn{margin:0;font-family:var(--r-disp);font-weight:500;font-size:14.5px;color:var(--r-mut)}
.tcr .tcr-dayn::first-letter{text-transform:uppercase}
.tcr-times{display:flex;flex-wrap:wrap;gap:8px}
.tcr .tcr-chip{position:relative;display:inline-block;margin:0;cursor:pointer}
.tcr .tcr-chip input{position:absolute;opacity:0;inset:0;width:100%;height:100%;margin:0;cursor:pointer}
.tcr .tcr-chip span{display:inline-block;min-width:84px;padding:11px 16px;text-align:center;border-radius:11px;border:1px solid var(--r-line2);background:rgba(255,255,255,.035);color:var(--r-fg);font-family:var(--r-disp);font-weight:500;font-size:15px;transition:background .2s,border-color .2s,box-shadow .2s}
.tcr .tcr-chip:hover span{border-color:var(--r-m2);background:rgba(176,32,255,.08)}
.tcr .tcr-chip input:checked+span{background:var(--r-m);border-color:var(--r-m);color:#fff;box-shadow:0 10px 26px -10px var(--r-glow)}
.tcr .tcr-chip input:focus-visible+span,.tcr .tcr-opt input:focus-visible+span{outline:2px solid var(--r-m2);outline-offset:3px}
.tcr .tcr-more{justify-self:start;background:none;border:0;padding:6px 0;color:var(--r-m2)!important;font-family:var(--r-disp);font-weight:600;font-size:15px;cursor:pointer;text-decoration:underline;text-underline-offset:4px;box-shadow:none}
.tcr [hidden]{display:none!important}
.tcr .tcr-more[hidden]{display:inline-block!important;visibility:hidden;height:36px}
.tcr-mod{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.tcr .tcr-opt{position:relative;display:block;margin:0;cursor:pointer}
.tcr .tcr-opt input{position:absolute;opacity:0;inset:0;width:100%;height:100%;margin:0;cursor:pointer}
.tcr .tcr-opt span{display:grid;gap:2px;height:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--r-line2);background:rgba(255,255,255,.035);transition:background .2s,border-color .2s}
.tcr .tcr-opt b{font-family:var(--r-disp);font-weight:600;font-size:15.5px;color:var(--r-fg)!important}
.tcr .tcr-opt small{font-size:13px;color:var(--r-dim)}
.tcr .tcr-opt input:checked+span{border-color:var(--r-m2);background:rgba(176,32,255,.12);box-shadow:0 0 0 3px rgba(176,32,255,.18)}
.tcr-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.tcr .tcr-field{display:grid;gap:6px;min-width:0}
.tcr .tcr-field label{font-family:var(--r-disp);font-size:13.5px;font-weight:500;color:var(--r-fg);margin:0}
.tcr .tcr-field label small{font-weight:400;color:var(--r-dim)}
.tcr .tcr-field input{width:100%;height:auto;padding:13px 15px!important;border-radius:11px!important;border:1px solid var(--r-line2)!important;background:rgba(255,255,255,.035)!important;color:var(--r-fg)!important;font:inherit;font-size:15.5px!important;box-shadow:none;margin:0}
.tcr .tcr-field input:focus{border-color:var(--r-m2)!important;background:rgba(176,32,255,.06)!important;box-shadow:0 0 0 4px rgba(176,32,255,.15)!important;outline:none}
.tcr .is-bad{border-color:#ff6b6b!important;box-shadow:0 0 0 3px rgba(255,90,90,.18)!important}
.tcr .tcr-check{display:flex;gap:10px;align-items:flex-start;margin:0;font-size:14px;line-height:1.5;color:var(--r-mut)}
.tcr .tcr-check input{margin-top:4px;accent-color:var(--r-m);width:auto}
.tcr .tcr-check input.is-bad{outline:2px solid #ff6b6b;outline-offset:2px}
.tcr .tcr-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;overflow:hidden}
.tcr-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px}
.tcr .tcr-go{display:inline-flex;align-items:center;gap:10px;padding:15px 26px;border:0;border-radius:12px;background:var(--r-m);color:#fff!important;font-family:var(--r-disp);font-weight:600;font-size:16px;line-height:1;cursor:pointer;box-shadow:0 10px 30px -10px var(--r-glow),inset 0 1px 0 rgba(255,255,255,.25);transition:transform .25s,box-shadow .25s}
.tcr .tcr-go:hover{transform:translateY(-2px);box-shadow:0 16px 40px -12px var(--r-glow),inset 0 1px 0 rgba(255,255,255,.25)}
.tcr .tcr-go:focus-visible,.tcr .tcr-more:focus-visible{outline:2px solid var(--r-m2);outline-offset:3px}
.tcr .tcr-go[disabled]{opacity:.6;cursor:wait;transform:none}
.tcr .tcr-pick{font-size:14.5px;color:var(--r-m2)}
.tcr .tcr-msg{display:none;margin:0;padding:14px 16px;border-radius:12px;font-size:15px}
.tcr .tcr-msg.is-err{display:block;background:rgba(255,90,90,.1);border:1px solid rgba(255,90,90,.35);color:#ffd2d2}
.tcr .tcr-done{padding:8px 0;outline:0}
.tcr .tcr-done h3{font-family:var(--r-disp);font-size:clamp(22px,2.6vw,30px);line-height:1.2;font-weight:700;color:var(--r-fg);margin:0 0 10px}
.tcr .tcr-done p{margin:0 0 10px;color:var(--r-mut)}
.tcr .tcr-done .tcr-ok{display:inline-grid;place-items:center;width:44px;height:44px;margin-bottom:12px;border-radius:50%;background:rgba(74,222,128,.14);box-shadow:inset 0 0 0 1px rgba(74,222,128,.4);color:#4ade80;font-size:22px}
.tcr .tcr-done .tcr-fecha{display:inline-block;padding:10px 16px;border-radius:12px;border:1px solid var(--r-line2);background:rgba(255,255,255,.04);color:var(--r-fg);font-family:var(--r-disp);font-weight:600}
@media (max-width:640px){.tcr-row,.tcr-mod{grid-template-columns:1fr}.tcr .tcr-chip span{min-width:76px}.tcr .tcr-go{width:100%;justify-content:center}}
@media (prefers-reduced-motion:reduce){.tcr *{transition:none!important}}
</style>
CSS;
	}
}

if ( ! function_exists( 'tcr_script' ) ) {
	function tcr_script() {
		return <<<'JS'
<script id="tcr-js">
(function(){
  var API='https://paneln8n.transformaconia.com/webhook/';
  document.querySelectorAll('.tcr').forEach(function(r){
    var form=r.querySelector('.tcr-form'), box=r.querySelector('.tcr-slots'), more=r.querySelector('.tcr-more'),
        msg=r.querySelector('.tcr-msg'), go=r.querySelector('.tcr-go'), pick=r.querySelector('.tcr-pick'),
        done=r.querySelector('.tcr-done'), loc=r.querySelector('.tcr-loc'), telNota=r.querySelector('.tcr-tel-nota'),
        dias=3, texto={}, ocupado=false;
    var CONTACTO='<a href="/contacto/">escríbenos desde la página de contacto</a> o a <a href="mailto:info@transformaconia.com">info@transformaconia.com</a>';
    function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
    function info(html){box.textContent='';var p=el('p','tcr-info');p.innerHTML=html;box.appendChild(p);}
    function aviso(t,ok){msg.className='tcr-msg'+(t?' is-err':'');msg.textContent=t||'';}
    function render(h,previo){
      box.textContent='';
      var grupos={},orden=[];
      h.forEach(function(x){if(!grupos[x.dia]){grupos[x.dia]=[];orden.push(x.dia);}grupos[x.dia].push(x);texto[x.iso]=x.texto+' a las '+x.hora;});
      orden.forEach(function(d){
        var g=el('div','tcr-day'), n=el('p','tcr-dayn',grupos[d][0].texto), t=el('div','tcr-times');
        n.id='tcr-d-'+d;t.setAttribute('role','radiogroup');t.setAttribute('aria-labelledby',n.id);
        grupos[d].forEach(function(x){
          var l=el('label','tcr-chip'), i=el('input'), s=el('span',null,x.hora);
          i.type='radio';i.name='hueco';i.value=x.iso;i.setAttribute('aria-label',x.texto+', '+x.hora);
          if(previo&&previo===x.iso)i.checked=true;
          l.appendChild(i);l.appendChild(s);t.appendChild(l);
        });
        g.appendChild(n);g.appendChild(t);box.appendChild(g);
      });
      more.hidden=!(orden.length>=dias&&dias<12);
      marcar();
    }
    function marcar(){var s=form.querySelector('input[name=hueco]:checked');pick.textContent=s?'Hueco elegido: '+texto[s.value]:'';}
    function cargar(){
      var previo=(form.querySelector('input[name=hueco]:checked')||{}).value;
      box.setAttribute('aria-busy','true');
      fetch(API+'web-reserva-huecos?dias='+dias).then(function(res){return res.json();}).then(function(j){
        if(!j||!j.ok)throw j;
        if(!j.huecos.length){info('Ahora mismo no hay huecos libres en los próximos días. '+CONTACTO+' y te damos hora.');more.hidden=true;return;}
        render(j.huecos,previo);
      }).catch(function(){info('No hemos podido cargar los huecos. Recarga la página o '+CONTACTO+'.');more.hidden=true;})
      .then(function(){box.setAttribute('aria-busy','false');});
    }
    more.addEventListener('click',function(){dias+=3;cargar();});
    form.addEventListener('change',function(e){
      if(e.target.name==='hueco')marcar();
      if(e.target.name==='modalidad'){
        var p=e.target.value==='en tu empresa';
        loc.hidden=!p;telNota.textContent=p?'(necesario para coordinar la visita)':'(opcional)';
        if(p)form.querySelector('[name=localidad]').focus();
      }
    });
    form.addEventListener('input',function(e){if(e.target.classList&&e.target.classList.contains('is-bad')){e.target.classList.remove('is-bad');e.target.removeAttribute('aria-invalid');}});
    form.addEventListener('submit',function(e){
      e.preventDefault();if(ocupado)return;
      form.querySelectorAll('.is-bad').forEach(function(x){x.classList.remove('is-bad');x.removeAttribute('aria-invalid');});
      var v=function(n){var f=form.elements[n];return f?String(f.value||'').trim():'';};
      var hueco=(form.querySelector('input[name=hueco]:checked')||{}).value||'';
      var mod=(form.querySelector('input[name=modalidad]:checked')||{}).value||'';
      var fallo=null, mal=function(i,t){if(!fallo)fallo=[i,t];if(i.classList){i.classList.add('is-bad');i.setAttribute('aria-invalid','true');}};
      if(!hueco)mal(box.querySelector('input')||box,'Elige primero un día y una hora.');
      else if(v('nombre').length<2)mal(form.elements.nombre,'Escribe tu nombre.');
      else if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email')))mal(form.elements.email,'Revisa el correo: te enviamos ahí la confirmación.');
      else if(mod==='en tu empresa'&&v('localidad').length<2)mal(form.elements.localidad,'Dinos en qué localidad de la Región de Murcia está tu empresa.');
      else if(mod==='en tu empresa'&&v('telefono').replace(/\D/g,'').length<9)mal(form.elements.telefono,'Déjanos un teléfono para coordinar la visita.');
      else if(!form.elements.acepto.checked)mal(form.elements.acepto,'Marca la casilla de la política de privacidad para poder reservar.');
      if(fallo){aviso(fallo[1]);if(fallo[0].focus)fallo[0].focus();return;}
      aviso('');
      var d=new URLSearchParams();
      ['nombre','empresa','email','telefono','localidad','web'].forEach(function(n){d.set(n,v(n));});
      d.set('modalidad',mod);d.set('hueco',hueco);d.set('acepto','si');d.set('origen',location.href);
      try{var at=JSON.parse(sessionStorage.getItem('tcAtr')||'{}');d.set('entrada',String(at.p||location.pathname).slice(0,200));d.set('procedencia',String(at.r||'').slice(0,120));}catch(x){d.set('entrada',location.pathname);}
      ocupado=true;go.disabled=true;var txt=go.textContent;go.textContent='Reservando…';
      fetch(API+'web-reserva',{method:'POST',body:d}).then(function(res){return res.json().catch(function(){return {};}).then(function(j){j.status=res.status;return j;});}).then(function(j){
        if(j.ok){
          var video=j.modalidad==='videollamada';
          done.textContent='';
          done.appendChild(el('div','tcr-ok','✓'));
          done.appendChild(el('h3',null,'¡Reservado! Te hemos escrito la confirmación'));
          done.appendChild(el('p','tcr-fecha',j.fecha));
          done.appendChild(el('p',null,video?'Recibirás por correo el enlace de la videollamada. Revisa también la carpeta de spam.':'Iremos a tu empresa y te llamaremos antes para confirmar la dirección. Revisa también la carpeta de spam.'));
          done.appendChild(el('p',null,'Si no puedes en ese horario, responde al correo y lo cambiamos.'));
          form.hidden=true;done.hidden=false;done.focus();
        }else{
          aviso(j.error||'No se ha podido reservar. Escríbenos a info@transformaconia.com y te damos hora.');
          if(j.refrescar)cargar();
        }
      }).catch(function(){aviso('No se ha podido reservar. Escríbenos a info@transformaconia.com y te damos hora.');})
      .then(function(){ocupado=false;go.disabled=false;go.textContent=txt;});
    });
    cargar();
  });
})();
</script>
JS;
	}
}

add_shortcode( 'tc_reserva', function ( $atts ) {
	$atts = shortcode_atts( array( 'titulo' => '1' ), $atts, 'tc_reserva' );
	if ( empty( $GLOBALS['tcr_activo'] ) ) {
		$GLOBALS['tcr_activo'] = true;
		add_action( 'wp_footer', function () {
			echo tcr_script(); // phpcs:ignore WordPress.Security.EscapeOutput
		}, 40 );
	}
	return tcr_estilos() . tcr_marcado( '0' !== $atts['titulo'] );
} );
