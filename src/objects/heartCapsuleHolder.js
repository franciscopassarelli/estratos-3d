// Porta cápsulas corazón: un panel con forma de corazón y columnas verticales donde la cápsula
// se cuelga del borde (queda detrás de una chapa con ranura) y se apila hacia arriba. Se carga
// por el círculo de arriba de cada columna. Parado sobre una base con ranura.
// Se arma con dos láminas que se pegan (frente y fondo) para imprimir sin soportes.
import * as THREE from 'three';
import { union, difference, intersection, rect, roundedRect, circle } from '../core/geometry2d.js';
import { extrudeRegion, part } from '../core/mesh.js';

const TAB_W = 40, TAB_H = 24;   // lengüeta del corazón que entra en la base
const POCKET_D = 2.6;           // espesor del borde de la cápsula (igual que la torre)
const BACK_T = 3;               // espesor de la lámina del fondo
const WEB = 3.5;                // pared entre columnas

/** Contorno de un corazón de ancho W con la punta en y = 0: dos lóbulos redondos y dos lados rectos tangentes hasta la punta. */
function heartRing(W) {
  const r = W / 3.7, a = 0.85 * r, d = 2.3 * r;          // radio de los lóbulos, separación del centro y altura de los centros
  const lobes = (sx) => circle(sx * a, d, r, 120);
  // Punto de tangencia (lado de afuera) desde la punta (0, 0) hasta el círculo del lóbulo
  const D = Math.hypot(a, d), phi = Math.atan2(-d, -a), alpha = Math.acos(r / D);
  const tang = [phi + alpha, phi - alpha].map((t) => ({ x: a + r * Math.cos(t), y: d + r * Math.sin(t) })).sort((u, v) => v.x - u.x)[0];
  const tri = [[{ x: 0, y: 0 }, { x: tang.x, y: tang.y }, { x: a, y: d }, { x: -a, y: d }, { x: -tang.x, y: tang.y }]];
  return union(lobes(1), lobes(-1), tri)[0];
}

/** [abajo, arriba] del corazón en la vertical x (el corazón es convexo hacia arriba y abajo). */
function span(ring, x) {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    if ((a.x - x) * (b.x - x) > 0 || a.x === b.x) continue;
    const y = a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y);
    lo = Math.min(lo, y); hi = Math.max(hi, y);
  }
  return [lo, hi];
}

/** Medidas de la cápsula y reparto de las columnas dentro del corazón. */
function plan(p) {
  const rim = p.rim, neck = Math.min(p.neck, rim - 3);
  const pocketW = rim + 1.5, slotW = neck + 1.6, pitch = rim + 0.8;
  const pitchX = pocketW + WEB, mar = p.wall + 1.5;
  const cols = Math.round(p.columns);
  const xs = Array.from({ length: cols }, (_, i) => (i - (cols - 1) / 2) * pitchX);
  let W = Math.max(cols * pitchX + 2 * mar, 120), ring, list;
  for (;; W += 2) {
    ring = heartRing(W);
    list = xs.map((x) => {
      let lo = -Infinity, hi = Infinity;
      for (let k = 0; k <= 8; k++) {
        const [a, b] = span(ring, x - pocketW / 2 - mar + ((pocketW + 2 * mar) * k) / 8);
        lo = Math.max(lo, a); hi = Math.min(hi, b);
      }
      const n = Math.floor((hi - lo) / pitch);
      return { x, y0: lo, n };
    });
    if (Math.min(...list.map((c) => c.n)) >= 2 || W > 420) break;
  }
  return { rim, neck, pocketW, slotW, pitch, ring, W, list, cols };
}

/** Un solo color por pieza; aplica una transformación a un grupo de geometrías. */
const move = (geoms, m) => { geoms.forEach((g) => g.applyMatrix4(m)); return geoms; };

