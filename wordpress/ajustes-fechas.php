
/* 1. FECHAS EN ESPAÑOL (13 de octubre de 2026) en todo lo que se ve: publicación y actualización.
 * Se calcula desde la fecha real de la entrada (antes se reinterpretaba el texto ya formateado y salía la fecha de hoy
 * o «octubre 13th»). Los formatos de máquina (c, U, Y-m-d…) no se tocan: el esquema y los atributos datetime siguen igual. */
foreach ( array( 'the_date', 'get_the_date', 'get_the_time', 'get_the_modified_date', 'get_the_modified_time' ) as $tc_f ) {
	add_filter( $tc_f, 'tc_fecha_es', 20, 3 );
}
function tc_fecha_es( $valor, $formato = '', $post = null ) {
	if ( is_admin() || ! is_string( $valor ) ) {
		return $valor;
	}
	if ( '' !== (string) $formato && ! preg_match( '/[FMlDS]/', (string) $formato ) ) {
		return $valor; // formato de máquina
	}
	$p = ( $post instanceof WP_Post ) ? $post : get_post( $post );
	if ( ! $p ) {
		return $valor;
	}
	$mod = in_array( current_filter(), array( 'get_the_modified_date', 'get_the_modified_time' ), true );
	$ts  = (int) get_post_time( 'U', true, $p ) ;
	if ( $mod ) {
		$ts = (int) get_post_modified_time( 'U', true, $p );
	}
	return $ts ? wp_date( 'j', $ts ) . ' de ' . wp_date( 'F', $ts ) . ' de ' . wp_date( 'Y', $ts ) : $valor;
}
/* 2. CAMBIAR "READ MORE" POR "SABER MÁS..." */
// Para el excerpt automático
add_filter( 'excerpt_more', 'cambiar_read_more_excerpt' );
function cambiar_read_more_excerpt( $more ) {
    return '... <a class="more-link" href="' . get_permalink() . '" style="color:#2563eb; font-weight:bold; text-decoration:none;">Saber más... →</a>';
}
// Para el botón del tema (si usa the_content_more_link)
add_filter( 'the_content_more_link', 'cambiar_boton_read_more' );
function cambiar_boton_read_more() {
    return '<a class="more-link" href="' . get_permalink() . '" style="color:#2563eb; font-weight:bold; text-decoration:none;">Saber más... →</a>';
}