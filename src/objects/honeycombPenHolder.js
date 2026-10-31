// Portalápices panal: celdas hexagonales en anillos, más altas en el centro (forma de domo).
import { union, difference, regularPolygon } from '../core/geometry2d.js';
import { extrudeRegion, part } from '../core/mesh.js';

/** Celdas de un panal hexagonal de `rings` anillos alrededor de una central (coordenadas axiales). */
function hexRings(rings) {
  const out = [];
  for (let q = -rings; q <= rings; q++) for (let r = -rings; r <= rings; r++) {
    const s = -q - r;
    if (Math.abs(s) <= rings) out.push({ q, r, ring: Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) });
  }
  return out;
}

export default {
  id: 'portalapices-panal',
  name: 'Portalápices panal',
  category: 'organizacion',
  description: 'Celdas hexagonales para lápices, marcadores y tijeras, más altas en el centro. Cada celda es un compartimento.',
  tags: ['lápices', 'portalápices', 'escritorio', 'panal', 'hexágono', 'marcadores', 'oficina'],
  printTime: '3–6 h',
  defaults: { rings: 2, cell: 22, wall: 1.6, height: 95, dome: 45, floor: 2, color: '#F1F1EC' },
  sections: [
    { title: 'Forma', items: [
      { key: 'rings', type: 'stepper', label: 'Anillos de celdas', min: 1, max: 3, help: '1 = 7 celdas · 2 = 19 · 3 = 37' },
      { key: 'dome', type: 'range', label: 'Diferencia de altura (centro / borde)', min: 0, max: 70, step: 1, unit: '%' },
    ] },
    { title: 'Medidas', items: [
      { key: 'cell', type: 'range', label: 'Ancho de cada celda', min: 14, max: 40, step: 1, unit: 'mm' },
      { key: 'height', type: 'range', label: 'Alto de la celda central', min: 40, max: 160, step: 1, unit: 'mm' },
      { key: 'wall', type: 'range', label: 'Paredes', min: 1.2, max: 3, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Color', items: [{ key: 'color', type: 'color', label: 'Filamento' }] },
  ],
  orientations: [{ id: 'upright', label: 'Parado' }],

  build(p) {
    const issues = [];
    const s = p.cell, R = s / Math.sqrt(3), w = p.wall, n = Math.round(p.rings);
    const cells = hexRings(n).map((c) => ({ ...c, x: s * (c.q + c.r / 2), y: 1.5 * R * c.r }));
    const hex = (c, rad) => regularPolygon(c.x, c.y, rad, 6, Math.PI / 2);
    // Paredes compartidas: cada celda es un anillo de grosor w centrado en el borde teórico
    const kRad = 1 / Math.cos(Math.PI / 6); // de apotema a radio
    const volumes = [];
    const maxD = Math.max(1, n);
    for (const c of cells) {
      const t = c.ring / maxD;
      const h = p.height * (1 - (p.dome / 100) * t * t);
      const ring = difference(hex(c, R + (w / 2) * kRad), hex(c, R - (w / 2) * kRad));
      volumes.push(extrudeRegion(ring, 0, Math.max(p.floor + 5, h)));
    }
    const outline = union(...cells.map((c) => hex(c, R + (w / 2) * kRad)));
    volumes.push(extrudeRegion(outline, 0, p.floor));
    const inner = (s - w).toFixed(0);
    issues.push({ level: 'info', msg: `${cells.length} celdas de ${inner} mm por dentro. Para tijeras o reglas, subí el ancho de las celdas.` });
    if (s - w < 13) issues.push({ level: 'warning', msg: 'Las celdas quedan muy angostas para un marcador grueso.' });
    return { parts: [part('body', 'Portalápices', p.color, volumes, { focus: true })], issues };
  },
};
