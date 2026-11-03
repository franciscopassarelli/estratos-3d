// Lámpara LED de dos piezas: una base con lugar para una luz LED a pilas y salida de cable,
// y una pantalla hueca que se apoya encastrada en la base. La pantalla tiene múltiples estilos.
import * as THREE from 'three';
import { difference, union, intersection, circle, rect, offset } from '../core/geometry2d.js';
import { extrudeRegion, part, geometryFromMesh } from '../core/mesh.js';

const TAU = Math.PI * 2;

/** Radio de la pantalla en el ángulo th y altura relativa t (0 abajo, 1 arriba). */
function shadeRadius(p, th, t) {
  const R = p.diameter / 2;
  if (p.style === 'ondas') {
    const n = 4.5, c = Math.abs(Math.cos(th)) ** n + Math.abs(Math.sin(th)) ** n;
    const squircle = Math.pow(c, -1 / n);
    const tiers = Math.round(p.tiers), f = (t * tiers) % 1;
    return R * (0.86 * squircle) * (1 + (p.depth / 100) * (Math.sin(Math.PI * f) - 0.5));
  }
  if (p.style === 'acanalada') return R + (p.depth / 100) * 6 * Math.cos(Math.round(p.ribs) * th);
  if (p.style === 'texturada') {
    const k = Math.round(p.lobes), rows = Math.round(p.tiers);
    const bump = Math.cos(k * th) * Math.cos(TAU * rows * t);
    const fade = Math.min(1, t * 12, (1 - t) * 12);
    return R + fade * ((p.depth / 100) * 10 * bump) + (p.depth / 100) * 1.6 * Math.cos(Math.round(p.ribs) * th);
  }
  if (p.style === 'espiral') {
    const prof = 0.74 + 0.26 * Math.sin(Math.PI * Math.min(1, t / 0.9)) - 0.12 * Math.max(0, t - 0.6) / 0.4;
    return R * prof + (p.depth / 100) * 5 * Math.cos(Math.round(p.ribs) * th + TAU * 0.5 * t);
  }
  if (p.style === 'cuadradaTorsion') {
    const n = 4;
    // Ahora toma el valor dinámico del slider (por defecto 0.8)
    const twistTurns = p.twist !== undefined ? p.twist : 0.8;
    const adjustedTh = th - TAU * twistTurns * t;
    const c = Math.abs(Math.cos(adjustedTh)) ** n + Math.abs(Math.sin(adjustedTh)) ** n;
    const squircle = Math.pow(c, -1 / n);
    const profile = 0.9 + 0.1 * Math.sin(Math.PI * t);
    return R * squircle * profile;
  }
  const turns = 0.6;
  return R + (p.depth / 100) * 30 * Math.cos(Math.round(p.lobes) * th + TAU * turns * t) * (0.6 + 0.4 * Math.sin(Math.PI * t));
}

/** Pantalla hueca: superficie exterior e interior (corrida el grosor de la pared), abierta arriba y abajo. */
function shadeMesh(p, z0) {
  const H = p.height, w = p.wall;
  const st = p.style;
  const Nt = st === 'acanalada' ? Math.round(p.ribs) * 8 : st === 'ondulada' ? Math.round(p.lobes) * 24
    : st === 'texturada' ? Math.round(p.ribs) * 6 : st === 'espiral' ? Math.round(p.ribs) * 8 
    : st === 'cuadradaTorsion' ? 200 : 160;
  const L = st === 'ondas' ? Math.round(p.tiers) * 24 : st === 'ondulada' ? 60 : st === 'texturada' ? Math.round(p.tiers) * 22 
    : st === 'espiral' ? 80 : st === 'cuadradaTorsion' ? 90 : 2;
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
    const o0 = outer[0] + k, o1 = outer[0] + nx(k), i0 = inner[0] + k, i1 = inner[0] + nx(k);
    T.push(o0, i1, o1, o0, i0, i1);
    const O0 = outer[L] + k, O1 = outer[L] + nx(k), I0 = inner[L] + k, I1 = inner[L] + nx(k);
    T.push(O0, O1, I1, O0, I1, I0);
  }
  return geometryFromMesh(V, T);
}

const LIP_H = 10;
const LIP_W = 2.4;

