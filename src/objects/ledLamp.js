// Lámpara LED de dos piezas: una base con lugar para una luz LED a pilas y salida de cable,
// y una pantalla hueca que se apoya encastrada en la base. La pantalla tiene tres estilos.
import * as THREE from 'three';
import { difference, union, intersection, circle, rect, offset } from '../core/geometry2d.js';
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

// Zona de la pantalla donde entra el aro de la base (mm desde la boca de abajo)
const LIP_H = 10;
const LIP_W = 2.4;

/** Contorno (región 2D) de la pantalla a la altura relativa t: 'in' = interior, 'out' = exterior. */
function shadeLoop(p, t, side = 'in', n = 360) {
  const w = side === 'in' ? p.wall : 0, ring = [];
  for (let k = 0; k < n; k++) { const th = (k / n) * TAU, r = shadeRadius(p, th, t) - w; ring.push({ x: Math.cos(th) * r, y: Math.sin(th) * r }); }
  return [ring];
}

/** Interior que queda libre en TODA la altura del aro: intersección de los contornos de abajo hasta LIP_H. */
function lipZone(p) {
  let z = null;
  for (let j = 0; j <= 6; j++) {
    const loop = shadeLoop(p, ((LIP_H + 1) / p.height) * (j / 6), 'in');
    z = z ? intersection(z, loop) : loop;
  }
  return z;
}

/** Radio interior mínimo en la zona del aro (no solo en el borde de abajo: en Ondulada y Texturada se angosta enseguida). */
function innerBottom(p) {
  let m = Infinity;
  for (let j = 0; j <= 12; j++) for (let k = 0; k < 360; k++) {
    m = Math.min(m, shadeRadius(p, (k / 360) * TAU, ((LIP_H + 1) / p.height) * (j / 12)) - p.wall);
  }
  return m;
}
function outerBottom(p) {
  let m = 0;
  for (let k = 0; k < 360; k++) m = Math.max(m, shadeRadius(p, (k / 360) * TAU, 0));
  return m;
}

/**
 * Vaso cerrado abajo (pared exterior + interior + piso), abierto arriba. rFn(th, t) es el radio
 * exterior con t de 0 (piso) a 1 (boca). hole: radio de un agujero central en el piso (0 = sin agujero).
 */
function cupMesh(rFn, H, w, F, Nt, L, hole = 0) {
  const V = [], T = [], outer = [], inner = [];
  for (let l = 0; l <= L; l++) {
    const t = l / L; outer.push(V.length);
    for (let k = 0; k < Nt; k++) { const th = (k / Nt) * TAU, r = rFn(th, t); V.push([Math.cos(th) * r, Math.sin(th) * r, H * t]); }
  }
  for (let l = 0; l <= L; l++) {
    const t = F / H + (1 - F / H) * (l / L); inner.push(V.length);
    for (let k = 0; k < Nt; k++) { const th = (k / Nt) * TAU, r = rFn(th, t) - w; V.push([Math.cos(th) * r, Math.sin(th) * r, H * t]); }
  }
  const nx = (k) => (k + 1) % Nt;
  for (let l = 0; l < L; l++) for (let k = 0; k < Nt; k++) {
    const a = outer[l] + k, b = outer[l] + nx(k), c = outer[l + 1] + nx(k), d = outer[l + 1] + k;
    T.push(a, b, c, a, c, d);
    const e = inner[l] + k, f = inner[l] + nx(k), g = inner[l + 1] + nx(k), h = inner[l + 1] + k;
    T.push(e, g, f, e, h, g);
  }
  for (let k = 0; k < Nt; k++) {
    const O0 = outer[L] + k, O1 = outer[L] + nx(k), I0 = inner[L] + k, I1 = inner[L] + nx(k);
    T.push(O0, O1, I1, O0, I1, I0);
  }
  if (!hole) {
    const cb = V.length; V.push([0, 0, 0]);
    const ct = V.length; V.push([0, 0, F]);
    for (let k = 0; k < Nt; k++) { T.push(cb, outer[0] + nx(k), outer[0] + k); T.push(ct, inner[0] + k, inner[0] + nx(k)); }
  } else {
    const hb = V.length; for (let k = 0; k < Nt; k++) { const th = (k / Nt) * TAU; V.push([Math.cos(th) * hole, Math.sin(th) * hole, 0]); }
    const ht = V.length; for (let k = 0; k < Nt; k++) { const th = (k / Nt) * TAU; V.push([Math.cos(th) * hole, Math.sin(th) * hole, F]); }
    for (let k = 0; k < Nt; k++) {
      T.push(hb + k, outer[0] + nx(k), outer[0] + k, hb + k, hb + nx(k), outer[0] + nx(k)); // piso de abajo
      T.push(ht + k, inner[0] + k, inner[0] + nx(k), ht + k, inner[0] + nx(k), ht + nx(k)); // piso de arriba
      T.push(hb + k, ht + k, ht + nx(k), hb + k, ht + nx(k), hb + nx(k));                   // pared del agujero
    }
  }
  return geometryFromMesh(V, T);
}

