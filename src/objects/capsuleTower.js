// Torre porta cápsulas: cuatro columnas (una por cara) donde la cápsula se cuelga del borde
// y baja por una ranura. Abajo, una base redonda de discos apilados (otro color).
import { union, difference, offset, rect, roundedRect } from '../core/geometry2d.js';
import { extrudeRegion, part } from '../core/mesh.js';
import { revolve } from '../core/revolve.js';

const TYPES = {
  original: { rim: 37.5, neck: 31, len: 29 }, // Nespresso Original
};

/** Sección horizontal de la torre: núcleo hueco con una ranura en T en cada cara. */
function section(c, wall) {
  const pocketW = c.rim + 1.5, pocketD = 2.6, slotW = c.neck + 1.6, lip = wall;
  const a = pocketW / 2 + wall + 0.5; // media cara del núcleo
  const b = a + pocketD + lip;
  let s = roundedRect(0, 0, 2 * b, 2 * b, 6);
  const cuts = [];
  for (const [nx, ny] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const pocket = nx ? rect(nx * (a + pocketD / 2), 0, pocketD, pocketW) : rect(0, ny * (a + pocketD / 2), pocketW, pocketD);
    const slot = nx ? rect(nx * (a + pocketD + lip / 2), 0, lip + 2, slotW) : rect(0, ny * (a + pocketD + lip / 2), slotW, lip + 2);
    cuts.push(pocket, slot);
  }
  s = difference(s, union(...cuts));
  // Núcleo hueco: menos plástico y se imprime más rápido
  s = difference(s, roundedRect(0, 0, 2 * (a - wall), 2 * (a - wall), 3));
  return { region: s, a, b };
}

export default {
  id: 'porta-capsulas',
  name: 'Torre porta cápsulas',
  category: 'hogar',
  description: 'Torre de cuatro columnas para cápsulas de café tipo Nespresso: la cápsula se cuelga del borde y baja sola. Base redonda de discos apilados en otro color.',
  tags: ['cápsulas', 'café', 'nespresso', 'cocina', 'organizador', 'torre', 'cafetera'],
  printTime: '6–10 h',
  defaults: { perColumn: 5, rim: 37.5, neck: 31, wall: 2.4, baseRings: 3, colorTower: '#26272B', colorBase: '#4A3024' },
  sections: [
    { title: 'Capacidad', items: [
      { key: 'perColumn', type: 'stepper', label: 'Cápsulas por columna', min: 3, max: 6, help: 'Son cuatro columnas: el total es cuatro veces este número.' },
    ] },
    { title: 'Cápsula', items: [
      { key: 'rim', type: 'range', label: 'Diámetro del borde', min: 30, max: 45, step: 0.1, unit: 'mm', help: 'Nespresso Original: 37,5 mm' },
      { key: 'neck', type: 'range', label: 'Diámetro del cuerpo junto al borde', min: 24, max: 40, step: 0.1, unit: 'mm', help: 'Nespresso Original: 31 mm' },
    ] },
    { title: 'Forma', items: [
      { key: 'wall', type: 'range', label: 'Paredes', min: 1.6, max: 3.2, step: 0.1, unit: 'mm' },
      { key: 'baseRings', type: 'stepper', label: 'Discos de la base', min: 1, max: 4 },
    ] },
    { title: 'Colores', items: [
      { key: 'colorTower', type: 'color', label: 'Torre' },
      { key: 'colorBase', type: 'color', label: 'Base' },
    ] },
  ],
  orientations: [{ id: 'upright', label: 'Parada, como se usa' }],

  build(p) {
    const issues = [];
    const c = { rim: p.rim, neck: Math.min(p.neck, p.rim - 3), len: TYPES.original.len };
    if (p.neck > p.rim - 3) issues.push({ level: 'warning', msg: 'El cuerpo de la cápsula tiene que ser al menos 3 mm más angosto que el borde: si no, se sale de la ranura.' });
    const { region, b } = section(c, p.wall);
    const n = Math.round(p.perColumn), pitch = c.rim + 0.8;

    // Base: discos apilados con canto redondeado (pendiente < 45°, sin soportes)
    const rings = Math.round(p.baseRings), hr = 6.5, Hb = rings * hr, Rb = b + c.len * 0.8, dep = 1.8;
    const prof = [[0, 0]];
    for (let i = 0; i < rings; i++) for (let k = 0; k <= 12; k++) {
      if (i > 0 && k === 0) continue;
      const u = k / 12;
      prof.push([Rb - dep * (1 - Math.sin(Math.PI * u)), i * hr + u * hr]);
    }
    prof.push([0, Hb]);
    const base = revolve(prof, 0, 0, 128);

    // Torre con canto de arriba redondeado en dos escalones finos
    const Ht = n * pitch + 4, top = Hb + Ht;
    const tower = [
      extrudeRegion(region, Hb, top - 1.6),
      extrudeRegion(offset(region, -0.4), top - 1.6, top - 0.8),
      extrudeRegion(offset(region, -1), top - 0.8, top),
    ];

    // Dónde quedan las cápsulas (para la foto del catálogo)
    const capsules = [];
    const a = b - 2.6 - p.wall;
    for (const [nx, ny] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      for (let k = 0; k < n; k++) capsules.push({ x: nx * (a + 1.3), y: ny * (a + 1.3), z: Hb + k * pitch + c.rim / 2 + 0.3, dx: nx, dy: ny });
    }
    if (top > 245) issues.push({ level: 'warning', msg: `Mide ${top.toFixed(0)} mm de alto: puede no entrar en tu impresora. Bajá las cápsulas por columna.` });
    issues.push({ level: 'info', msg: `Entran ${n * 4} cápsulas. Se cargan por arriba: la cápsula entra con el borde en la ranura y baja hasta apoyarse en la de abajo.` });
    issues.push({ level: 'info', msg: `Para los dos colores, cambiá el filamento en la capa de ${Hb.toFixed(1)} mm (donde termina la base).` });
    return {
      parts: [
        part('base', 'Base', p.colorBase, base),
        part('tower', 'Torre', p.colorTower, tower, { focus: true }),
      ],
      issues,
      capsules,
    };
  },
};
