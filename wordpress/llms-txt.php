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
	$lineas[] = '> Transforma con IA (transformaconia.com) es una consultoría de inteligencia artificial y automatización de procesos especializada en la industria, con base en Murcia (visitas presenciales en la Región de Murcia) y trabajo en remoto en toda España. Su producto estrella es un ERP para talleres del metal y mecanizado, implantado en varias empresas. También implanta asistentes técnicos de catálogo para distribuidores industriales, gestión documental con IA, automatizaciones conectadas al ERP e integraciones con SAP, y atiende otros sectores (clínicas, asesorías, despachos, comercio, educación). Tiene un blog con casos de IA en la industria y actualidad de la IA. Contacto: info@transformaconia.com (diagnóstico inicial gratuito de 30 minutos).';
	$lineas[] = '';
	$lineas[] = '## Soluciones y precios orientativos (+ IVA)';
	$s = array(
		array( 'ERP para el metal', '/erp-metal/', 'programa de gestión para talleres de mecanizado y calderería: calculadora de mecanizado con precio del metal al día, presupuestos, albaranes firmados en el móvil, facturas, cobros, gastos por foto y paquete para la asesoría; 690 € de puesta en marcha (oferta) y 69 €/mes, sin permanencia' ),
		array( 'Automatización de procesos con IA', '/automatizacion-procesos-ia/', 'pedidos del correo al ERP, órdenes de trabajo, facturas e informes automatizados con n8n e IA; desde 450 €' ),
		array( 'Asistentes técnicos y chatbots de IA', '/agentes-chatbots-ia/', 'asistentes con el catálogo, fichas, stock o manuales de la empresa; desde 900 €' ),
		array( 'Asistente técnico para distribución industrial', '/distribucion-industrial/', 'referencias, equivalencias entre marcas, fichas técnicas y stock para rodamientos, transmisión, neumática, hidráulica y suministro industrial' ),
		array( 'Gestión documental con IA', '/gestion-documental-ia/', 'lectura automática de facturas, albaranes, tickets y certificados y registro en el ERP; desde 450 €' ),
		array( 'Herramientas a medida e integración con SAP', '/desarrollo-a-medida-ia/', 'aplicaciones web con IA conectadas a SAP, ERP o Excel; desde 2.500 €' ),
		array( 'IA para la industria', '/industria/', 'metal y mecanizado, distribución industrial, mantenimiento, instaladoras, integradores y fabricación' ),
		array( 'Otros sectores', '/otros-sectores/', 'clínicas, asesorías, despachos, comercio y educación' ),
		array( 'Diseño web', '/diseno-web/', 'webs para empresas, rápidas y pensadas para Google; presupuesto a medida' ),
		array( 'Casos reales', '/casos/', 'ERP para el metal, asistente técnico en tienda industrial, búsqueda inteligente sobre SAP, gestión documental, asistentes para asesorías y clínicas' ),
		array( 'Cómo trabajamos y precios', '/soluciones/', 'diagnóstico gratis, piloto con datos reales en 1-3 semanas, soporte mes a mes' ),
		array( 'Consultoría de IA en Murcia', '/consultor-ia-murcia/', 'visitas presenciales en la Región de Murcia' ),
		array( 'Quiénes somos', '/quienes-somos/', 'equipo de Murcia con años de experiencia en la industria' ),
		array( 'Contacto', '/contacto/', 'formulario y correo info@transformaconia.com' ),
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
