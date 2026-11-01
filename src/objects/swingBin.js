// Tachito de escritorio con tapa basculante, en tres piezas:
// cuerpo con textura de facetas (tipo panal), aro de otro color y tapa que gira sobre dos pernos.
// La tapa se encastra a presión en las orejas del aro (ranura un poco más angosta que el perno).
import * as THREE from 'three';
import { difference, union, offset, circle, rect, bbox } from '../core/geometry2d.js';
import { extrudeRegion, part, geometryFromMesh } from '../core/mesh.js';

const TAU = Math.PI * 2;

/** Cuadrado de esquinas redondeadas (superelipse) de semilado a. */
function squircleR(th, a, n = 6) {
  return a * Math.pow(Math.abs(Math.cos(th)) ** n + Math.abs(Math.sin(th)) ** n, -1 / n);
}
function squircle(a, seg = 160) {
  const pts = [];
  for (let k = 0; k < seg; k++) { const th = (k / seg) * TAU, r = squircleR(th, a); pts.push({ x: Math.cos(th) * r, y: Math.sin(th) * r }); }
  return [pts];
}

/** Profundidad (0..1) de la faceta en el punto (u, v) de la pared: pirámides hexagonales hundidas. */
function facet(u, v, cell) {
  const h = cell * Math.sqrt(3) / 2;
  const row = Math.round(v / h);
  let best = Infinity;
  for (const r of [row - 1, row, row + 1]) {
    const off = r % 2 ? cell / 2 : 0, c = Math.round((u - off) / cell);
    for (const cc of [c - 1, c, c + 1]) {
      const dx = u - (cc * cell + off), dy = v - r * h;
      // distancia hexagonal (norma de hexágono con punta arriba)
      const ax = Math.abs(dx), ay = Math.abs(dy);
      const d = Math.max(ax, ax * 0.5 + ay * Math.sqrt(3) / 2);
      if (d < best) best = d;
    }
  }
  return Math.max(0, 1 - best / (cell / 2));
}

/** Cuerpo hueco: pared exterior con facetas hundidas, interior liso y piso. */
function bodyMesh(p) {
  const A = p.width / 2, H = p.height, w = p.wall, F = p.floor, D = p.texture ? p.depth : 0;
  const per = 4 * 2 * A * 0.95; // perímetro aproximado
  const Nt = Math.max(160, Math.round(per / 1.4)), L = p.texture ? Math.max(40, Math.round(H / 1.4)) : 2;
  const band = 6; // franjas lisas arriba y abajo
  const V = [], T = [], outer = [];
  for (let l = 0; l <= L; l++) {
    const z = (H * l) / L;
    const fade = Math.min(1, Math.max(0, (z - band) / 4), Math.max(0, (H - band - z) / 4));
    outer.push(V.length);
    for (let k = 0; k < Nt; k++) {
      const th = (k / Nt) * TAU, r0 = squircleR(th, A);
      const r = r0 - (D && fade ? D * fade * facet(th * A, z, p.cell) : 0);
      V.push([Math.cos(th) * r, Math.sin(th) * r, z]);
    }
  }
  const inner = [];
  for (const z of [F, H]) {
    inner.push(V.length);
    for (let k = 0; k < Nt; k++) { const th = (k / Nt) * TAU, r = squircleR(th, A - w - D); V.push([Math.cos(th) * r, Math.sin(th) * r, z]); }
  }
  const nx = (k) => (k + 1) % Nt;
  for (let l = 0; l < L; l++) for (let k = 0; k < Nt; k++) {
    const a = outer[l] + k, b = outer[l] + nx(k), c = outer[l + 1] + nx(k), d = outer[l + 1] + k;
    T.push(a, b, c, a, c, d);
  }
  for (let k = 0; k < Nt; k++) {
    const e = inner[0] + k, f = inner[0] + nx(k), g = inner[1] + nx(k), h = inner[1] + k;
    T.push(e, g, f, e, h, g); // pared interior
    const o0 = outer[L] + k, o1 = outer[L] + nx(k);
    T.push(o0, o1, g, o0, g, h); // borde de arriba
  }
  const c0 = V.push([0, 0, 0]) - 1, cf = V.push([0, 0, F]) - 1;
  for (let k = 0; k < Nt; k++) { T.push(c0, outer[0] + nx(k), outer[0] + k); T.push(cf, inner[0] + k, inner[0] + nx(k)); }
  return geometryFromMesh(V, T);
}

