// Datos de la página /pedidos ("Pedí tu pieza impresa").
// Cada grupo es un carrusel de tarjetas con foto, precio y botón de WhatsApp. El orden de los grupos es el de la página.
// Producto: { nombre, objeto, desde: '$2.500', nota: 'combo 5 por $11.000', params: {}, foto: '/miniaturas/...' }
//   · objeto: id del diseño (abre el editor con `params` para personalizarlo). La foto sale de /miniaturas/<objeto>.webp salvo que pongas `foto`.
// Actualizá `actualizado` cada vez que cambies precios (con la inflación una tabla sin fecha envejece rápido).
const idea = (k) => `/miniaturas/ideas/navidad--${k}.webp`;
export const PEDIDOS = {
  plazo: 'unos 2 días',
  actualizado: 'noviembre 2026',
  grupos: [
    { id: 'hogar', titulo: 'Hogar y decoración', items: [
      { nombre: 'Lámpara Cuadrada Torsionada', objeto: 'lampara-led', params: { style: 'cuadradaTorsion', twist: 0.8 }, foto: '/miniaturas/variantes/lampara-led--tapa.webp', desde: '$18.000', nota: 'Cuerpo espiral con tapa superior' },
      { nombre: 'Lámpara LED de dos piezas', objeto: 'lampara-led', desde: '$16.500', nota: 'Sin luz incluida · 6 diseños' },
      { nombre: 'Lámpara LED con luz incluida', objeto: 'lampara-led', params: { style: 'espiral' }, foto: '/miniaturas/variantes/lampara-led--espiral.webp', desde: '$19.500', nota: 'Lista para usar, a pilas o con cable' },
      { nombre: 'Pack de 2 veladores de mesa', objeto: 'lampara-led', params: { style: 'hongo' }, foto: '/miniaturas/variantes/lampara-led--hongo.webp', desde: '$34.000', nota: 'Con luz incluida, iguales o combinados' },
      { nombre: 'Botellero ondulado', objeto: 'botellero', desde: '$18.500', nota: 'Regalo de mesa' },
      { nombre: 'Botellero para copas', objeto: 'botellero-copas', desde: '$18.500', nota: 'Cuelga las copas del pie' },
      { nombre: 'Florero low poly', objeto: 'florero-low-poly', desde: '$9.500', nota: 'Para plantas secas o flores' },
      { nombre: 'Maceta geométrica', objeto: 'maceta', desde: '$8.500', nota: 'Con o sin drenaje' },
      { nombre: 'Caja de pañuelos redonda', objeto: 'caja-panuelos', desde: '$14.500', nota: 'Pieza decorativa para mesa' },
      { nombre: 'Torre porta cápsulas de café', objeto: 'porta-capsulas', desde: '$17.500', nota: 'Para cápsulas tipo Nespresso' },
      { nombre: 'Posavasos personalizados', objeto: 'posavasos', desde: '$3.000', nota: 'Juego de 4 con base: $10.500' },
      { nombre: 'Posavasos hoja de monstera', objeto: 'posavasos-monstera', desde: '$3.000', nota: 'Juego de 4: $10.500' },
    ] },
    { id: 'organizacion', titulo: 'Organizadores', items: [
      { nombre: 'Organizador de escritorio', objeto: 'organizador', desde: '$12.500', nota: 'Con cartel frontal grabado' },
      { nombre: 'Portalápices panal', objeto: 'portalapices-panal', desde: '$11.500', nota: 'Celdas hexagonales' },
      { nombre: 'Tachito con tapa basculante', objeto: 'tachito-tapa', desde: '$15.500', nota: 'Escritorio o maquillaje' },
      { nombre: 'Organizador modular de cajones', objeto: 'bandeja-cajon', desde: '$5.500', nota: 'Por módulo · set de 4: $19.500' },
      { nombre: 'Organizador de controles remotos', objeto: 'organizador-controles', desde: '$12.500', nota: 'Para el living' },
      { nombre: 'Llavero de pared panal', objeto: 'llavero-pared-panal', desde: '$11.000', nota: 'Con ganchos de otro color' },
      { nombre: 'Organizador de maquillaje', objeto: 'organizador-maquillaje', desde: '$14.500', nota: 'Pinceles y paletas' },
      { nombre: 'Organizador de labiales', objeto: 'organizador-labiales', desde: '$13.500', nota: 'Según cantidad de celdas' },
    ] },
    { id: 'tecnologia', titulo: 'Escritorio, celulares y gaming', items: [
      { nombre: 'Soporte para celular', objeto: 'soporte-celular', desde: '$6.500', nota: 'Ideal para regalo corporativo' },
      { nombre: 'Base vertical para notebook o tablet', objeto: 'soporte-notebook', desde: '$13.000', nota: 'Resistente y con encaje preciso' },
      { nombre: 'Soporte para auriculares', objeto: 'soporte-auriculares', desde: '$13.000', nota: 'Con nombre grabado' },
      { nombre: 'Soporte para mandos de consola', objeto: 'soporte-mandos', desde: '$13.500', nota: 'Nicho gaming personalizado' },
    ] },
    { id: 'negocios', titulo: 'Negocios y carteles', items: [
      { nombre: 'Cartel deslizante (Libre / Ocupado)', objeto: 'cartel-deslizante', desde: '$10.500', nota: 'Para consultorios y oficinas' },
      { nombre: 'Display QR de mostrador', objeto: 'display-qr', desde: '$11.500', nota: 'Impreso a 2 colores' },
      { nombre: 'Cartel de Wi-Fi con QR', objeto: 'cartel-wifi', desde: '$11.500', nota: 'Impreso a 2 colores' },
      { nombre: 'Placa con nombre o frase', objeto: 'placa', desde: '$7.500', nota: 'Puerta, escritorio o local' },
    ] },
    { id: 'llaveros', titulo: 'Llaveros y souvenirs', items: [
      { nombre: 'Llavero con nombre', objeto: 'llavero', desde: '$3.500', nota: 'Pack de 5: $12.000 · tandas desde 10: consultá' },
      { nombre: 'Llavero con inicial y nombre', objeto: 'llavero-inicial', desde: '$3.500', nota: 'Pack de 5: $12.000' },
      { nombre: 'Llavero lettering', objeto: 'llavero-lettering', desde: '$3.500', nota: 'Dos palabras en dos colores' },
      { nombre: 'Llavero placa con ícono', objeto: 'llavero-placa', desde: '$3.800', nota: 'Souvenir de eventos' },
      { nombre: 'Llavero articulado con nombre', objeto: 'llavero-articulado', desde: '$4.500', nota: 'Se dobla como una cinta' },
      { nombre: 'Souvenir «Gracias Seño»', objeto: 'llavero', params: { text: 'Gracias Seño', symbol: 'heart', variant: 'capsule' }, foto: idea('souvenir'), desde: '$3.800', nota: 'Descuento desde 10 unidades' },
      { nombre: 'Llavero QR de contacto', objeto: 'llavero-qr', desde: '$4.500', nota: 'Pack de 5: $19.000' },
    ] },
    { id: 'navidad', titulo: 'Navidad', items: [
      { nombre: 'Galletita de jengibre', objeto: 'galleta-jengibre', desde: '$2.500', nota: '5 por $11.000 · 10 por $20.000' },
      { nombre: 'Bastón de caramelo', objeto: 'baston-caramelo', desde: '$2.500', nota: '5 por $11.000 · 10 por $20.000' },
      { nombre: 'Copo de nieve', objeto: 'copo-nieve', desde: '$2.500', nota: '5 por $11.000 · 10 por $20.000' },
      { nombre: 'Arbolito con nombre', objeto: 'adorno-navidad', params: { shape: 'arbol', text: 'Lola', colorBase: '#2E9E58' }, foto: idea('arbolito'), desde: '$2.500', nota: '5 por $11.000 · 10 por $20.000' },
      { nombre: 'Bola con nombre', objeto: 'adorno-navidad', params: { shape: 'bola', text: 'Sofía' }, foto: idea('bola'), desde: '$3.500', nota: 'Combo familiar (4): $12.500' },
      { nombre: 'Estrella con nombre', objeto: 'adorno-navidad', params: { shape: 'estrella', text: 'Mateo', colorBase: '#C9A24A' }, foto: idea('estrella'), desde: '$3.500', nota: 'Combo familiar (4): $12.500' },
      { nombre: 'Etiqueta para regalos', objeto: 'adorno-navidad', params: { shape: 'etiqueta', text: 'Para Juli' }, foto: idea('etiqueta'), desde: '$2.000', nota: 'Pack de 5: $9.000' },
      { nombre: 'Servilletero con pinos', objeto: 'servilletero', desde: '$3.000', nota: 'Set de 6: $16.500' },
      { nombre: 'Arbolito zigzag de mesa', objeto: 'arbol-zigzag', desde: '$6.000', nota: 'Trío de distintos tamaños: $17.000' },
      { nombre: 'Arbolito cónico ondulado', objeto: 'arbol-conico', desde: '$5.000', nota: 'Para la mesa, varios tamaños' },
      { nombre: 'Estrella para la punta del árbol', objeto: 'estrella-arbol', desde: '$6.500', nota: 'Acabado dorado o seda' },
      { nombre: 'Cartel de puerta navideño', objeto: 'placa', params: { line1: 'Feliz Navidad', line2: 'Familia García' }, foto: idea('cartel'), desde: '$7.500', nota: 'Con el apellido de la familia' },
    ] },
  ],
};
