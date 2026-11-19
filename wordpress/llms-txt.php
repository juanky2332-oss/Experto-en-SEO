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
	$lineas[] = '> Transforma con IA (transformaconia.com) es una consultoría de inteligencia artificial y automatización de procesos especializada en la industria, con base en Murcia y trabajo en remoto, por videollamada, en toda España. Sus apps para la industria forman la familia IndunexIA: IndunexIA Gestión (ERP), IndunexIA Presupuestos (presupuestos desde plano) e IndunexIA Documentos (gestión documental). El ERP, IndunexIA Gestión, nació en talleres de mecanizado y sirve también para calderería, carpintería metálica, reparación de maquinaria e hidráulica y se combina con otros sectores por módulos. También implanta asistentes técnicos de catálogo para distribuidores industriales, gestión documental con IA, automatizaciones conectadas al ERP (directamente si tiene API; si no, se valora cómo adaptarlo) y mejoras sobre SAP o cualquier otro programa, y atiende otros sectores (clínicas, asesorías, despachos, comercio, educación). Tiene un blog con casos de IA en la industria y actualidad de la IA. Contacto: info@transformaconia.com (diagnóstico inicial gratuito, por escrito).';
	$lineas[] = '';
	$lineas[] = '## Soluciones (precio a consultar: presupuesto gratis y cerrado tras el diagnóstico)';
	$s = array(
		array( 'ERP para la industria', '/erp-industria/', 'programa de gestión para talleres industriales (mecanizado, calderería, carpintería metálica, reparación de maquinaria, hidráulica) y otros sectores por módulos: calculadora de lo que cuesta cada trabajo para aplicar el margen y calcular el precio, presupuestos, albaranes firmados en el móvil, facturas, cobros, gastos por foto y paquete para la asesoría; tres planes (Básico, Profesional y Pro), sin permanencia; la cuota incluye alojamiento, copias, uso de la IA, soporte y mejoras; precio a consultar' ),
		array( 'Automatización de procesos con IA', '/automatizacion-procesos-ia/', 'pedidos del correo al ERP, órdenes de trabajo, facturas e informes automatizados con IA; precio a consultar' ),
		array( 'Asistentes técnicos y chatbots de IA', '/agentes-chatbots-ia/', 'asistentes con el catálogo, fichas, stock o manuales de la empresa; precio a consultar' ),
		array( 'Asistente técnico para distribución industrial', '/distribucion-industrial/', 'referencias, equivalencias entre marcas, fichas técnicas y stock para rodamientos, transmisión, neumática, hidráulica y suministro industrial' ),
		array( 'IndunexIA Documentos (gestión documental con IA)', '/gestion-documental-ia/', 'app que lee facturas, tickets y albaranes, comprueba cuentas, CIF y duplicados y los guarda ordenados en la carpeta del ordenador; listado para la gestoría; precio a consultar' ),
		array( 'IndunexIA Presupuestos (presupuestos desde plano)', '/presupuestos-desde-plano/', 'app que lee planos, croquis, esquemas o fotos y prepara el presupuesto con las tarifas del taller; PDF con su marca y aceptación online; precio a consultar' ),
		array( 'Herramientas a medida e integración con SAP', '/desarrollo-a-medida-ia/', 'cualquier idea para mejorar SAP o el programa que use la empresa, y aplicaciones web con IA a medida; precio a consultar' ),
		array( 'IA para la industria', '/industria/', 'talleres industriales, distribución industrial, mantenimiento, instaladoras, integradores y fabricación' ),
		array( 'Otros sectores', '/otros-sectores/', 'clínicas, asesorías, despachos, comercio y educación' ),
		array( 'Diseño web', '/diseno-web/', 'webs para empresas, rápidas y pensadas para Google; presupuesto a medida' ),
		array( 'Casos', '/casos/', 'ERP para la industria, asistente técnico en tienda industrial, gestión documental, un ejemplo de búsqueda inteligente sobre SAP, asistentes para asesorías y clínicas' ),
		array( 'Cómo trabajamos', '/soluciones/', 'diagnóstico gratis, piloto con datos reales en 1-3 semanas, soporte mes a mes' ),
		array( 'Consultoría de IA en Murcia', '/consultor-ia-murcia/', 'consultoría de IA desde Murcia, por videollamada' ),
		array( 'Colaboraciones', '/colaboraciones/', 'herramientas de compañeros que recomendamos para lo que no hacemos nosotros' ),
		array( 'Flownexion: automatización de tiendas online', '/colaboraciones/flownexion/', 'importa productos del proveedor, prepara las fichas con IA y sincroniza precio y stock en WooCommerce, PrestaShop o Shopify; demo en vídeo; al contactar con Flownexion, di que vienes de parte de Transforma con IA' ),
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
