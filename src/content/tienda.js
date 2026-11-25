// Tienda: los productos reales que se venden. Se muestran en el inicio, en /tienda y en /tienda/<id>.
//
// Para sumar un producto nuevo (sin pedirle nada a nadie):
//   1. Copiá sus fotos a  tienda-originales/  con el nombre del producto (lampara-luna.jpg, lampara-luna-2.jpg…).
//   2. Corré  npm run producto  (achica las fotos y agrega una ficha base más abajo).
//   3. Completá la ficha (nombre, precio, descripción…) y hacé push.
//
// Campos de cada ficha:
//   id            nombre de las fotos y de la URL (/tienda/<id>)
//   nombre        cómo se ve en la web
//   categoria     id de una de las categorías de abajo
//   precio        número en pesos (24000) o null para mostrar «Consultá el precio»
//   mayor         (opcional) { desde: 4, precio: 19000 }  precio por unidad llevando 4 o más
//   colores       (opcional) lista de colores disponibles; se eligen en la ficha y viajan en el mensaje de WhatsApp
//   descripcion   texto corto (1-2 frases)
//   detalles      (opcional) lista de puntos: medidas, qué incluye, etc.
//   plazo         (opcional) por ejemplo '3 a 5 días'; si falta se usa el general
//   destacado     (opcional) true = aparece en el inicio
//   oculto        (opcional) true = no se muestra (por ejemplo, sin stock)
export const TIENDA = {
  plazo: 'unos 2 días',
  actualizado: 'noviembre 2026',
  categorias: [
    { id: 'lamparas', titulo: 'Lámparas' },
    { id: 'cocina', titulo: 'Cocina' },
    { id: 'otros', titulo: 'Otros' },
  ],
  productos: [
    { id: 'lampara-corazones', nombre: 'Lámpara Corazones', categoria: 'lamparas', precio: 26000, destacado: true,
      descripcion: 'Lámpara de mesa impresa en 3D con relieve de corazones. Al prenderla, la luz se filtra y deja un brillo cálido y suave.', detalles: ['Luz LED incluida (módulo LED redondo con cable e interruptor)']  },
    { id: 'lampara-escamas', nombre: 'Lámpara Escamas', categoria: 'lamparas', precio: 27000, destacado: true,
      descripcion: 'Lámpara de mesa impresa en 3D con textura de escamas que juega con la luz y las sombras.', detalles: ['Luz LED incluida (módulo LED redondo con cable e interruptor)'] },
    { id: 'lampara-ondas-violeta', nombre: 'Lámpara Ondas (luz violeta)', categoria: 'lamparas', precio: 25000, destacado: true,
      descripcion: 'Lámpara de mesa de ondas torcidas, impresa en 3D. Con luz de color.', detalles: ['Luz LED incluida (módulo LED redondo con cable e interruptor)'] },
    { id: 'lampara-anillos', nombre: 'Lámpara Anillos con trípode', categoria: 'lamparas', precio: 33000, destacado: true,
      descripcion: 'Pantalla de anillos ondulados impresa en 3D, sobre un trípode negro. Luz cálida.', detalles: ['Con portalámparas E27 (lampara incluida)'] },
    { id: 'lampara-torsion', nombre: 'Lámpara Torsión', categoria: 'lamparas', precio: 25000,
      descripcion: 'Pantalla plisada con efecto de torsión, impresa en 3D. Deja pasar una luz tenue y envolvente.', detalles: ['Luz LED incluida (módulo LED redondo con cable e interruptor)'] },
    { id: 'lampara-ondas-rosa', nombre: 'Lámpara Ondas (luz rosa)', categoria: 'lamparas', precio: 25000,
      descripcion: 'Lámpara de mesa de ondas torcidas, impresa en 3D. Con luz de color.', detalles: ['Luz LED incluida (módulo LED redondo con cable e interruptor)'] },
    { id: 'porta-capsulas-nespresso', nombre: 'Torre porta cápsulas', categoria: 'cocina', precio: 24000, mayor: { desde: 4, precio: 19000 }, destacado: true,
      colores: ['Negro', 'Blanco', 'Gris'],
      descripcion: 'Torre giratoria para tener tus cápsulas de café a la vista y a mano. Entran 20 cápsulas, 5 por cada lado.',
      detalles: ['Compatible con cápsulas Nespresso', 'Capacidad: 20 cápsulas (4 lados de 5)', 'Medidas: 101 × 101 × 215 mm', 'Impresa en 3D, base antideslizante', 'Otros colores: consultá'] },
    // ⬇ PRODUCTOS NUEVOS: la herramienta agrega las fichas acá abajo
  ],
};

export const getProducto = (id) => TIENDA.productos.find((p) => p.id === id && !p.oculto);
export const productos = () => TIENDA.productos.filter((p) => !p.oculto);
export const destacados = () => { const d = productos().filter((p) => p.destacado); return d.length ? d : productos().slice(0, 4); };
