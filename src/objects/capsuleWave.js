// Porta cápsulas ola: un panel parado con bordes ondulados y columnas verticales donde la cápsula
// se cuelga del borde (queda detrás de una chapa con ranura) y se apila. Se carga por el círculo de
// arriba de cada columna. Parado sobre una base con ranura. Se arma con dos láminas que se pegan
// (frente y fondo) para imprimir sin soportes. Mismo sistema de guías que el porta cápsulas corazón.
import * as THREE from 'three';
import { union, difference, rect, roundedRect, circle } from '../core/geometry2d.js';
import { extrudeRegion, part } from '../core/mesh.js';

const TAB_W = 40, TAB_H = 24;   // lengüeta del panel que entra en la base
const POCKET_D = 2.6;           // espesor del borde de la cápsula
const BACK_T = 3;               // espesor de la lámina del fondo
const WEB = 3.5;                // pared entre columnas
const AMP = 5;                  // amplitud de la onda de los bordes

/** Medidas de la cápsula y reparto de las columnas. */
function plan(p) {
  const rim = p.rim, neck = Math.min(p.neck, rim - 3);
  const pocketW = rim + 1.5, slotW = neck + 1.6, pitch = rim + 0.8;
  const pitchX = pocketW + WEB, mar = p.wall + 1.5;
  const cols = Math.round(p.columns), rows = Math.round(p.rows);
  const xs = Array.from({ length: cols }, (_, i) => (i - (cols - 1) / 2) * pitchX);
  const y0 = TAB_H + 1;                                              // abajo de las columnas (sobre el bloque de la base)
  const list = xs.map((x, i) => ({ x, y0, n: p.stagger && cols > 1 && i === cols - 1 ? Math.max(2, rows - 4) : rows }));
  const top = y0 + rows * pitch;
  const W = cols * pitchX - WEB + 2 * mar + 4 * AMP;
  return { rim, neck, pocketW, slotW, pitch, W, list, cols, rows, mar, top, yb: TAB_H - 3 };
}

/** Contorno del panel: lados y borde de arriba ondulados. */
function waveBody(g) {
  const hw = g.W / 2 - AMP, H = g.top + g.mar + 6, ys = H - 4, lam = (ys - g.yb) / 1.5;
  const topAt = (x) => H + 4 * Math.sin((2 * Math.PI * x) / (g.W * 0.9) + 1.2);
  const pts = [], N = 60, M = 80;
  for (let i = 0; i <= N; i++) { const y = g.yb + ((ys - g.yb) * i) / N; pts.push({ x: hw + AMP * Math.sin((2 * Math.PI * (y - g.yb)) / lam), y }); }
  const xr = pts[pts.length - 1].x, xl = -hw - AMP * Math.sin((2 * Math.PI * (ys - g.yb)) / lam + 0.9);
  for (let i = 0; i <= M; i++) { const x = xr + ((xl - xr) * i) / M; pts.push({ x, y: topAt(x) }); }
  for (let i = N; i >= 0; i--) { const y = g.yb + ((ys - g.yb) * i) / N; pts.push({ x: -hw - AMP * Math.sin((2 * Math.PI * (y - g.yb)) / lam + 0.9), y }); }
  return [pts];
}

const move = (geoms, m) => { geoms.forEach((g) => g.applyMatrix4(m)); return geoms; };