export default {
  id: 'porta-capsulas-corazon',
  name: 'Porta cápsulas corazón',
  category: 'hogar',
  description: 'Panel con forma de corazón para cápsulas de café tipo Nespresso: cada columna guarda las cápsulas apiladas y se cargan por el círculo de arriba. Se imprime en dos láminas que se pegan, sobre una base con ranura.',
  tags: ['cápsulas', 'café', 'nespresso', 'cocina', 'corazón', 'regalo', 'organizador', 'cafetera'],
  printTime: '12–20 h',
  defaults: { test: false, columns: 5, rim: 37.5, neck: 31, wall: 2.4, fit: 0.3, colorHeart: '#1E1E20', colorBase: '#1E1E20' },
  sections: [
    { title: 'Capacidad', items: [
      { key: 'columns', type: 'stepper', label: 'Columnas', min: 3, max: 6, help: 'Más columnas = corazón más grande. Con 4 entra en camas de 220 mm; con 5 hace falta una de 250 mm o más.' },
    ] },
    { title: 'Cápsula', items: [
      { key: 'rim', type: 'range', label: 'Diámetro del borde', min: 30, max: 45, step: 0.1, unit: 'mm', help: 'Nespresso Original: 37,5 mm' },
      { key: 'neck', type: 'range', label: 'Diámetro del cuerpo junto al borde', min: 24, max: 40, step: 0.1, unit: 'mm', help: 'Nespresso Original: 31 mm' },
    ] },
    { title: 'Prueba', items: [
      { key: 'test', type: 'toggle', label: 'Solo la pieza de prueba', help: 'Una columna con lugar para 2 cápsulas, para comprobar que calzan antes de imprimir el corazón completo.' },
    ] },
    { title: 'Forma', items: [
      { key: 'wall', type: 'range', label: 'Chapa del frente', min: 1.6, max: 3.2, step: 0.1, unit: 'mm' },
      { key: 'fit', type: 'range', label: 'Holgura de la base', min: 0.1, max: 0.6, step: 0.05, unit: 'mm', help: 'Calce de la lengüeta del corazón en la base.' },
    ] },
    { title: 'Colores', items: [
      { key: 'colorHeart', type: 'color', label: 'Corazón' },
      { key: 'colorBase', type: 'color', label: 'Base' },
    ] },
  ],
  orientations: [{ id: 'print', label: 'Las piezas separadas sobre la cama' }],
  views: [{ id: 'standing', label: 'Parado' }],
  useOrientation: 'standing',

  build(p, orientationId = 'print') {
    const issues = [];
    if (p.neck > p.rim - 3) issues.push({ level: 'warning', msg: 'El cuerpo de la cápsula tiene que ser al menos 3 mm más angosto que el borde: si no, se sale de la ranura.' });
    const g = plan(p);
    const test = !!p.test;
    const T = BACK_T + POCKET_D + p.wall;                       // espesor total del corazón
    const mar = p.wall + 1.5;
    let body, lift = 0, list = g.list;
    if (test) {
      // Pieza de prueba: una columna corta con la misma chapa, bolsillo y ranura que el corazón.
      const h = 2 * g.pitch + 2 * mar;
      body = roundedRect(0, h / 2, g.pocketW + 2 * mar, h, 8, 8);
      list = [{ x: 0, y0: mar, n: 2 }];
    } else {
      // Contorno final: el corazón cortado a la altura donde mide como la lengüeta, más la lengüeta recta abajo.
      const [neckLo] = span(g.ring, TAB_W / 2);
      lift = TAB_H - neckLo;                                    // el cuello (ancho = lengüeta) queda en y = TAB_H
      const shifted = [g.ring.map((q) => ({ x: q.x, y: q.y + lift }))];
      body = union(intersection(shifted, rect(0, TAB_H - 3 + 500, 2000, 1000)), rect(0, (TAB_H + 2) / 2, TAB_W, TAB_H + 2));
    }

    // Columnas: bolsillo (borde de la cápsula) detrás de una ranura (cuerpo) y el círculo de carga arriba.
    const pockets = [], openings = [];
    let total = 0;
    const capsules = [];
    for (const c of list) {
      const y0 = c.y0 + lift, len = Math.max(c.n * g.pitch, g.pocketW + 0.01), yt = y0 + len;
      total += c.n;
      for (let k = 0; k < c.n; k++) capsules.push({ x: c.x, y: y0 + g.pocketW / 2 + k * g.pitch });
      pockets.push(roundedRect(c.x, (y0 + yt) / 2, g.pocketW, len, g.pocketW / 2 - 0.01, 14));
      const sBot = y0 + g.pocketW / 2 - g.slotW / 2, sTop = yt - g.pocketW / 2 + g.slotW / 2;
      openings.push(roundedRect(c.x, (sBot + sTop) / 2, g.slotW, sTop - sBot, g.slotW / 2 - 0.01, 14), circle(c.x, yt - g.pocketW / 2, g.pocketW / 2, 40));
    }
    // El frente se arma con la chapa de las ranuras y las paredes entre columnas. Está pensado para imprimirse
    // boca abajo (la chapa contra la cama); armado, la chapa queda afuera y las paredes pegadas al fondo.
    const front = [
      extrudeRegion(difference(body, union(...openings)), 0, p.wall),                      // chapa con ranuras
      extrudeRegion(difference(body, union(...pockets)), p.wall, p.wall + POCKET_D),        // paredes entre columnas
    ];
    const back = [extrudeRegion(body, 0, BACK_T)];

    // Base: pie plano + bloque con ranura donde entra la lengüeta.
    const slotT = T + 2 * p.fit, slotL = TAB_W + 2 * p.fit, ds = TAB_H - 1;
    const blockW = TAB_W + 16, blockD = slotT + 14, footT = 4, blockH = ds + 5;
    const footW = Math.min(Math.max(g.W * 0.55, 90), 150), footD = 90;
    const baseGeoms = test ? [] : [
      extrudeRegion(roundedRect(0, 0, footW, footD, 8, 8), 0, footT),
      extrudeRegion(roundedRect(0, 0, blockW, blockD, 4, 6), footT, footT + blockH - ds),
      extrudeRegion(difference(roundedRect(0, 0, blockW, blockD, 4, 6), rect(0, 0, slotL, slotT)), footT + blockH - ds, footT + blockH),
    ];

    const out = [];
    if (orientationId === 'standing') {
      // Corazón parado: fondo atrás, frente hacia adelante (−y), lengüeta dentro de la ranura de la base.
      const zBase = test ? 0 : footT + blockH - ds;                         // fondo de la ranura
      // Frente de cara al público (chapa con ranuras en z=0, la cara de afuera) y el fondo pegado detrás.
      // La cámara mira desde −y: la chapa va en z = T (afuera) y el fondo en z = 0..BACK_T.
      const stackBack = back;
      const stackFront = move(front, new THREE.Matrix4().makeTranslation(0, 0, T).multiply(new THREE.Matrix4().makeRotationY(Math.PI)));
      // Se levanta: z pasa a ser −y, y pasa a ser z.
      const standM = new THREE.Matrix4().makeTranslation(0, T / 2, zBase).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      move(stackBack, standM); move(stackFront, standM);
      out.push(part('front', 'Corazón (frente)', p.colorHeart, stackFront, { focus: true }), part('back', 'Corazón (fondo)', p.colorHeart, stackBack), part('base', 'Base', p.colorBase, baseGeoms, { bridges: true }));
    } else {
      // Sobre la cama: el frente boca abajo (cara de afuera contra la cama), el fondo al lado y la base adelante.
      const off = (test ? g.pocketW / 2 + mar : g.W / 2) + 8, fh = footD / 2 + 12;
      const flip = new THREE.Matrix4().makeTranslation(off, 0, p.wall + POCKET_D).multiply(new THREE.Matrix4().makeRotationY(Math.PI));
      move(front, flip);
      move(back, new THREE.Matrix4().makeTranslation(-off, 0, 0));
      move(baseGeoms, new THREE.Matrix4().makeTranslation(0, -(fh + 6), 0));
      out.push(part('front', 'Corazón (frente)', p.colorHeart, front, { focus: true }), part('back', 'Corazón (fondo)', p.colorHeart, back), part('base', 'Base', p.colorBase, baseGeoms, { bridges: true }));
    }
    issues.push({ level: 'info', msg: test ? 'Pieza de prueba: una columna con lugar para 2 cápsulas. Si entran por el círculo de arriba y bajan sin trabarse, el corazón completo va a funcionar. Apagá "Solo la pieza de prueba" para ver el corazón.' : `Entran ${total} cápsulas. Se cargan por el círculo de arriba de cada columna y bajan hasta apoyarse. Mide ${g.W.toFixed(0)} mm de ancho.` });
    issues.push({ level: 'info', msg: 'Se imprime en dos láminas: el frente (con las ranuras) boca abajo, y el fondo liso. Se pegan con adhesivo instantáneo o epoxi, y la lengüeta de abajo entra en la base.' });
    return { parts: out.filter(Boolean), issues, capsules };
  },
};