function shadeLoop(p, t, side = 'in', n = 360) {
  const w = side === 'in' ? p.wall : 0, ring = [];
  for (let k = 0; k < n; k++) { const th = (k / n) * TAU, r = shadeRadius(p, th, t) - w; ring.push({ x: Math.cos(th) * r, y: Math.sin(th) * r }); }
  return [ring];
}

function lipZone(p) {
  let z = null;
  for (let j = 0; j <= 6; j++) {
    const loop = shadeLoop(p, ((LIP_H + 1) / p.height) * (j / 6), 'in');
    z = z ? intersection(z, loop) : loop;
  }
  return z;
}

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
      T.push(hb + k, outer[0] + nx(k), outer[0] + k, hb + k, hb + nx(k), outer[0] + nx(k));
      T.push(ht + k, inner[0] + k, inner[0] + nx(k), ht + k, inner[0] + nx(k), ht + nx(k));
      T.push(hb + k, ht + k, ht + nx(k), hb + k, ht + nx(k), hb + nx(k));
    }
  }
  return geometryFromMesh(V, T);
}

/** Construye la tapa calcando el perfil de encastre dinámico y asegurando que apoye plana al imprimir */
function buildSquareCap(p, z0, assembled) {
  // Calculamos el contorno calcado exactamente de la boca de la lámpara a su altura final (t=1)
  const outRing = shadeLoop(p, 1, 'out', 180);
  const inRing = shadeLoop(p, 1, 'in', 180);

  // Generamos el encastre con la holgura perfecta sin importar cuánta torsión tenga
  const capBrim = offset(outRing, 1.0); // Borde decorativo
  const capLip = offset(inRing, -p.fit); // Labio de calce perfecto
  const capHole = offset(capLip, -4.0); // Agujero para tapa abierta

  const geoms = [];
  const isOpen = p.capTop === 'open';

  // Generamos la pieza al derecho (como va encastrada en la lámpara real)
  if (isOpen) {
    geoms.push(extrudeRegion(difference(capLip, capHole), -3.5, 0)); // Labio hacia abajo
    geoms.push(extrudeRegion(difference(capBrim, capHole), 0, 2.4)); // Borde hacia arriba
  } else {
    geoms.push(extrudeRegion(capLip, -3.5, 0)); 
    geoms.push(extrudeRegion(capBrim, 0, 2.4)); 
  }

  // Posicionamiento dinámico:
  if (assembled) {
    // Si la vemos armada, solo la subimos hasta el techo
    const m = new THREE.Matrix4().makeTranslation(0, 0, z0 + p.height);
    geoms.forEach(g => g.applyMatrix4(m));
  } else {
    // Si la separamos para imprimir, la movemos a un rincón, LA VOLTEAMOS BOCA ABAJO (180° sobre X) 
    // y la subimos 2.4mm para que la cara plana descanse EXACTAMENTE en Z=0 (la cama).
    const off = Math.max(p.diameter / 2, 40) + 15;
    const m = new THREE.Matrix4()
      .makeTranslation(-off, off, 2.4)
      .multiply(new THREE.Matrix4().makeRotationX(Math.PI));
    geoms.forEach(g => g.applyMatrix4(m));
  }

  return geoms;
}

