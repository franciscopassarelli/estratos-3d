// Organizador de controles remotos: extremos redondeados, compartimentos y el borde de arriba en pendiente
// (más bajo adelante para ver los botones y sacar los controles fácil).
import { union, difference, intersection, offset, bbox, roundedRect, rect } from '../core/geometry2d.js';
import { extrudeRegion, part } from '../core/mesh.js';

/** Inclina la cara de arriba de una extrusión: z sube linealmente de adelante (y mínima) hacia atrás. */
function slopeTop(geometry, zTop, yMin, yMax, hFront, hBack) {
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (Math.abs(pos.getZ(i) - zTop) > 1e-4) continue;
    const t = (pos.getY(i) - yMin) / (yMax - yMin);
    pos.setZ(i, hFront + (hBack - hFront) * Math.min(1, Math.max(0, t)));
  }
  pos.needsUpdate = true;
  geometry.computeBoundingBox();
  return geometry;
}

export default {
  id: 'organizador-controles',
  name: 'Organizador de controles remotos',
  category: 'organizacion',
  description: 'Caja para controles del tele, el aire y la consola, con extremos redondeados y el borde en pendiente: atrás más alto, adelante más bajo para sacarlos fácil.',
  tags: ['controles', 'remoto', 'living', 'mesa ratona', 'organizador', 'tele', 'aire acondicionado'],
  printTime: '4–7 h',
  defaults: { shape: 'capsule', width: 190, depth: 80, back: 85, front: 50, slots: 3, frontRow: true, wall: 2.4, floor: 2, color: '#B98A5B' },
  sections: [
    { title: 'Forma', items: [
      { key: 'shape', type: 'cards', label: 'Estilo', options: [
        { value: 'capsule', label: 'Redondeado', hint: 'Extremos en semicírculo' },
        { value: 'rect', label: 'Recto', hint: 'Esquinas suaves' },
      ] },
      { key: 'slots', type: 'stepper', label: 'Compartimentos', min: 2, max: 6 },
      { key: 'frontRow', type: 'toggle', label: 'Fila delantera para cosas chicas (pilas, anteojos)' },
    ] },
    { title: 'Medidas', items: [
      { key: 'width', type: 'range', label: 'Largo', min: 110, max: 220, step: 1, unit: 'mm' },
      { key: 'depth', type: 'range', label: 'Ancho', min: 50, max: 120, step: 1, unit: 'mm' },
      { key: 'back', type: 'range', label: 'Alto atrás', min: 40, max: 140, step: 1, unit: 'mm' },
      { key: 'front', type: 'range', label: 'Alto adelante', min: 25, max: 140, step: 1, unit: 'mm' },
      { key: 'wall', type: 'range', label: 'Paredes', min: 1.6, max: 4, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Color', items: [{ key: 'color', type: 'color', label: 'Filamento', help: 'El PLA «madera» o terracota queda muy bien en el living.' }] },
  ],
  orientations: [{ id: 'upright', label: 'Parado' }],

  build(p) {
    const issues = [];
    const W = p.width, D = p.depth, w = p.wall, F = p.floor;
    const hFront = Math.min(p.front, p.back), hBack = Math.max(p.front, p.back);
    if (p.front > p.back) issues.push({ level: 'info', msg: 'El alto de adelante era mayor que el de atrás: se invirtieron para que la pendiente quede hacia adelante.' });
    const outer = roundedRect(0, 0, W, D, p.shape === 'capsule' ? D / 2 : Math.min(10, D / 5), 24);
    const inner = offset(outer, -w);

    // Compartimentos: una fila de atrás (larga) y, opcional, una delantera más angosta
    const dividers = [];
    const ib = bbox(inner);
    let backY0 = ib.minY;
    if (p.frontRow) {
      const fy = ib.minY + (ib.maxY - ib.minY) * 0.32;
      dividers.push(rect(0, fy, W, w));
      backY0 = fy;
      // la fila delantera se divide en dos
      dividers.push(rect(0, (ib.minY + fy) / 2, w, fy - ib.minY + 1));
    }
    const n = Math.round(p.slots);
    for (let i = 1; i < n; i++) {
      const x = ib.minX + ((ib.maxX - ib.minX) * i) / n;
      dividers.push(rect(x, (backY0 + ib.maxY) / 2, w, ib.maxY - backY0 + 1));
    }
    const walls = union(difference(outer, inner), intersection(union(...dividers), inner));

    const ob = bbox(outer);
    const floorV = extrudeRegion(outer, 0, F);
    const wallV = slopeTop(extrudeRegion(walls, F, hBack), hBack, ob.minY, ob.maxY, hFront, hBack);
    const cw = (ib.maxX - ib.minX) / n - w;
    if (cw < 38) issues.push({ level: 'warning', msg: `Cada compartimento queda de ${cw.toFixed(0)} mm de ancho: algunos controles no entran. Usá menos compartimentos o un largo mayor.` });
    if (W > 210 || D > 210) issues.push({ level: 'info', msg: 'Revisá que entre en la cama de tu impresora.' });
    issues.push({ level: 'info', msg: 'Imprimilo con 2–3 perímetros y 10–15 % de relleno: queda liviano y firme.' });
    return { parts: [part('box', 'Organizador', p.color, [floorV, wallV], { focus: true })], issues };
  },
};
