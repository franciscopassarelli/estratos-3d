// Eventos por fecha (Navidad, Día del Padre, etc.).
// Mientras un evento está activo, aparece un botón en el menú lateral y un aviso en la portada.
// Su página (por ejemplo /navidad) queda publicada todo el año para que Google la conozca.
//
// Para sumar un evento: agregá una entrada con fechas en formato MM-DD (sin año, se repite cada año).
// Para verlo antes de la fecha: entrá a cualquier página con ?evento=navidad
//
// Cada sugerencia abre un diseño con ajustes precargados (por la URL).

export const EVENTS = [
  {
    id: 'navidad',
    path: '/navidad',
    label: 'Navidad',
    desde: '11-01',
    hasta: '12-25',
    aviso: 'Adornos con nombre, etiquetas para regalos y souvenirs de fin de año, listos para imprimir.',
    title: 'Adornos y regalos navideños para imprimir en 3D',
    description: 'Diseñá adornos para el árbol con nombre, etiquetas para regalos, carteles y souvenirs de fin de año. Gratis, sin registrarte y listos para tu impresora 3D.',
    lead: 'Adornos con el nombre de cada uno, etiquetas para los regalos y souvenirs de fin de año. Elegí una idea, cambiá el nombre y los colores, y descargá el archivo listo para imprimir.',
    ideas: [
      { objeto: 'adorno-navidad', titulo: 'Bola con nombre', texto: 'Una para cada integrante de la familia. Roja con letras blancas, el clásico.', params: { shape: 'bola', text: 'Sofía' } },
      { objeto: 'adorno-navidad', titulo: 'Estrella dorada', texto: 'En dorado seda con letras blancas queda elegante colgada del árbol.', params: { shape: 'estrella', text: 'Mateo', colorBase: '#C9A24A', colorText: '#F1F1EC' } },
      { objeto: 'adorno-navidad', titulo: 'Arbolito', texto: 'Verde con borde blanco, como un pino nevado. Ideal para regalar en la oficina.', params: { shape: 'arbol', text: 'Lola', colorBase: '#2E9E58', colorText: '#F1F1EC' } },
      { objeto: 'estrella-arbol', titulo: 'Estrella para la punta', texto: 'Facetada en dorado seda, brilla con las luces del árbol. Se ata a la rama de arriba.', params: { style: 'faceted' } },
      { objeto: 'estrella-arbol', titulo: 'Estrella calada', texto: 'Con ventanitas triangulares: las luces se ven a través.', params: { style: 'open', color: '#F1F1EC' } },
      { objeto: 'copo-nieve', titulo: 'Copos de nieve', texto: 'Cada número de semilla da un copo distinto. Hacé una tanda para la ventana.', params: { seed: 7 } },
      { objeto: 'arbol-conico', titulo: 'Arbolitos para la mesa', texto: 'Conos ondulados en modo vaso: rápidos de imprimir, en distintos tamaños y colores.', params: { height: 150 } },
      { objeto: 'servilletero', titulo: 'Servilleteros con pinos', texto: 'Uno de cada color para la cena de Nochebuena.', params: { color: '#C9302C' } },
      { objeto: 'adorno-navidad', titulo: 'Etiqueta para regalos', texto: 'Se ata al moño con una cinta. Nadie se confunde de regalo.', params: { shape: 'etiqueta', text: 'Para Juli', colorBase: '#F1F1EC', colorText: '#C9302C' } },
      { objeto: 'placa', titulo: 'Cartel para la puerta', texto: 'Una placa de bienvenida con el apellido de la familia.', params: { line1: 'Feliz Navidad', line2: 'Familia García', colorBase: '#F1F1EC', colorBorder: '#C9302C', colorText: '#2E9E58' } },
      { objeto: 'llavero', titulo: 'Souvenir «Gracias seño»', texto: 'Para el fin de las clases: un llavero para la maestra o para todo el grado.', params: { text: 'Gracias Seño', symbol: 'heart', variant: 'capsule', colorBase: '#C9302C', colorText: '#F1F1EC' } },
      { objeto: 'posavasos', titulo: 'Posavasos para la mesa', texto: 'Un juego para la mesa de Navidad con un brindis grabado.', params: { text: 'Felices Fiestas', colorBase: '#2E9E58', colorTop: '#C9A24A' } },
    ],
    consejos: [
      { h: 'Qué tamaño y filamento usar', html: '<p>Para colgar en el árbol, entre <b>60 y 80 mm</b> de alto es lo ideal: se ven bien de lejos y pesan poco. Un adorno de 70 mm a dos colores usa unos 6 a 8 g de PLA. El rojo, el verde y el <b>dorado seda</b> son los colores más navideños; con letras blancas el nombre se lee desde lejos.</p>' },
      { h: 'Cómo imprimir a dos colores con un solo extrusor', html: '<p>Los adornos se generan con la base y el texto como piezas separadas. Si tu impresora no es multicolor, agregá un <b>cambio de filamento</b> en la capa donde empiezan las letras (justo arriba del grosor de la base). La impresora se pausa, cambiás el rollo y sigue. Lo explicamos paso a paso en <a href="/guias/imprimir-dos-colores-sin-multicolor">la guía de dos colores</a>.</p>' },
      { h: 'Ideas para regalar', html: '<p>Un adorno con el nombre de cada invitado sirve también como <b>marcador de lugar</b> en la mesa de Navidad. Las etiquetas para regalos se pueden reutilizar todos los años. Y si sos docente o tenés hijos en la escuela, los llaveros con «Gracias Seño» o el nombre del grado son un clásico de fin de año: con la web los hacés todos en una tarde.</p>' },
    ],
  },
];

const mmdd = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const inRange = (e, d) => (e.desde <= e.hasta ? d >= e.desde && d <= e.hasta : d >= e.desde || d <= e.hasta);

/** Evento activo hoy (o el que se pidió con ?evento=… para verlo antes). */
export function activeEvent(date = new Date()) {
  if (typeof window !== 'undefined') {
    try {
      const q = new URLSearchParams(window.location.search).get('evento');
      if (q !== null) sessionStorage.setItem('estratos:evento', q);
      const forced = sessionStorage.getItem('estratos:evento');
      if (forced) return EVENTS.find((e) => e.id === forced) || null;
    } catch { /* sin sessionStorage */ }
  }
  const d = mmdd(date);
  return EVENTS.find((e) => inRange(e, d)) || null;
}

export const getEvent = (id) => EVENTS.find((e) => e.id === id);

/** Link a un diseño con ajustes precargados. */
export function presetHref(idea) {
  const q = new URLSearchParams(Object.entries(idea.params || {}).map(([k, v]) => [k, String(v)]));
  return `/crear/${idea.objeto}${q.size || [...q].length ? `?${q}` : ''}`;
}