/** Estilo hongo: pie acanalado que se ensancha abajo (con la luz en el fondo) y sombrero que se calza arriba. */
function buildMushroom(p, orientationId) {
  const issues = [];
  const amp = (p.depth / 100) * 2.5, N = Math.round(p.ribs);
  const rib = (th) => amp * Math.cos(N * th);
  const ledR = p.led / 2, w = p.wall;
  // Pie: abajo ancho, cuello angosto y arriba un vaso donde se apoya la luz LED.
  // El cuello es más angosto que la luz: la luz queda apoyada en el ensanche (a 45°, sin soportes).
  const stemW = Math.max(w, 1.6), Hs = p.height - 1.2;
  const rcup = ledR + 0.6 + stemW, rn = Math.max(ledR - 5, 10) + stemW, Rb = Math.max(rcup * 1.7, rcup + 20);
  const cupH = 14, flare = (rcup - rn) * 1.1, zn = Hs - cupH - flare;
  const RbOk = Math.min(Rb, rn + 0.42 * zn); // la panza del pie no puede pasar de 45° de pendiente
  const stemR = (th, t) => {
    const z = t * Hs;
    const r = z <= zn ? rn + (RbOk - rn) * (1 - z / zn) ** 2.2 : z <= zn + flare ? rn + (z - zn) / 1.1 : rcup;
    return r + rib(th) * (z <= zn ? 1 : 0.5);
  };
  const stem = cupMesh(stemR, Hs, stemW, 2.4, N * 4, 90, p.cable ? 4 : 0);
  const rt = rcup;
  // Sombrero (se imprime boca abajo: la tapa sobre la cama y las paredes abriéndose a menos de 45°)
  // Tapa: mismo grosor que la pared (mínimo 1,2 mm) para que brille parejo y no se transparente la luz
  const Rc = p.diameter / 2 * 1.3, rf = Math.max(Rc * 0.5, rt + amp + 4), Hc = Math.max(1.6 * (Rc - rf), p.height * 0.36), F = Math.max(1.2, w);
  const capR = (th, t) => rf + (Rc - rf) * (0.55 * t + 0.45 * t * t) + rib(th) * (0.4 + 0.6 * t);
  // Collar que abraza la boca del pie
  const ci = rt + amp + p.fit + 0.1, collar = difference(circle(0, 0, ci + 1.6, 96), circle(0, 0, ci, 96));
  // Tapa abierta: agujero del tamaño de la boca del collar (sale luz hacia arriba y ventila)
  // (dejando siempre al menos 1 mm de tapa entre el agujero y la pared, aun con mucho relieve)
  const open = p.capTop === 'open';
  let capIn = Infinity;
  for (let k = 0; k < N * 4; k++) capIn = Math.min(capIn, capR((k / (N * 4)) * TAU, F / Hc) - w);
  const hole = open ? Math.min(ci, capIn - 1) : 0;
  const cap = [cupMesh(capR, Hc, w, F, N * 4, 40, hole)];
  cap.push(extrudeRegion(collar, 0, Math.min(14, Hc - 4)));
  if (orientationId === 'assembled') {
    const m = new THREE.Matrix4().makeTranslation(0, 0, Hs + F).multiply(new THREE.Matrix4().makeRotationX(Math.PI));
    cap.forEach((g) => g.applyMatrix4(m));
  } else {
    const off = (RbOk + Rc + 8) / Math.SQRT2;
    cap.forEach((g) => g.translate(off, off, 0));
    if (off + RbOk + Rc > 215) issues.push({ level: 'info', msg: 'El pie y el sombrero juntos no entran en una cama de 22 cm: imprimilos por separado.' });
  }
  if (Rc * 2 > 215) issues.push({ level: 'warning', msg: 'El sombrero es más ancho que una cama de 22 cm.' });
  if (open) {
    issues.push({ level: 'info', msg: 'Tapa abierta: sale luz hacia arriba (al techo) y el calor se ventila. Desde arriba se ve la luz LED.' });
  } else {
    issues.push({ level: 'info', msg: 'La luz LED se apoya arriba del pie, en el vaso. El sombrero se calza encima y brilla entero. El cable baja por adentro del pie.' });
    issues.push({ level: 'info', msg: 'Tapa cerrada: la luz queda cerca de la tapa y en el centro se ve un círculo más brillante. Como el calor queda adentro, usá solo luces LED de 5 W o menos.' });
  }
  issues.push({ level: 'info', msg: 'Las dos piezas se pueden imprimir en modo vaso (Spiral vase) con piso. El sombrero va boca abajo, con la tapa sobre la cama.' });
  return {
    parts: [
      part('shade', 'Sombrero', p.colorShade, cap, { focus: true, glow: true }),
      part('base', 'Pie', p.colorBase, stem),
    ],
    issues,
    led: { z: orientationId === 'assembled' ? Hs + 0.4 : null },
  };
}