/** Estilo hongo */
function buildMushroom(p, orientationId) {
  const issues = [];
  const amp = (p.depth / 100) * 2.5, N = Math.round(p.ribs);
  const rib = (th) => amp * Math.cos(N * th);
  const ledR = p.led / 2, w = p.wall;
  const stemW = Math.max(w, 1.6), Hs = p.height - 1.2;
  const rcup = ledR + 0.6 + stemW, rn = Math.max(ledR - 5, 10) + stemW, Rb = Math.max(rcup * 1.7, rcup + 20);
  const cupH = 14, flare = (rcup - rn) * 1.1, zn = Hs - cupH - flare;
  const RbOk = Math.min(Rb, rn + 0.42 * zn);
  const stemR = (th, t) => {
    const z = t * Hs;
    const r = z <= zn ? rn + (RbOk - rn) * (1 - z / zn) ** 2.2 : z <= zn + flare ? rn + (z - zn) / 1.1 : rcup;
    return r + rib(th) * (z <= zn ? 1 : 0.5);
  };
  const stem = cupMesh(stemR, Hs, stemW, 2.4, N * 4, 90, p.cable ? 4 : 0);
  const rt = rcup;
  const Rc = p.diameter / 2 * 1.3, rf = Math.max(Rc * 0.5, rt + amp + 4), Hc = Math.max(1.6 * (Rc - rf), p.height * 0.36), F = Math.max(1.2, w);
  const capR = (th, t) => rf + (Rc - rf) * (0.55 * t + 0.45 * t * t) + rib(th) * (0.4 + 0.6 * t);
  const ci = rt + amp + p.fit + 0.1, collar = difference(circle(0, 0, ci + 1.6, 96), circle(0, 0, ci, 96));
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
  }
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
  description: 'Base con lugar para una luz LED a pilas o de cable, y una pantalla hueca con ondas apiladas, acanalada, cuadrada torsionada o hongo. Se imprime en dos piezas y se encastra.',
  tags: ['lámpara', 'velador', 'led', 'luz', 'decoración', 'pantalla', 'modo vaso', 'regalo'],
  printTime: '4–8 h',
  defaults: {
    style: 'ondas', diameter: 110, height: 150, tiers: 3, ribs: 48, lobes: 6, depth: 22, wall: 1.2,
    baseHeight: 40, fit: 0.25, led: 42, cable: true, capTop: 'closed', colorBase: '#8FD3B6', colorShade: '#F1F1EC',
    twist: 0.8 // Valor inicial de la torsión
  },
  sections: [
    { title: 'Pantalla', items: [
      { key: 'style', type: 'cards', label: 'Estilo', options: [
        { value: 'ondas', label: 'Ondas apiladas', hint: 'Almohadones de luz' },
        { value: 'acanalada', label: 'Acanalada', hint: 'Estrías verticales finas' },
        { value: 'ondulada', label: 'Ondulada', hint: 'Ondas que giran' },
        { value: 'texturada', label: 'Texturada', hint: 'Bultos en grilla y estrías finas' },
        { value: 'espiral', label: 'Globo espiral', hint: 'Forma de globo con estrías que giran' },
        { value: 'cuadradaTorsion', label: 'Cuadrada torsionada', hint: 'Cuerpo cuadrado con giro espiral y tapa' },
        { value: 'hongo', label: 'Hongo', hint: 'Sombrero acanalado sobre un pie que se ensancha' },
      ] },
      { key: 'twist', type: 'range', label: 'Torsión (vueltas)', min: 0, max: 2, step: 0.1, visibleIf: (p) => p.style === 'cuadradaTorsion' },
      { key: 'tiers', type: 'stepper', min: 2, max: 6, visibleIf: (p) => p.style === 'ondas' || p.style === 'texturada', label: (p) => (p.style === 'texturada' ? 'Filas de bultos' : 'Pisos') },
      { key: 'ribs', type: 'stepper', label: 'Estrías', min: 20, max: 120, visibleIf: (p) => ['acanalada', 'texturada', 'espiral', 'hongo'].includes(p.style) },
      { key: 'lobes', type: 'stepper', label: (p) => (p.style === 'texturada' ? 'Bultos por vuelta' : 'Ondas'), min: 3, max: 12, visibleIf: (p) => p.style === 'ondulada' || p.style === 'texturada' },
      { key: 'depth', type: 'range', label: 'Profundidad del relieve', min: 5, max: 100, step: 1, unit: '%' },
      { key: 'capTop', type: 'segmented', label: 'Tapa superior', options: [{ value: 'closed', label: 'Cerrada' }, { value: 'open', label: 'Abierta' }], visibleIf: (p) => p.style === 'hongo' || p.style === 'cuadradaTorsion' },
    ] },
    { title: 'Medidas', items: [
      { key: 'diameter', type: 'range', label: (p) => (p.style === 'hongo' ? 'Ancho del sombrero' : 'Ancho de la pantalla'), min: 70, max: 180, step: 1, unit: 'mm' },
      { key: 'height', type: 'range', label: (p) => (p.style === 'hongo' ? 'Alto total' : 'Alto de la pantalla'), min: 70, max: 220, step: 1, unit: 'mm' },
      { key: 'wall', type: 'range', label: 'Pared de la pantalla', min: 0.8, max: 2.4, step: 0.1, unit: 'mm', help: 'Más fina = deja pasar más luz' },
      { key: 'fit', type: 'range', label: 'Holgura del encastre', min: 0.1, max: 0.9, step: 0.05, unit: 'mm', help: 'Calce para el encastre en la base.' },
      { key: 'baseHeight', type: 'range', label: 'Alto de la base', min: 20, max: 80, step: 1, unit: 'mm', visibleIf: (p) => p.style !== 'hongo' },
    ] },
    { title: 'Luz', items: [
      { key: 'led', type: 'range', label: 'Hueco para la luz LED', min: 30, max: 70, step: 1, unit: 'mm', help: 'Diámetro de tu luz LED' },
      { key: 'cable', type: 'toggle', label: 'Salida para cable por abajo' },
    ] },
    { title: 'Colores', items: [
      { key: 'colorShade', type: 'color', label: 'Pantalla', help: 'Blanco o natural dejan pasar mejor la luz.' },
      { key: 'colorBase', type: 'color', label: 'Base' },
    ] },
  ],
  orientations: [{ id: 'print', label: 'Las piezas separadas sobre la cama' }],
  views: [{ id: 'assembled', label: 'Armada' }],
  useOrientation: 'assembled',

  build(p, orientationId = 'print') {
    if (p.style === 'hongo') return buildMushroom(p, orientationId);
    const issues = [];
    const Rin = innerBottom(p), Rout = outerBottom(p), hb = p.baseHeight;
    const clr = p.fit, lipH = LIP_H, lipW = LIP_W;
    const ledR = p.led / 2;
    if (ledR + 2 > Rin - lipW - clr) return { parts: [], issues: [{ level: 'error', msg: 'La luz LED no entra adentro de la pantalla. Agrandá la pantalla o achicá el hueco de la luz.' }] };

    const square = p.style === 'ondas' || p.style === 'cuadradaTorsion';
    const lipOuter = square ? offset(lipZone(p), -clr) : circle(0, 0, Rin - clr, 128);
    const lipInner = offset(lipOuter, -lipW);
    const body = square ? offset(shadeLoop(p, 0, 'out'), 2.5) : circle(0, 0, Rout + 3, 128);
    let Rb = 0;
    for (const ring of body) for (const q of ring) Rb = Math.max(Rb, Math.hypot(q.x, q.y));
    const ledHole = circle(0, 0, ledR, 96);
    const depth = Math.min(14, hb - 6);
    
    const vols = [];
    if (p.cable) {
      const slot = rect(Rb / 2, 0, Rb + 2, 9);
      vols.push(extrudeRegion(difference(body, union(slot, circle(0, 0, 4.5, 32))), 0, 6));
      vols.push(extrudeRegion(difference(body, circle(0, 0, 4.5, 32)), 6, hb - depth));
    } else vols.push(extrudeRegion(body, 0, hb - depth));
    vols.push(extrudeRegion(difference(body, ledHole), hb - depth, hb));
    vols.push(extrudeRegion(difference(lipOuter, lipInner), hb, hb + lipH - 2));
    vols.push(extrudeRegion(difference(offset(lipOuter, -0.6), lipInner), hb + lipH - 2, hb + lipH));

    const assembled = orientationId === 'assembled';
    const shade = shadeMesh(p, assembled ? hb : 0);
    
    // Posicionamos la pantalla hacia abajo a la derecha
    const off = Math.max(Rb, p.diameter / 2) + 15;
    if (!assembled) shade.translate(off, -off, 0);

    const partsList = [
      part('shade', 'Pantalla', p.colorShade, shade, { focus: true, glow: true }),
      part('base', 'Base', p.colorBase, vols, { bridges: true }),
    ];

    if (p.style === 'cuadradaTorsion') {
      const capGeoms = buildSquareCap(p, hb, assembled);
      partsList.push(part('cap', 'Tapa superior', p.colorBase, capGeoms));
    }

    if (p.wall < 1) issues.push({ level: 'info', msg: 'Pared muy fina: deja pasar mucha luz, pero es frágil. Imprimila despacio.' });

    return {
      parts: partsList,
      issues,
    };
  },
}