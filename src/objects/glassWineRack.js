// Botellero rombo con portacopas: cuatro celdas cuadradas paradas sobre una punta, y las dos
// paredes de arriba se prolongan en forma de X con ranuras para colgar copas del pie.
// Se imprime acostado (el perfil en la cama y la profundidad hacia arriba): sin soportes.
import * as THREE from 'three';
import { union, difference, rect, circle, intersection, bbox, islandCount } from '../core/geometry2d.js';
import { extrudeRegion, part } from '../core/mesh.js';

const STAND = new THREE.Matrix4().makeRotationX(Math.PI / 2).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 4));

/** Extrusión de la punta de un brazo con el piso en rampa (techo de la ranura a ~49°, sin voladizo). */
function rampedTip(region, z0, z1, root, dir) {
  const g = extrudeRegion(region, z0, z1), pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (Math.abs(pos.getZ(i) - z0) > 1e-4) continue;
    const s = (pos.getX(i) - root.x) * dir.x + (pos.getY(i) - root.y) * dir.y;
    pos.setZ(i, Math.min(z1 - 1, z0 + Math.max(0, s) * 1.15));
  }
  return g;
}

export default {
  id: 'botellero-copas',
  name: 'Botellero rombo con copas',
  category: 'hogar',
  description: 'Celdas para botellas paradas en rombo (parado en una punta con 4 botellas, o en dos patas con 3) y, arriba, dos brazos en X con ranuras para colgar copas del pie. Caras acanaladas. Se imprime acostado, sin soportes.',
  tags: ['botellero', 'vino', 'copas', 'bar', 'cocina', 'rombo', 'regalo', 'decoración'],
  printTime: '10–16 h',
  defaults: { base: 'punta', bottle: 76, depth: 150, wall: 3.2, arms: true, arm: 40, stem: 9, ribs: true, color: '#4A4D52' },
  sections: [
    { title: 'Apoyo', items: [
      { key: 'base', type: 'cards', label: 'Cómo se apoya', options: [
        { value: 'punta', label: 'En una punta', hint: '4 botellas, parado sobre el pie de abajo' },
        { value: 'patas', label: 'En dos patas', hint: '3 botellas, sin la celda de abajo: apoya en las de los costados' },
      ] },
    ] },
    { title: 'Botellas', items: [
      { key: 'bottle', type: 'range', label: 'Diámetro de la botella', min: 60, max: 82, step: 1, unit: 'mm', help: 'Vino: 75–78 mm' },
      { key: 'depth', type: 'range', label: 'Profundidad', min: 90, max: 200, step: 1, unit: 'mm', help: 'Cuánto de la botella queda adentro. También define cuántas copas entran.' },
    ] },
    { title: 'Copas', items: [
      { key: 'arms', type: 'toggle', label: 'Brazos para colgar copas' },
      { key: 'arm', type: 'range', label: 'Largo de los brazos', min: 28, max: 50, step: 1, unit: 'mm', visibleIf: (p) => p.arms },
      { key: 'stem', type: 'range', label: 'Ancho de la ranura (tallo de la copa)', min: 6, max: 14, step: 0.5, unit: 'mm', visibleIf: (p) => p.arms },
    ] },
    { title: 'Forma', items: [
      { key: 'wall', type: 'range', label: 'Paredes', min: 2.4, max: 5, step: 0.1, unit: 'mm' },
      { key: 'ribs', type: 'toggle', label: 'Caras de arriba acanaladas' },
    ] },
    { title: 'Color', items: [{ key: 'color', type: 'color', label: 'Filamento' }] },
  ],
  orientations: [{ id: 'flat', label: 'Acostado, con el rombo sobre la cama' }],
  views: [{ id: 'standing', label: 'Parado', matrix: STAND }],
  useOrientation: 'standing',

  build(p) {
    const issues = [];
    const t = p.wall, c = p.bottle + 4, S = 2 * c + 3 * t, D = p.depth, E = p.arms ? p.arm : 0;
    // Marco con cruz (en la cama queda como un cuadrado; parado, como rombo con la punta (S,S) arriba)
    let frame = difference(rect(S / 2, S / 2, S, S), union(
      rect(t + c / 2, t + c / 2, c, c), rect(2 * t + 1.5 * c, t + c / 2, c, c),
      rect(t + c / 2, 2 * t + 1.5 * c, c, c), rect(2 * t + 1.5 * c, 2 * t + 1.5 * c, c, c)));
    const twoLegs = p.base === 'patas';
    if (twoLegs) {
      // Sin la celda de abajo: se sacan sus dos paredes de afuera y apoya en las puntas de las celdas
      // de los costados (las dos quedan a la misma altura). Las puntas se cortan planas.
      const k = c + t;
      frame = difference(frame, union(rect(k / 2 - 0.5, t / 2, k + 1, t + 2), rect(t / 2, k / 2 - 0.5, t + 2, k + 1)));
      frame = difference(frame, [[{ x: -1, y: -1 }, { x: k + 2.5, y: -1 }, { x: -1, y: k + 2.5 }]]);
    } else {
      // Pie: la punta de abajo se corta plana y se rellena un poco para que se pare firme
      const f = S * 0.12, foot = [[{ x: 0, y: f }, { x: f, y: 0 }, { x: f + 9, y: 0 }, { x: 0, y: f + 9 }]];
      frame = union(difference(frame, [[{ x: -1, y: -1 }, { x: f + 1, y: -1 }, { x: -1, y: f + 1 }]]), intersection(foot, rect(S / 2, S / 2, S, S)));
    }
    // Acanalado en las dos caras de arriba (bordes y = S y x = S), a lo largo de la profundidad
    if (p.ribs) {
      const bumps = [];
      for (let u = 6; u < S - 6; u += 4) bumps.push(circle(u, S, 1.1, 16), circle(S, u, 1.1, 16));
      frame = union(frame, ...bumps);
    }
    const vols = [extrudeRegion(frame, 0, D)];
    const glasses = [];
    if (p.arms) {
      const Ls = Math.max(12, E - 12), w = p.stem;
      const n = Math.max(1, Math.floor(D / 72));
      const zs = Array.from({ length: n }, (_, i) => (D * (i + 0.5)) / n);
      // Brazo A: la pared de arriba sigue hacia +x. Brazo B: la pared derecha sigue hacia +y.
      const arms = [
        { root: rect(S + (E - Ls) / 2, S - t / 2, E - Ls + 0.01, t), tip: rect(S + E - Ls / 2, S - t / 2, Ls, t), r0: { x: S + E - Ls, y: S - t / 2 }, dir: { x: 1, y: 0 }, down: { x: 0, y: -1 } },
        { root: rect(S - t / 2, S + (E - Ls) / 2, t, E - Ls + 0.01), tip: rect(S - t / 2, S + E - Ls / 2, t, Ls), r0: { x: S - t / 2, y: S + E - Ls }, dir: { x: 0, y: 1 }, down: { x: -1, y: 0 } },
      ];
      for (const a of arms) {
        vols.push(extrudeRegion(a.root, 0, D));
        let z = 0;
        for (const zc of zs) {
          vols.push(z === 0 ? extrudeRegion(a.tip, 0, zc - w / 2) : rampedTip(a.tip, z, zc - w / 2, a.r0, a.dir));
          z = zc + w / 2;
          glasses.push({ x: a.r0.x + a.dir.x * 3 + a.down.x * t / 2, y: a.r0.y + a.dir.y * 3 + a.down.y * t / 2, z: zc, dx: a.down.x, dy: a.down.y });
        }
        vols.push(rampedTip(a.tip, z, D, a.r0, a.dir));
        if (z + Ls * 1.15 > D - 1) issues.push({ level: 'info', msg: 'La última ranura queda cerca del borde: la rampa de arriba termina con un techito plano chico.' });
      }
      issues.push({ level: 'info', msg: `Entran ${zs.length * 2} copas colgadas del pie. Las ranuras se abren hacia la punta: el tallo entra por la punta y se desliza hasta el fondo.` });
    }
    const bottles = [];
    for (const [i, j] of (twoLegs ? [[1, 0], [0, 1], [1, 1]] : [[0, 0], [1, 0], [0, 1], [1, 1]])) {
      const rb = p.bottle / 2;
      bottles.push({ x: t + i * (c + t) + rb + 0.5, y: t + j * (c + t) + rb + 0.5, z: D / 2 });
    }
    if (islandCount(frame) > 1) issues.push({ level: 'error', msg: 'El marco quedó partido.' });
    const bb = bbox(frame);
    if (bb.maxX + E > 215 || bb.maxY + E > 215) issues.push({ level: 'warning', msg: `Ocupa ${Math.round(bb.maxX + E)} mm de lado en la cama: puede no entrar en una de 22 cm. Achicá los brazos o el diámetro de la botella.` });
    issues.push({ level: 'info', msg: 'Se imprime acostado, con la profundidad hacia arriba: todas las paredes salen verticales y muy resistentes.' });
    return { parts: [part('rack', 'Botellero', p.color, vols, { focus: true })], issues, bottles, glasses };
  },
};