export default {
  id: 'lampara-led',
  name: 'Lámpara LED de dos piezas',
  category: 'hogar',
  description: 'Base con lugar para una luz LED a pilas o de cable, y una pantalla hueca con ondas apiladas, acanalada o ondulada. Se imprime en dos piezas y se encastra.',
  tags: ['lámpara', 'velador', 'led', 'luz', 'decoración', 'pantalla', 'modo vaso', 'regalo'],
  printTime: '4–8 h',
  defaults: {
    style: 'ondas', diameter: 110, height: 150, tiers: 3, ribs: 48, lobes: 6, depth: 22, wall: 1.2,
    baseHeight: 40, fit: 0.25, led: 42, cable: true, capTop: 'closed', colorBase: '#8FD3B6', colorShade: '#F1F1EC',
  },
  sections: [
    { title: 'Pantalla', items: [
      { key: 'style', type: 'cards', label: 'Estilo', options: [
        { value: 'ondas', label: 'Ondas apiladas', hint: 'Almohadones de luz' },
        { value: 'acanalada', label: 'Acanalada', hint: 'Estrías verticales finas' },
        { value: 'ondulada', label: 'Ondulada', hint: 'Ondas que giran' },
        { value: 'texturada', label: 'Texturada', hint: 'Bultos en grilla y estrías finas' },
        { value: 'espiral', label: 'Globo espiral', hint: 'Forma de globo con estrías que giran' },
        { value: 'hongo', label: 'Hongo', hint: 'Sombrero acanalado sobre un pie que se ensancha' },
      ] },
      { key: 'tiers', type: 'stepper', min: 2, max: 6, visibleIf: (p) => p.style === 'ondas' || p.style === 'texturada', label: (p) => (p.style === 'texturada' ? 'Filas de bultos' : 'Pisos') },
      { key: 'ribs', type: 'stepper', label: 'Estrías', min: 20, max: 120, visibleIf: (p) => ['acanalada', 'texturada', 'espiral', 'hongo'].includes(p.style) },
      { key: 'lobes', type: 'stepper', label: (p) => (p.style === 'texturada' ? 'Bultos por vuelta' : 'Ondas'), min: 3, max: 12, visibleIf: (p) => p.style === 'ondulada' || p.style === 'texturada' },
      { key: 'depth', type: 'range', label: 'Profundidad del relieve', min: 5, max: 100, step: 1, unit: '%' },
      { key: 'capTop', type: 'segmented', label: 'Tapa del sombrero', options: [{ value: 'closed', label: 'Cerrada (difusa)' }, { value: 'open', label: 'Abierta' }], visibleIf: (p) => p.style === 'hongo' },
    ] },
    { title: 'Medidas', items: [
      { key: 'diameter', type: 'range', label: (p) => (p.style === 'hongo' ? 'Ancho del sombrero' : 'Ancho de la pantalla'), min: 70, max: 180, step: 1, unit: 'mm' },
      { key: 'height', type: 'range', label: (p) => (p.style === 'hongo' ? 'Alto total' : 'Alto de la pantalla'), min: 70, max: 220, step: 1, unit: 'mm' },
      { key: 'wall', type: 'range', label: 'Pared de la pantalla', min: 0.8, max: 2.4, step: 0.1, unit: 'mm', help: 'Más fina = deja pasar más luz' },
      { key: 'fit', type: 'range', label: 'Holgura del encastre', min: 0.1, max: 0.9, step: 0.05, unit: 'mm', help: 'Si la pantalla no entra en la base, subila; si queda floja, bajala. 0,2–0,3 mm es un calce firme en impresoras bien calibradas (Bambu, Prusa); 0,4–0,5 si la tuya es más floja.' },
      { key: 'baseHeight', type: 'range', label: 'Alto de la base', min: 20, max: 80, step: 1, unit: 'mm', visibleIf: (p) => p.style !== 'hongo' },
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
    if (p.style === 'hongo') return buildMushroom(p, orientationId);
    const issues = [];
    const Rin = innerBottom(p), Rout = outerBottom(p), hb = p.baseHeight;
    const clr = p.fit, lipH = LIP_H, lipW = LIP_W;
    const ledR = p.led / 2;
    if (ledR + 2 > Rin - lipW - clr) return { parts: [], issues: [{ level: 'error', msg: 'La luz LED no entra adentro de la pantalla. Agrandá la pantalla o achicá el hueco de la luz.' }] };

    // En «Ondas» la boca es un cuadrado redondeado: el aro y la base copian ese contorno (juego parejo en todo el borde).
    // En los demás estilos el aro es un círculo que cabe en el punto más angosto de la zona de encastre.
    const square = p.style === 'ondas';
    const lipOuter = square ? offset(lipZone(p), -clr) : circle(0, 0, Rin - clr, 128);
    const lipInner = offset(lipOuter, -lipW);
    // Base: contorno de la pantalla en la boca + 2,5 mm de borde (círculo en los demás estilos)
    const body = square ? offset(shadeLoop(p, 0, 'out'), 2.5) : circle(0, 0, Rout + 3, 128);
    let Rb = 0;
    for (const ring of body) for (const q of ring) Rb = Math.max(Rb, Math.hypot(q.x, q.y));
    const ledHole = circle(0, 0, ledR, 96);
    const depth = Math.min(14, hb - 6);
    const vols = [];
    if (p.cable) {
      const slot = rect(Rb / 2, 0, Rb + 2, 9); // canal desde el centro hasta el borde, por abajo
      vols.push(extrudeRegion(difference(body, union(slot, circle(0, 0, 4.5, 32))), 0, 6));
      vols.push(extrudeRegion(difference(body, circle(0, 0, 4.5, 32)), 6, hb - depth));
    } else vols.push(extrudeRegion(body, 0, hb - depth));
    vols.push(extrudeRegion(difference(body, ledHole), hb - depth, hb));
    // Aro con entrada guiada: los últimos 2 mm son 0,6 mm más finos para que la pantalla "caiga" en su lugar
    vols.push(extrudeRegion(difference(lipOuter, lipInner), hb, hb + lipH - 2));
    vols.push(extrudeRegion(difference(offset(lipOuter, -0.6), lipInner), hb + lipH - 2, hb + lipH));

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