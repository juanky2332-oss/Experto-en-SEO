/*
 * Experto en SEO (app): expone los campos SEO de Rank Math en la API REST
 * (/wp/v2/posts?context=edit) para que la app pueda leerlos y editarlos.
 * Solo usuarios con permiso de edición pueden escribirlos.
 */
add_action( 'init', function () {
	$campos = array(
		'rank_math_title',
		'rank_math_description',
		'rank_math_focus_keyword',
		'rank_math_canonical_url',
		'rank_math_facebook_title',
		'rank_math_facebook_description',
		'rank_math_pillar_content',
	);
	foreach ( array( 'post', 'page' ) as $tipo ) {
		foreach ( $campos as $campo ) {
			register_post_meta( $tipo, $campo, array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'string',
				'auth_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			) );
		}
	}
} );
