// Marca "Estratos 3D" como región 2D: isotipo (tres franjas) arriba y el nombre abajo.
// Sirve para grabarla en la cara de abajo de cualquier pieza: va en espejo (mirror) para que
// se lea bien al dar vuelta la pieza.
import { textRegion } from '../../core/text.js';
import { union, translate, scale, bbox, roundedRect } from '../../core/geometry2d.js';

export const BRAND_NAME = 'ESTRATOS 3D';

/** width = ancho total de la marca en mm. */
export function brandMark(width = 58, { mirror = true, gap = 3.2 } = {}) {
  const t = textRegion(BRAND_NAME, 'archivo', 10).region;
  const k = width / bbox(t).w;
  const text = scale(t, k);
  const th = bbox(text).h;

  // Isotipo: las tres franjas del logo (la de arriba más corta, la de abajo más larga)
  const ic = (width * 0.22) / 22;
  const bar = (w, y) => roundedRect(0, y * ic, w * ic, 4 * ic, 1.5 * ic, 4);
  const icon = union(bar(10, 6), bar(16, 0), bar(22, -6));
  const ih = bbox(icon).h;

  const total = ih + gap + th;
  let mark = union(
    translate(icon, 0, total / 2 - ih / 2),
    translate(text, 0, -total / 2 + th / 2),
  );
  if (mirror) mark = union(scale(mark, -1, 1));
  return mark;
}
