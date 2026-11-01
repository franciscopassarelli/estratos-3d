// Lámpara LED de dos piezas: una base con lugar para una luz LED a pilas y salida de cable,
// y una pantalla hueca que se apoya encastrada en la base. La pantalla tiene tres estilos.
import * as THREE from 'three';
import { difference, union, circle, rect, offset } from '../core/geometry2d.js';
import { extrudeRegion, part, geometryFromMesh } from '../core/mesh.js';

const TAU = Math.PI * 2;

/** Radio de la pantalla en el ángulo th y altura relativa t (0 abajo, 1 arriba). */
function shadeRadius(p, th, t) {
  const R = p.diameter / 2;
  if (p.style === 'ondas') {
    // Almohadones apilados con sección de cuadrado redondeado (superelipse)
    const n = 4.5, c = Math.abs(Math.cos(th)) ** n + Math.abs(Math.sin(th)) ** n;
    const squircle = Math.pow(c, -1 / n);
    const tiers = Math.round(p.tiers), f = (t * tiers) % 1;
    return R * (0.86 * squircle) * (1 + (p.depth / 100) * (Math.sin(Math.PI * f) - 0.5));
  }
  if (p.style === 'acanalada') return R + (p.depth / 100) * 6 * Math.cos(Math.round(p.ribs) * th);
  if (p.style === 'texturada') {
    // Bultos en grilla (alternados por fila) + estrías verticales finas por encima
    const k = Math.round(p.lobes), rows = Math.round(p.tiers);
    const bump = Math.cos(k * th) * Math.cos(TAU * rows * t);
    const fade = Math.min(1, t * 12, (1 - t) * 12);
    return R + fade * ((p.depth / 100) * 10 * bump) + (p.depth / 100) * 1.6 * Math.cos(Math.round(p.ribs) * th);
  }
  if (p.style === 'espiral') {
    // Globo: más angosto abajo y en la boca, panza a 45 % del alto; estrías que giran media vuelta
    const prof = 0.74 + 0.26 * Math.sin(Math.PI * Math.min(1, t / 0.9)) - 0.12 * Math.max(0, t - 0.6) / 0.4;
    return R * prof + (p.depth / 100) * 5 * Math.cos(Math.round(p.ribs) * th + TAU * 0.5 * t);
  }
  // ondulada: ondas que giran hacia arriba
  const turns = 0.6;
  return R + (p.depth / 100) * 30 * Math.cos(Math.round(p.lobes) * th + TAU * turns * t) * (0.6 + 0.4 * Math.sin(Math.PI * t));
}

/** Pantalla hueca: superficie exterior e interior (corrida el grosor de la pared), abierta arriba y abajo. */
function shadeMesh(p, z0) {
  const H = p.height, w = p.wall;
  const st = p.style;
  const Nt = st === 'acanalada' ? Math.round(p.ribs) * 8 : st === 'ondulada' ? Math.round(p.lobes) * 24
    : st === 'texturada' ? Math.round(p.ribs) * 6 : st === 'espiral' ? Math.round(p.ribs) * 8 : 160;
  const L = st === 'ondas' ? Math.round(p.tiers) * 24 : st === 'ondulada' ? 60 : st === 'texturada' ? Math.round(p.tiers) * 22 : st === 'espiral' ? 80 : 2;
  const V = [], T = [], outer = [], inner = [];
  for (let l = 0; l <= L; l++) {
    const t = l / L, z = z0 + H * t;
    outer.push(V.length);
    for (let k = 0; k < Nt; k++) { const th = (k / Nt) * TAU, r = shadeRadius(p, th, t); V.push([Math.cos(th) * r, Math.sin(th) * r, z]); }
    inner.push(V.length);
    for (let k = 0; k < Nt; k++) { const th = (k / Nt) * TAU, r = shadeRadius(p, th, t) - w; V.push([Math.cos(th) * r, Math.sin(th) * r, z]); }
  }
  const nx = (k) => (k + 1) % Nt;
  for (let l = 0; l < L; l++) for (let k = 0; k < Nt; k++) {
    const a = outer[l] + k, b = outer[l] + nx(k), c = outer[l + 1] + nx(k), d = outer[l + 1] + k;
    T.push(a, b, c, a, c, d);
    const e = inner[l] + k, f = inner[l] + nx(k), g = inner[l + 1] + nx(k), h = inner[l + 1] + k;
    T.push(e, g, f, e, h, g);
  }
  for (let k = 0; k < Nt; k++) {
    // borde de abajo (mira hacia abajo) y de arriba (mira hacia arriba)
    const o0 = outer[0] + k, o1 = outer[0] + nx(k), i0 = inner[0] + k, i1 = inner[0] + nx(k);
    T.push(o0, i1, o1, o0, i0, i1);
    const O0 = outer[L] + k, O1 = outer[L] + nx(k), I0 = inner[L] + k, I1 = inner[L] + nx(k);
    T.push(O0, O1, I1, O0, I1, I0);
  }
  return geometryFromMesh(V, T);
}

