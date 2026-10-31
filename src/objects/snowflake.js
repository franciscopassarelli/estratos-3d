// Copo de nieve: seis brazos iguales con ramitas generadas a partir de una «semilla».
// Cada número da un copo distinto; se cuelga con la argolla de arriba.
import { union, difference, offset, bbox, circle, stroke, regularPolygon, islandCount, thinFraction } from '../core/geometry2d.js';
import { extrudeRegion, part } from '../core/mesh.js';

/** Generador pseudoaleatorio reproducible (mulberry32). */
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const rot = (pts, a) => pts.map(({ x, y }) => ({ x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) }));

export default {
  id: 'copo-nieve',
  name: 'Copo de nieve',
  category: 'hogar',
  description: 'Copo de seis brazos para colgar en el árbol o en la ventana. Cambiá la semilla y sale un copo distinto cada vez.',
  tags: ['navidad', 'copo', 'nieve', 'invierno', 'adorno', 'ventana', 'árbol'],
  printTime: '20–40 min',
  defaults: { seed: 7, size: 80, line: 2.4, branches: 3, center: 'hex', thickness: 2.4, hole: 3.5, color: '#F1F1EC' },
  sections: [
    { title: 'Diseño', items: [
      { key: 'seed', type: 'stepper', label: 'Semilla (cada número es un copo distinto)', min: 1, max: 99 },
      { key: 'branches', type: 'stepper', label: 'Ramitas por brazo', min: 1, max: 5 },
      { key: 'center', type: 'segmented', label: 'Centro', options: [{ value: 'hex', label: 'Hexágono' }, { value: 'ring', label: 'Aro' }, { value: 'star', label: 'Estrella' }] },
    ] },
    { title: 'Medidas', items: [
      { key: 'size', type: 'range', label: 'Diámetro', min: 40, max: 150, step: 1, unit: 'mm' },
      { key: 'line', type: 'range', label: 'Grosor de las líneas', min: 1.6, max: 5, step: 0.1, unit: 'mm' },
      { key: 'thickness', type: 'range', label: 'Grosor', min: 1.6, max: 5, step: 0.1, unit: 'mm' },
      { key: 'hole', type: 'range', label: 'Agujero para colgar', min: 2.5, max: 6, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Color', items: [{ key: 'color', type: 'color', label: 'Filamento', help: 'Blanco o celeste quedan muy bien; en PLA transparente brilla con las luces.' }] },
  ],
  orientations: [{ id: 'flat', label: 'Plano sobre la cama' }],

  build(p) {
    const issues = [];
    const R = p.size / 2, w = p.line, rand = rng(Math.round(p.seed) * 7919 + 13);
    const nb = Math.round(p.branches);

    // Un brazo (apuntando hacia arriba): eje + pares de ramitas a 60°
    const arm = [stroke([{ x: 0, y: 0 }, { x: 0, y: R - w / 2 }], w)];
    for (let k = 0; k < nb; k++) {
      const t = 0.3 + (0.6 * (k + 0.5 + (rand() - 0.5) * 0.5)) / nb; // posición a lo largo del brazo
      const y = t * R;
      const len = Math.min((R - y) * (0.55 + rand() * 0.5), R * 0.42);
      if (len < w * 2) continue;
      const ang = (Math.PI / 3) * (0.85 + rand() * 0.3);
      for (const s of [-1, 1]) {
        const tip = { x: s * Math.sin(ang) * len, y: y + Math.cos(ang) * len };
        arm.push(stroke([{ x: 0, y }, tip], w * (0.75 + rand() * 0.25)));
        // a veces, una ramita secundaria
        if (rand() > 0.55 && len > w * 5) {
          const m = 0.55, mid = { x: tip.x * m, y: y + (tip.y - y) * m }, l2 = len * 0.35;
          arm.push(stroke([mid, { x: mid.x + s * Math.sin(ang * 0.4) * l2, y: mid.y + Math.cos(ang * 0.4) * l2 }], w * 0.75));
        }
      }
    }
    // Punta del brazo
    if (rand() > 0.4) arm.push(regularPolygon(0, R * 0.9, w * 1.3, 4, Math.PI / 4));
    const armR = union(...arm);
    const arms = [];
    for (let i = 0; i < 6; i++) arms.push(armR.map((ring) => rot(ring, (i * Math.PI) / 3)));

    let centre;
    if (p.center === 'ring') centre = difference(circle(0, 0, R * 0.22, 64), circle(0, 0, R * 0.22 - w, 64));
    else if (p.center === 'star') centre = union(...[0, 1].map((k) => regularPolygon(0, 0, R * 0.2, 3, Math.PI / 2 + (k * Math.PI) / 3)));
    else centre = regularPolygon(0, 0, R * 0.17, 6, Math.PI / 6);
    let flake = union(...arms, centre);

    // Argolla en la punta del brazo de arriba
    const ringR = p.hole / 2 + 1.8, cy = bbox(flake).maxY + ringR * 0.5;
    flake = difference(union(flake, circle(0, cy, ringR, 48)), circle(0, cy, p.hole / 2, 40));

    if (islandCount(flake) > 1) issues.push({ level: 'error', msg: 'El copo quedó con partes sueltas. Probá otra semilla o aumentá el grosor de las líneas.' });
    if (thinFraction(flake, 1.2) > 0.05) issues.push({ level: 'warning', msg: 'Algunas líneas quedan muy finas para imprimirse bien. Aumentá el grosor de las líneas.' });
    return { parts: [part('flake', 'Copo', p.color, extrudeRegion(flake, 0, p.thickness), { focus: true })], issues };
  },
};
