// Galería «Hecho con Estratos 3D»: fotos reales de piezas impresas con diseños de la web.
//
// Para sumar una foto:
//   1. Pedí permiso a la persona para publicarla (y guardá su respuesta).
//   2. Copiá la foto original a la carpeta  galeria-originales/  (no se sube a git).
//   3. Corré  npm run galeria : la achica, la pasa a WebP en public/galeria/ y anota sus medidas.
//   4. Agregá una entrada acá abajo (la más nueva arriba) y hacé push.
//
// Campos:
//   foto      nombre del archivo en public/galeria/ (lo muestra `npm run galeria`)
//   titulo    qué es la pieza
//   alt       descripción de la foto para lectores de pantalla y Google
//   autor     quién la diseñó o a quién pertenece (opcional)
//   imprimio  quién la imprimió, por ejemplo '@usuario' (opcional)
//   enlace    link al perfil de esa persona (opcional)
//   diseno    id del diseño en el catálogo, para el botón «Hacé el tuyo» (opcional)
//   fecha     AAAA-MM-DD
import SIZES from './gallery-sizes.js';
export const GALLERY = [
  {
    foto: 'mis2anitoslolo-souvenirs.webp',
    titulo: 'Souvenirs para un cumple de 2 años',
    alt: 'Decenas de llaveros impresos en 3D con el texto Mis2AñitosLolo en blanco sobre base negra, con una estrella, alineados sobre una mesa',
    autor: '',
    imprimio: 'Gaston Romano',
    enlace: 'https://www.instagram.com/gaston.carp93',
    diseno: 'llavero',
    fecha: '2026-10-30',
  },
  {
    foto: 'mis2anitoslolo-cama.webp',
    titulo: 'Tanda de llaveros «Mis2AñitosLolo»',
    alt: 'Siete llaveros con el texto Mis2AñitosLolo y una estrella, recién impresos sobre la cama de la impresora 3D',
    autor: '',
    imprimio: 'Gaston Romano',
    enlace: 'https://www.instagram.com/gaston.carp93',
    diseno: 'llavero',
    fecha: '2026-10-30',
  },
  {
    foto: 'llavero-fran-parado.webp',
    titulo: 'Llavero «Fran» a dos colores',
    alt: 'Llavero impreso en 3D con el nombre Fran en letras blancas sobre base negra, apoyado sobre la cama de la impresora',
    autor: 'Fran',
    imprimio: 'Gaston Romano',
    enlace: 'https://www.instagram.com/gaston.carp93',
    diseno: 'llavero',
    fecha: '2026-10-28',
  },
  {
    foto: 'llavero-fran-cama.webp',
    titulo: 'Recién salido de la impresora',
    alt: 'Llavero con el nombre Fran visto desde arriba sobre la cama texturada de la impresora 3D',
    autor: 'Fran',
    imprimio: 'Gaston Romano',
    enlace: 'https://www.instagram.com/gaston.carp93',
    diseno: 'llavero',
    fecha: '2026-10-28',
  },
];



/** Entradas con su foto existente y sus medidas (para reservar el espacio y que la página no salte). */
export function galleryItems() {
  return GALLERY.filter((g) => SIZES[g.foto]).map((g) => ({ ...g, w: SIZES[g.foto][0], h: SIZES[g.foto][1] }));
}