/** Radio interior mínimo en la boca de abajo (para el encastre de la base). */
function innerBottom(p) {
  let m = Infinity;
  for (let k = 0; k < 360; k++) m = Math.min(m, shadeRadius(p, (k / 360) * TAU, 0) - p.wall);
  return m;
}
function outerBottom(p) {
  let m = 0;
  for (let k = 0; k < 360; k++) m = Math.max(m, shadeRadius(p, (k / 360) * TAU, 0));
  return m;
}

export default {
  id: 'lampara-led',
  name: 'Lámpara LED de dos piezas',
  category: 'hogar',
  description: 'Base con lugar para una luz LED a pilas o de cable, y una pantalla hueca con ondas apiladas, acanalada o ondulada. Se imprime en dos piezas y se encastra.',
  tags: ['lámpara', 'velador', 'led', 'luz', 'decoración', 'pantalla', 'modo vaso', 'regalo'],
  printTime: '4–8 h',
  defaults: {
    style: 'ondas', diameter: 120, height: 150, tiers: 3, ribs: 48, lobes: 6, depth: 22, wall: 1.2,
    baseHeight: 40, led: 42, cable: true, colorBase: '#8FD3B6', colorShade: '#F1F1EC',
  },
  sections: [
    { title: 'Pantalla', items: [
      { key: 'style', type: 'cards', label: 'Estilo', options: [
        { value: 'ondas', label: 'Ondas apiladas', hint: 'Almohadones de luz' },
        { value: 'acanalada', label: 'Acanalada', hint: 'Estrías verticales finas' },
        { value: 'ondulada', label: 'Ondulada', hint: 'Ondas que giran' },
        { value: 'texturada', label: 'Texturada', hint: 'Bultos en grilla y estrías finas' },
        { value: 'espiral', label: 'Globo espiral', hint: 'Forma de globo con estrías que giran' },
      ] },
      { key: 'tiers', type: 'stepper', min: 2, max: 6, visibleIf: (p) => p.style === 'ondas' || p.style === 'texturada', label: (p) => (p.style === 'texturada' ? 'Filas de bultos' : 'Pisos') },
      { key: 'ribs', type: 'stepper', label: 'Estrías', min: 20, max: 120, visibleIf: (p) => ['acanalada', 'texturada', 'espiral'].includes(p.style) },
      { key: 'lobes', type: 'stepper', label: (p) => (p.style === 'texturada' ? 'Bultos por vuelta' : 'Ondas'), min: 3, max: 12, visibleIf: (p) => p.style === 'ondulada' || p.style === 'texturada' },
      { key: 'depth', type: 'range', label: 'Profundidad del relieve', min: 5, max: 100, step: 1, unit: '%' },
    ] },
    { title: 'Medidas', items: [
      { key: 'diameter', type: 'range', label: 'Ancho de la pantalla', min: 70, max: 180, step: 1, unit: 'mm' },
      { key: 'height', type: 'range', label: 'Alto de la pantalla', min: 70, max: 220, step: 1, unit: 'mm' },
      { key: 'wall', type: 'range', label: 'Pared de la pantalla', min: 0.8, max: 2.4, step: 0.1, unit: 'mm', help: 'Más fina = deja pasar más luz' },
      { key: 'baseHeight', type: 'range', label: 'Alto de la base', min: 20, max: 80, step: 1, unit: 'mm' },
    ] },
    { title: 'Luz', items: [
      { key: 'led', type: 'range', label: 'Hueco para la luz LED', min: 30, max: 70, step: 1, unit: 'mm', help: 'Diámetro de tu luz LED (las «puck» a pilas suelen medir 40–45 mm)' },
      { key: 'cable', type: 'toggle', label: 'Salida para cable por abajo' },
    ] },
    { title: 'Colores', items: [
      { key: 'colorShade', type: 'color', label: 'Pantalla', help: 'Blanco o natural dejan pasar mejor la luz.' },
      { key: 'colorBase', type: 'color', label: 'Base' },
    ] },
  ],
  orientations: [{ id: 'print', label: 'Las dos piezas, paradas sobre la cama' }],
  views: [{ id: 'assembled', label: 'Armada' }],
  useOrientation: 'assembled',

  build(p, orientationId = 'print') {
    const issues = [];
    const Rin = innerBottom(p), Rout = outerBottom(p), hb = p.baseHeight;
    const clr = 0.4, lipH = 6, lipW = 2.4;
    const ledR = p.led / 2;
    if (ledR + 2 > Rin - lipW - clr) return { parts: [], issues: [{ level: 'error', msg: 'La luz LED no entra adentro de la pantalla. Agrandá la pantalla o achicá el hueco de la luz.' }] };

    // ----- Base: cilindro + aro de encastre arriba, hueco para la luz y canal de cable
    const Rb = Rout + 3;
    const body = circle(0, 0, Rb, 128);
    const ledHole = circle(0, 0, ledR, 96);
    const depth = Math.min(14, hb - 6);
    const vols = [];
    if (p.cable) {
      const slot = rect(Rb / 2, 0, Rb + 2, 9); // canal desde el centro hasta el borde, por abajo
      vols.push(extrudeRegion(difference(body, union(slot, circle(0, 0, 4.5, 32))), 0, 6));
      vols.push(extrudeRegion(difference(body, circle(0, 0, 4.5, 32)), 6, hb - depth));
    } else vols.push(extrudeRegion(body, 0, hb - depth));
    vols.push(extrudeRegion(difference(body, ledHole), hb - depth, hb));
    const lip = difference(circle(0, 0, Rin - clr, 128), circle(0, 0, Rin - clr - lipW, 128));
    vols.push(extrudeRegion(lip, hb, hb + lipH));

    // ----- Pantalla: armada se apoya sobre la base; para imprimir va al lado
    const assembled = orientationId === 'assembled';
    const shade = shadeMesh(p, assembled ? hb : 0);
    // En diagonal ocupan menos lugar en la cama
    const off = (Rb + Rout + 8) / Math.SQRT2;
    if (!assembled) shade.translate(off, off, 0);

    // Pendiente de los almohadones (voladizo) en el estilo ondas
    if (p.style === 'ondas') {
      const A = (p.diameter / 2) * (p.depth / 100), h = p.height / Math.round(p.tiers);
      const slope = (Math.atan2(h, A * Math.PI) * 180) / Math.PI;
      if (slope < 45) issues.push({ level: 'warning', msg: `Los almohadones quedan muy salidos (${slope.toFixed(0)}° de pendiente): bajá la profundidad o usá más altura por piso para imprimir sin soportes.` });
    }
    if (p.wall < 1) issues.push({ level: 'info', msg: 'Pared muy fina: deja pasar mucha luz, pero es frágil. Imprimila despacio.' });
    issues.push({ level: 'info', msg: 'La pantalla se puede imprimir en modo vaso (Spiral vase) con 0 capas de piso: sale en una sola pared y brilla más. Usá solo luces LED: no se calientan.' });
    if (off + Rb + Rout > 220 && !assembled) issues.push({ level: 'info', msg: 'Las dos piezas juntas no entran en una cama de 22 cm: imprimilas por separado.' });

    return {
      parts: [
        part('shade', 'Pantalla', p.colorShade, shade, { focus: true, glow: true }),
        part('base', 'Base', p.colorBase, vols, { bridges: true }),
      ],
      issues,
    };
  },
};
