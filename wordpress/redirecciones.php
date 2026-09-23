/*
 * Experto en SEO (app): redirecciones 301 gestionadas desde la app.
 * Mapa guardado en la opción experto_seo_redirecciones ( '/ruta-vieja/' => 'https://destino' ).
 * API: GET/POST /wp-json/experto-seo/v1/redirecciones (solo administradores).
 */
add_action( 'rest_api_init', function () {
	$permiso = function () {
		return current_user_can( 'manage_options' );
	};
	register_rest_route( 'experto-seo/v1', '/redirecciones', array(
		array(
			'methods'             => 'GET',
			'permission_callback' => $permiso,
			'callback'            => function () {
				return (object) get_option( 'experto_seo_redirecciones', array() );
			},
		),
		array(
			'methods'             => 'POST',
			'permission_callback' => $permiso,
			'callback'            => function ( $req ) {
				$mapa = $req->get_json_params();
				if ( ! is_array( $mapa ) ) {
					return new WP_Error( 'formato', 'Se espera un objeto ruta => destino', array( 'status' => 400 ) );
				}
				$limpio = array();
				foreach ( $mapa as $de => $a ) {
					$ruta = '/' . trim( sanitize_text_field( (string) $de ), '/' ) . '/';
					$dest = esc_url_raw( (string) $a );
					if ( '//' !== $ruta && $dest ) {
						$limpio[ $ruta ] = $dest;
					}
				}
				update_option( 'experto_seo_redirecciones', $limpio, false );
				return (object) $limpio;
			},
		),
	) );
} );

add_action( 'template_redirect', function () {
	$mapa = get_option( 'experto_seo_redirecciones', array() );
	if ( empty( $mapa ) || ! is_array( $mapa ) ) {
		return;
	}
	$uri  = isset( $_SERVER['REQUEST_URI'] ) ? (string) $_SERVER['REQUEST_URI'] : '';
	$ruta = '/' . trim( (string) wp_parse_url( $uri, PHP_URL_PATH ), '/' ) . '/';
	if ( isset( $mapa[ $ruta ] ) ) {
		wp_redirect( $mapa[ $ruta ], 301, 'Experto SEO' );
		exit;
	}
}, 1 );