export default {
  id: 'porta-capsulas-ola',
  name: 'Porta cápsulas ola',
  category: 'hogar',
  description: 'Panel de bordes ondulados para cápsulas de café tipo Nespresso: columnas de cápsulas apiladas que se cargan por el círculo de arriba. Se imprime en dos láminas que se pegan, sobre una base redondeada con ranura.',
  tags: ['cápsulas', 'café', 'nespresso', 'cocina', 'ola', 'organizador', 'cafetera', 'mesada'],
  printTime: '14–22 h',
  defaults: { test: false, columns: 3, rows: 6, stagger: false, rim: 37.5, neck: 31, wall: 2.4, fit: 0.3, colorPanel: '#222428', colorBase: '#222428' },
  sections: [
    { title: 'Capacidad', items: [
      { key: 'columns', type: 'stepper', label: 'Columnas', min: 2, max: 5, help: 'Cada columna mide unos 42 mm de ancho.' },
      { key: 'rows', type: 'stepper', label: 'Cápsulas por columna', min: 3, max: 10, help: 'Más cápsulas = panel más alto y más difícil de entrar en la cama de impresión.' },
      { key: 'stagger', type: 'toggle', label: 'Última columna más corta', help: 'Como en el diseño de referencia: la columna de la derecha tiene 4 cápsulas menos.' },
    ] },
    { title: 'Cápsula', items: [
      { key: 'rim', type: 'range', label: 'Diámetro del borde', min: 30, max: 45, step: 0.1, unit: 'mm', help: 'Nespresso Original: 37,5 mm' },
      { key: 'neck', type: 'range', label: 'Diámetro del cuerpo junto al borde', min: 24, max: 40, step: 0.1, unit: 'mm', help: 'Nespresso Original: 31 mm' },
    ] },
    { title: 'Prueba', items: [
      { key: 'test', type: 'toggle', label: 'Solo la pieza de prueba', help: 'Una columna con lugar para 2 cápsulas, para comprobar que calzan antes de imprimir el panel completo.' },
    ] },
    { title: 'Forma', items: [
      { key: 'wall', type: 'range', label: 'Chapa del frente', min: 1.6, max: 3.2, step: 0.1, unit: 'mm' },
      { key: 'fit', type: 'range', label: 'Holgura de la base', min: 0.1, max: 0.6, step: 0.05, unit: 'mm', help: 'Calce de la lengüeta del panel en la base.' },
    ] },
    { title: 'Colores', items: [
      { key: 'colorPanel', type: 'color', label: 'Panel' },
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
    const T = BACK_T + POCKET_D + p.wall;
    const mar = g.mar;
    let body, list = g.list;
    if (test) {
      const h = 2 * g.pitch + 2 * mar;
      body = roundedRect(0, h / 2, g.pocketW + 2 * mar, h, 8, 8);
      list = [{ x: 0, y0: mar, n: 2 }];
    } else {
      body = union(waveBody(g), rect(0, (TAB_H + 2) / 2, TAB_W, TAB_H + 2));
    }
    const pockets = [], openings = [], capsules = [];
    let total = 0;
    for (const c of list) {
      const y0 = c.y0, len = Math.max(c.n * g.pitch, g.pocketW + 0.01), yt = y0 + len;
      total += c.n;
      for (let k = 0; k < c.n; k++) capsules.push({ x: c.x, y: y0 + g.pocketW / 2 + k * g.pitch });
      pockets.push(roundedRect(c.x, (y0 + yt) / 2, g.pocketW, len, g.pocketW / 2 - 0.01, 14));
      const sBot = y0 + g.pocketW / 2 - g.slotW / 2, sTop = yt - g.pocketW / 2 + g.slotW / 2;
      openings.push(roundedRect(c.x, (sBot + sTop) / 2, g.slotW, sTop - sBot, g.slotW / 2 - 0.01, 14), circle(c.x, yt - g.pocketW / 2, g.pocketW / 2, 40));
    }
    const front = [
      extrudeRegion(difference(body, union(...openings)), 0, p.wall),
      extrudeRegion(difference(body, union(...pockets)), p.wall, p.wall + POCKET_D),
    ];
    const back = [extrudeRegion(body, 0, BACK_T)];

    const slotT = T + 2 * p.fit, slotL = TAB_W + 2 * p.fit, ds = TAB_H - 1;
    const blockW = TAB_W + 16, blockD = slotT + 14, footT = 4, blockH = ds + 5;
    const footW = Math.min(Math.max(g.W * 0.9, 110), 190), footD = 84;
    const baseGeoms = test ? [] : [
      extrudeRegion(roundedRect(0, 0, footW, footD, footD / 2 - 0.01, 24), 0, footT),
      extrudeRegion(roundedRect(0, 0, blockW, blockD, 4, 6), footT, footT + blockH - ds),
      extrudeRegion(difference(roundedRect(0, 0, blockW, blockD, 4, 6), rect(0, 0, slotL, slotT)), footT + blockH - ds, footT + blockH),
    ];

    const out = [];
    if (orientationId === 'standing') {
      const zBase = test ? 0 : footT + blockH - ds;
      const stackBack = back;
      const stackFront = move(front, new THREE.Matrix4().makeTranslation(0, 0, T).multiply(new THREE.Matrix4().makeRotationY(Math.PI)));
      const standM = new THREE.Matrix4().makeTranslation(0, T / 2, zBase).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      move(stackBack, standM); move(stackFront, standM);
      out.push(part('front', 'Panel (frente)', p.colorPanel, stackFront, { focus: true }), part('back', 'Panel (fondo)', p.colorPanel, stackBack), part('base', 'Base', p.colorBase, baseGeoms, { bridges: true }));
    } else {
      const off = (test ? g.pocketW / 2 + mar : g.W / 2) + 8, fh = footD / 2 + 12;
      const flip = new THREE.Matrix4().makeTranslation(off, 0, p.wall + POCKET_D).multiply(new THREE.Matrix4().makeRotationY(Math.PI));
      move(front, flip);
      move(back, new THREE.Matrix4().makeTranslation(-off, 0, 0));
      move(baseGeoms, new THREE.Matrix4().makeTranslation(0, -(fh + 6), 0));
      out.push(part('front', 'Panel (frente)', p.colorPanel, front, { focus: true }), part('back', 'Panel (fondo)', p.colorPanel, back), part('base', 'Base', p.colorBase, baseGeoms, { bridges: true }));
    }
    issues.push({ level: 'info', msg: test ? 'Pieza de prueba: una columna con lugar para 2 cápsulas. Si entran por el círculo de arriba y bajan sin trabarse, el panel completo va a funcionar.' : `Entran ${total} cápsulas. Se cargan por el círculo de arriba de cada columna y bajan hasta apoyarse. Mide ${g.W.toFixed(0)} mm de ancho.` });
    issues.push({ level: 'info', msg: 'Se imprime en dos láminas: el frente (con las ranuras) boca abajo, y el fondo liso. Se pegan con adhesivo instantáneo o epoxi, y la lengüeta de abajo entra en la base.' });
    return { parts: out.filter(Boolean), issues, capsules };
  },
};
