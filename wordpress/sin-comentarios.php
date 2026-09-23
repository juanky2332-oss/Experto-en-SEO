/*
 * Experto en SEO (app): comentarios, pingbacks y trackbacks desactivados en toda
 * la web (solo entraba spam). Afecta a lo publicado y a lo que se publique.
 */
add_filter( 'comments_open', '__return_false', 20 );
add_filter( 'pings_open', '__return_false', 20 );
add_filter( 'comments_array', '__return_empty_array', 10 );
add_filter( 'feed_links_show_comments_feed', '__return_false' );

add_action( 'init', function () {
	foreach ( get_post_types() as $tipo ) {
		if ( post_type_supports( $tipo, 'comments' ) ) {
			remove_post_type_support( $tipo, 'comments' );
			remove_post_type_support( $tipo, 'trackbacks' );
		}
	}
}, 100 );

// envío directo a wp-comments-post.php
add_action( 'pre_comment_on_post', function () {
	wp_die( 'Los comentarios están desactivados.', 'Comentarios desactivados', array( 'response' => 403 ) );
} );

// API REST de comentarios: solo para quien modera
add_filter( 'rest_endpoints', function ( $rutas ) {
	if ( ! current_user_can( 'moderate_comments' ) ) {
		unset( $rutas['/wp/v2/comments'], $rutas['/wp/v2/comments/(?P<id>[\d]+)'] );
	}
	return $rutas;
} );

// pingbacks por XML-RPC
add_filter( 'xmlrpc_methods', function ( $metodos ) {
	unset( $metodos['pingback.ping'], $metodos['pingback.extensions.getPingbacks'] );
	return $metodos;
} );

// feeds de comentarios
add_action( 'template_redirect', function () {
	if ( is_comment_feed() ) {
		wp_safe_redirect( home_url( '/' ), 301 );
		exit;
	}
} );
