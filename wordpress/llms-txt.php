/*
 * Experto en SEO (app): sirve https://transformaconia.com/llms.txt
 * Índice en Markdown para buscadores y asistentes de IA (ChatGPT, Claude,
 * Perplexity, Gemini): qué es la web, sus secciones y los artículos recientes.
 */
add_action( 'init', function () {
	$ruta = isset( $_SERVER['REQUEST_URI'] ) ? strtok( $_SERVER['REQUEST_URI'], '?' ) : '';
	if ( '/llms.txt' !== $ruta ) {
		return;
	}
	$sitio = get_bloginfo( 'name' );
	$lineas   = array();
	$lineas[] = '# ' . $sitio;
	$lineas[] = '';
	$lineas[] = '> Transformaconia es una consultora española de inteligencia artificial y automatización para pymes. Diseña agentes de IA, chatbots y flujos automatizados (n8n) y publica análisis de actualidad sobre IA aplicada a la empresa. Contacto: info@transformaconia.com';
	$lineas[] = '';
	$lineas[] = '## Servicios y productos';
	foreach ( get_pages( array( 'sort_column' => 'menu_order' ) ) as $pagina ) {
		if ( in_array( $pagina->post_name, array( 'privacy-policy', 'blog-dark-all-posts', 'blog-dark-landing' ), true ) ) {
			continue;
		}
		$lineas[] = '- [' . wp_strip_all_tags( $pagina->post_title ) . '](' . get_permalink( $pagina ) . ')';
	}
	$lineas[] = '';
	$lineas[] = '## Temas del blog';
	foreach ( get_categories( array( 'hide_empty' => true ) ) as $cat ) {
		$desc = $cat->description ? ': ' . wp_strip_all_tags( $cat->description ) : '';
		$lineas[] = '- [' . $cat->name . '](' . get_category_link( $cat ) . ')' . $desc;
	}
	$lineas[] = '';
	$lineas[] = '## Artículos recientes';
	$posts = get_posts( array( 'numberposts' => 40, 'post_status' => 'publish' ) );
	foreach ( $posts as $p ) {
		$resumen = wp_strip_all_tags( $p->post_excerpt );
		$resumen = $resumen ? ': ' . wp_trim_words( $resumen, 28, '…' ) : '';
		$lineas[] = '- [' . wp_strip_all_tags( get_the_title( $p ) ) . '](' . get_permalink( $p ) . ')' . $resumen;
	}
	$lineas[] = '';
	$lineas[] = '## Opcional';
	$lineas[] = '- [Mapa del sitio](' . home_url( '/sitemap_index.xml' ) . ')';
	status_header( 200 );
	header( 'Content-Type: text/plain; charset=utf-8' );
	header( 'Cache-Control: public, max-age=3600' );
	echo implode( "\n", $lineas ) . "\n";
	exit;
}, 1 );
