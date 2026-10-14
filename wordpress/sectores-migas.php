/*
 * Transforma con IA · migas de las páginas de sector (Inicio → Industria → sector).
 * Rank Math genera el BreadcrumbList a partir de la jerarquía de la página; estas páginas cuelgan de la raíz
 * (URL /ia-.../), así que se inserta «Industria» en la posición 2. Independiente del snippet «diseño de la web».
 * Fuente: wordpress/sectores-migas.php. Desplegar con node n8n/web-sectores-snippet.mjs
 */
add_filter( 'rank_math/frontend/breadcrumb/items', function ( $crumbs ) {
	if ( is_page( array( 'ia-talleres-industriales', 'ia-mantenimiento-industrial', 'ia-empresas-instaladoras', 'ia-fabricacion-industrial', 'distribucion-industrial' ) ) && count( $crumbs ) >= 2 ) {
		foreach ( $crumbs as $c ) {
			if ( isset( $c[1] ) && trailingslashit( (string) $c[1] ) === home_url( '/industria/' ) ) {
				return $crumbs;
			}
		}
		array_splice( $crumbs, 1, 0, array( array( 'Industria', home_url( '/industria/' ) ) ) );
	}
	return $crumbs;
}, 30 );