/** Pieza extruida a lo largo de X a partir de un perfil en el plano (y, z). */
function alongX(region, x0, x1) {
  const g = extrudeRegion(region, x0, x1);
  if (!g) return null;
  // (x, y, z) del perfil -> (z, x, y): el perfil queda en el plano YZ y la extrusión sobre X
  g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  return g;
}

export default {
  id: 'tachito-tapa',
  name: 'Tachito con tapa basculante',
  category: 'organizacion',
  description: 'Tachito de escritorio con textura de facetas, aro de color y tapa que gira para tirar papelitos. Se imprime en tres piezas y la tapa se encastra a presión.',
  tags: ['tacho', 'basura', 'papelera', 'escritorio', 'oficina', 'tapa', 'panal', 'baño'],
  printTime: '6–10 h',
  defaults: { width: 100, height: 140, wall: 2, floor: 2, texture: true, depth: 2.4, cell: 16, rimHeight: 20, colorBody: '#F1F1EC', colorRim: '#E8742A' },
  sections: [
    { title: 'Forma', items: [
      { key: 'width', type: 'range', label: 'Ancho', min: 80, max: 190, step: 1, unit: 'mm' },
      { key: 'height', type: 'range', label: 'Alto del cuerpo', min: 80, max: 220, step: 1, unit: 'mm' },
      { key: 'rimHeight', type: 'range', label: 'Alto del aro', min: 14, max: 30, step: 1, unit: 'mm' },
    ] },
    { title: 'Textura', items: [
      { key: 'texture', type: 'toggle', label: 'Facetas tipo panal' },
      { key: 'depth', type: 'range', label: 'Profundidad', min: 1, max: 4, step: 0.1, unit: 'mm', visibleIf: (p) => p.texture },
      { key: 'cell', type: 'range', label: 'Tamaño de cada faceta', min: 10, max: 30, step: 1, unit: 'mm', visibleIf: (p) => p.texture },
    ] },
    { title: 'Medidas', items: [
      { key: 'wall', type: 'range', label: 'Pared', min: 1.4, max: 3.2, step: 0.1, unit: 'mm' },
      { key: 'floor', type: 'range', label: 'Piso', min: 1.2, max: 4, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Colores', items: [
      { key: 'colorBody', type: 'color', label: 'Cuerpo' },
      { key: 'colorRim', type: 'color', label: 'Aro y tapa' },
    ] },
  ],
  orientations: [{ id: 'print', label: 'Las tres piezas sobre la cama' }],
  views: [{ id: 'assembled', label: 'Armado' }],
  useOrientation: 'assembled',

  build(p, orientationId = 'print') {
    const issues = [];
    const A = p.width / 2, H = p.height, w = p.wall, D = p.texture ? p.depth : 0, Hr = p.rimHeight;
    const assembled = orientationId === 'assembled';

    // ----- Cuerpo
    const body = bodyMesh(p);

    // ----- Aro: anillo que se apoya en el cuerpo + pollera interior que encastra + dos orejas para la tapa
    const innerBody = A - w - D;           // semilado interior del cuerpo
    const open = innerBody - 2.6;           // semilado de la abertura del aro
    const ring = difference(squircle(A + 0.8), squircle(open));
    const skirt = difference(squircle(innerBody - 0.35), squircle(open));
    const tabT = 3, pin = 3.2, hole = 3.5, slot = 2.7, Tl = 3.2;
    const pinZ = Hr - 1 - Tl / 2;           // eje de giro, medido desde la base del aro
    // Perfil de la oreja en (y, z): bloque con agujero para el perno y ranura horizontal para encastrarlo
    const tabProfile = difference(rect(0, Hr / 2, 13, Hr), union(circle(0, pinZ, hole / 2, 40), rect(-4, pinZ, 8, slot)));
    const tabIn = open - tabT;              // cara interior de la oreja
    const rimVols = [
      extrudeRegion(ring, 0, Hr),
      extrudeRegion(skirt, -8, 0),
      alongX(tabProfile, tabIn, open + 0.6),
      alongX(tabProfile, -open - 0.6, -tabIn),
    ];

    // ----- Tapa: placa que gira sobre dos pernos, más angosta que la separación entre orejas
    const clr = 0.7;
    const lidHalfX = tabIn - clr, lidHalfY = open - 1.6;
    const plate = (() => {
      const pts = [];
      for (let k = 0; k < 160; k++) { const th = (k / 160) * TAU, c = Math.cos(th), s = Math.sin(th); const r = Math.pow(Math.abs(c / lidHalfX) ** 6 + Math.abs(s / lidHalfY) ** 6, -1 / 6); pts.push({ x: c * r, y: s * r }); }
      return [pts];
    })();
    // Agarre: tres rayitas en relieve del lado de adelante
    const grip = union(...[0, 1, 2].map((i) => rect(0, -lidHalfY + 10 + i * 3.2, 14, 1.4)));
    const lidVols = [extrudeRegion(plate, 0, Tl), extrudeRegion(grip, Tl, Tl + 0.6)];
    for (const sgn of [1, -1]) {
      const x0 = sgn > 0 ? lidHalfX - 1 : -(lidHalfX + clr + tabT + 0.2), x1 = sgn > 0 ? lidHalfX + clr + tabT + 0.2 : -(lidHalfX - 1);
      lidVols.push(alongX(circle(0, Tl / 2, pin / 2, 32), x0, x1));
    }

    const off = (g, x, y, z) => { if (g) g.translate(x, y, z); return g; };
    if (assembled) {
      rimVols.forEach((g) => off(g, 0, 0, H));
      const zl = H + pinZ - Tl / 2;
      lidVols.forEach((g) => off(g, 0, 0, zl));
    } else {
      // Aro dado vuelta (la cara de arriba sobre la cama) y la tapa al lado
      const flip = new THREE.Matrix4().makeRotationX(Math.PI);
      const gap = 12;
      rimVols.forEach((g) => { g.applyMatrix4(flip); off(g, 2 * A + gap, 0, Hr); });
      lidVols.forEach((g) => off(g, A + gap / 2 + lidHalfX * 0.0, -(2 * A + gap) , 0));
    }
    const span = assembled ? 0 : 4 * A + 14;
    if (span > 220) issues.push({ level: 'info', msg: 'Las tres piezas no entran juntas en una cama de 22 cm: imprimilas por separado.' });
    if (2 * A > 200 || H > 240) issues.push({ level: 'warning', msg: 'El cuerpo es muy grande para una cama de 22 cm.' });
    issues.push({ level: 'info', msg: 'Armado: apoyá el aro sobre el cuerpo y encastrá la tapa empujando los pernos por la ranura de las orejas. Si queda floja, imprimila a 101 % o con un poco más de flujo.' });
    issues.push({ level: 'info', msg: 'Las facetas se hunden hacia adentro con pendientes suaves: el cuerpo se imprime sin soportes.' });

    return {
      parts: [
        part('body', 'Cuerpo', p.colorBody, body, { focus: true, flat: !!p.texture }),
        part('rim', 'Aro', p.colorRim, rimVols.filter(Boolean), { bridges: true }),
        part('lid', 'Tapa', p.colorRim, lidVols.filter(Boolean), { protrusion: 2 }),
      ],
      issues,
    };
  },
};
