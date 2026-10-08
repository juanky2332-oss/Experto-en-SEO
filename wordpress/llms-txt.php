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
	$lineas[] = '> Transforma con IA (transformaconia.com) es un blog de noticias de inteligencia artificial explicadas para empresas, actualizado casi a diario a partir de 21 fuentes, y un servicio de desarrollo con base en Murcia que trabaja en remoto para toda España: automatización de procesos, agentes y chatbots de IA, herramientas a medida y un programa de gestión (ERP) con IA, sobre todo para pymes industriales y de oficio. Es un equipo de compañeros de Murcia dedicados a la IA y la automatización. Contacto: info@transformaconia.com (diagnóstico inicial gratuito de 30 minutos).';
	$lineas[] = '';
	$lineas[] = '## Soluciones y precios orientativos (+ IVA)';
	$s = array(
		array( 'Automatización de procesos con IA', '/automatizacion-procesos-ia/', 'pedidos, facturas, correos e informes automatizados con n8n e IA; desde 450 €' ),
		array( 'Agentes y chatbots de IA', '/agentes-chatbots-ia/', 'asistentes con el catálogo, tarifas o manuales de la empresa en web, WhatsApp o Telegram; desde 900 €' ),
		array( 'Herramientas a medida con IA', '/desarrollo-a-medida-ia/', 'aplicaciones web con IA conectadas a SAP, Excel o ERP; desde 2.500 €' ),
		array( 'Programa de gestión (ERP) con IA', '/gestion/', 'facturas, albaranes firmados, cobros y gastos por foto en Telegram; 690 € de puesta en marcha y 69 €/mes' ),
		array( 'IA para empresas industriales', '/sectores-industriales/', 'eléctricas, neumática, hidráulica, mecanizado, suministro industrial, mantenimiento, automatización y frío industrial' ),
		array( 'Cómo trabajamos y precios', '/soluciones/', 'diagnóstico gratis, prototipo en 1-3 semanas, soporte mes a mes' ),
		array( 'Casos reales', '/casos/', 'asistente técnico para un distribuidor industrial, programa de gestión con IA, búsqueda inteligente de artículos integrada con SAP, blog con agentes y prospección comercial' ),
		array( 'Agencia de IA en Murcia', '/consultor-ia-murcia/', 'visitas presenciales en la Región de Murcia' ),
		array( 'Quiénes somos', '/quienes-somos/', 'el equipo de Murcia que está detrás' ),
		array( 'Noticias y páginas automáticas', '/contenido-automatico-ia/', 'blog y páginas que se publican solos con IA y revisión humana; desde 600 €' ),
		array( 'Contacto', '/contacto/', 'formulario y correo info@transformaconia.com' ),
		array( 'Boletín semanal gratuito', '/boletin/', 'las noticias de IA de la semana para empresas, cada lunes' ),
	);
	foreach ( $s as $x ) {
		$lineas[] = '- [' . $x[0] . '](' . home_url( $x[1] ) . '): ' . $x[2];
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
