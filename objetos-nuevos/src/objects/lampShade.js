import * as THREE from 'three';
import { difference, intersection, rect, area, thinFraction } from '../core/geometry2d.js';
import { geometryFromMesh, fixTJunctions, part } from '../core/mesh.js';
import { PRINT } from '../core/palette.js';
import { toShapes } from '../core/geometry2d.js';

const TAU = Math.PI * 2;

// ---------- Mapeo de la pared "desenrollada" (x = recorrido, y = altura) al cilindro o prisma ----------
function makeMapper(shape, sides, apothemMid, C) {
  if (shape === 'round') {
    const Rm = apothemMid;
    return (x, y, off) => { const th = (x / C) * TAU, R = Rm + off; return [Math.cos(th) * R, Math.sin(th) * R, y]; };
  }
  const n = sides, face = C / n, k = 1 / Math.cos(Math.PI / n);
  const corner = (i, a) => { const th = (i / n) * TAU - Math.PI / 2 - Math.PI / n; return [Math.cos(th) * a * k, Math.sin(th) * a * k]; };
  return (x, y, off) => {
    const a = apothemMid + off;
    let i = Math.floor(x / face); if (i >= n) i = n - 1; if (i < 0) i = 0;
    const t = (x - i * face) / face;
    const A = corner(i, a), B = corner(i + 1, a);
    return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, y];
  };
}

/** Malla cerrada de una pared con agujeros: región 2D [0,C]x[0,H] -> tubo de grosor w. */
function wallMesh(region, C, H, w, cuts, map) {
  const V = [], Tr = [], key = new Map();
  const eps = 1e-6;
  // Sobre cada línea de corte, los puntos que difieren en 1–2 µm (redondeo de Clipper) se unifican.
  const snaps = new Map();
  const snap = (x, y) => {
    const c = cuts.find((cc) => Math.abs(cc - x) < 2e-3);
    if (c === undefined) return [x, y];
    const key0 = c > C - 2e-3 ? 0 : c;
    let list = snaps.get(key0);
    if (!list) snaps.set(key0, (list = []));
    const hit = list.find((v) => Math.abs(v - y) < 0.015);
    if (hit !== undefined) return [key0, hit];
    list.push(y);
    return [key0, y];
  };
  const vid = (x, y, off) => {
    [x, y] = snap(x, y);
    if (x > C - 2e-3) x = 0; // la costura: mismo punto que x = 0
    const k = `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${off > 0 ? 1 : 0}`;
    let id = key.get(k);
    if (id === undefined) { id = V.length; V.push(map(x, y, off)); key.set(k, id); }
    return id;
  };
  const edges = [];
  for (let k = 0; k < cuts.length - 1; k++) {
    // Rectángulo con los mismos valores exactos que la franja vecina, para que compartan vértices
    const x0 = cuts[k], x1 = cuts[k + 1];
    const strip = intersection(region, [[{ x: x0, y: -1 }, { x: x1, y: -1 }, { x: x1, y: H + 1 }, { x: x0, y: H + 1 }]]);
    for (const shape of toShapes(strip)) {
      let contour = shape.getPoints().slice();
      if (contour.length > 1 && contour[0].equals(contour[contour.length - 1])) contour.pop();
      let holes = shape.holes.map((h) => { const pts = h.getPoints().slice(); if (pts.length > 1 && pts[0].equals(pts[pts.length - 1])) pts.pop(); return pts; });
      if (THREE.ShapeUtils.isClockWise(contour)) contour.reverse();
      holes = holes.map((h) => (THREE.ShapeUtils.isClockWise(h) ? h : h.reverse()));
      const all = [contour, ...holes].flat();
      for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(contour, holes)) {
        const A = all[a], B = all[b], Cc = all[c];
        Tr.push(vid(A.x, A.y, w / 2), vid(B.x, B.y, w / 2), vid(Cc.x, Cc.y, w / 2));
        Tr.push(vid(A.x, A.y, -w / 2), vid(Cc.x, Cc.y, -w / 2), vid(B.x, B.y, -w / 2));
      }
      for (const ring of [contour, ...holes]) {
        for (let i = 0; i < ring.length; i++) {
          const p = ring[i], q = ring[(i + 1) % ring.length];
          if (p.distanceTo(q) < eps) continue;
          edges.push([p, q, vid(p.x, p.y, w / 2), vid(q.x, q.y, w / 2)]);
        }
      }
    }
  }
  // Una arista compartida por dos franjas (o por los dos lados de la costura) es interior: no lleva pared.
  const seen = new Set(edges.map((e) => `${e[2]}>${e[3]}`));
  // Respaldo: si un vértice quedó sobre un corte y la arista no tiene pareja exacta, se mira si hay material a ambos lados.
  const inside = (x, y) => {
    x = ((x % C) + C) % C;
    let c = false;
    for (const ring of region) for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j];
      if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) c = !c;
    }
    return c;
  };
  const interior = (p, q) => Math.abs(p.x - q.x) < 1e-6 && cuts.some((c) => Math.abs(c - p.x) < 2e-3) && inside(p.x - 0.02, (p.y + q.y) / 2) && inside(p.x + 0.02, (p.y + q.y) / 2);
  for (const [p, q, po, qo] of edges) {
    if (seen.has(`${qo}>${po}`) || interior(p, q)) continue;
    const pi = vid(p.x, p.y, -w / 2), qi = vid(q.x, q.y, -w / 2);
    Tr.push(po, pi, qi, po, qi, qo);
  }
  // Bordes colineares de huecos vecinos pueden dejar uniones en T al triangular: se reparan.
  return fixTJunctions(geometryFromMesh(V, Tr));
}

// ---------- Perforaciones autoportantes (todas con techo a 45° o más) ----------
function holeShape(kind, cx, cy, wdt, hgt) {
  const a = wdt / 2, b = hgt / 2;
  if (kind === 'diamonds') return [[{ x: cx, y: cy - b }, { x: cx + a, y: cy }, { x: cx, y: cy + b }, { x: cx - a, y: cy }]];
  const pts = [];
  if (kind === 'drops') {
    // Gota: círculo abajo y punta arriba; los lados tocan el círculo a 45°
    const r = a, c0 = cy - b + r;
    // Tangentes a 38° del centro: los lados de la punta quedan a 52° de la horizontal
    for (let i = 0; i <= 24; i++) { const t = ((142 + (256 * i) / 24) * Math.PI) / 180; pts.push({ x: cx + Math.cos(t) * r, y: c0 + Math.sin(t) * r }); }
    pts.push({ x: cx, y: c0 + r / Math.cos((52 * Math.PI) / 180) });
    return [pts];
  }
  // Ranura con techo en punta (ventana ojival simple)
  const g = a * 1.3; // techo a ~52°
  return [[{ x: cx - a, y: cy - b }, { x: cx + a, y: cy - b }, { x: cx + a, y: cy + b - g }, { x: cx, y: cy + b }, { x: cx - a, y: cy + b - g }]];
}

export default {
  id: 'pantalla-lampara',
  name: 'Pantalla de lámpara',
  category: 'hogar',
  description: 'Pantalla cilíndrica o prismática: perforada con huecos que no necesitan soportes, o lisa con textura para imprimir en modo vaso. Para velas o lámparas LED.',
  tags: ['lámpara', 'pantalla', 'luz', 'velador', 'vela led', 'decoración', 'modo vaso', 'spiral vase'],
  printTime: '2–6 h',
  defaults: {
    style: 'perforated', shape: 'round', sides: 6, diameter: 110, topDiameter: 90, height: 140,
    wall: 2, holes: 'diamonds', columns: 14, holeSize: 70, band: 10,
    surface: 'waves', lobes: 10, waveDepth: 3, twist: 60,
    color: '#F1F1EC',
  },
  sections: [
    { title: 'Tipo', items: [
      { key: 'style', type: 'cards', label: 'Cómo se imprime', options: [
        { value: 'perforated', label: 'Perforada', hint: 'Impresión normal, huecos sin soportes' },
        { value: 'vase', label: 'Modo vaso', hint: 'Una sola pared en espiral, muy rápida' },
      ] },
      { key: 'shape', type: 'segmented', label: 'Forma', options: [{ value: 'round', label: 'Cilindro' }, { value: 'prism', label: 'Prisma' }] },
      { key: 'sides', type: 'stepper', label: 'Caras del prisma', min: 3, max: 12, visibleIf: (p) => p.shape === 'prism' },
    ] },
    { title: 'Medidas', items: [
      { key: 'diameter', type: 'range', label: (p) => (p.style === 'vase' ? 'Diámetro inferior' : 'Diámetro'), min: 60, max: 200, step: 1, unit: 'mm' },
      { key: 'topDiameter', type: 'range', label: 'Diámetro superior', min: 40, max: 200, step: 1, unit: 'mm', visibleIf: (p) => p.style === 'vase' },
      { key: 'height', type: 'range', label: 'Alto', min: 60, max: 240, step: 1, unit: 'mm' },
      { key: 'wall', type: 'range', label: 'Grosor de pared', min: 1.2, max: 4, step: 0.1, unit: 'mm', visibleIf: (p) => p.style === 'perforated' },
    ] },
    { title: 'Perforaciones', items: [
      { key: 'holes', type: 'cards', label: 'Forma de los huecos', options: [
        { value: 'diamonds', label: 'Rombos', hint: 'Trama tipo panal' },
        { value: 'drops', label: 'Gotas', hint: 'Redondas abajo, en punta arriba' },
        { value: 'slots', label: 'Ventanas', hint: 'Ranuras con techo en punta' },
      ] },
      { key: 'columns', type: 'stepper', label: 'Huecos alrededor', min: 6, max: 36 },
      { key: 'holeSize', type: 'range', label: 'Tamaño de los huecos', min: 40, max: 85, step: 1, unit: '%' },
      { key: 'band', type: 'range', label: 'Franja lisa arriba y abajo', min: 4, max: 30, step: 0.5, unit: 'mm' },
    ].map((it) => ({ ...it, visibleIf: (p) => p.style === 'perforated' })) },
    { title: 'Superficie', items: [
      { key: 'surface', type: 'cards', label: 'Textura', options: [
        { value: 'waves', label: 'Ondas', hint: 'Lóbulos suaves' },
        { value: 'smooth', label: 'Lisa', hint: 'Sin textura' },
      ] },
      { key: 'lobes', type: 'stepper', label: 'Cantidad de ondas', min: 3, max: 24, visibleIf: (p) => p.surface === 'waves' },
      { key: 'waveDepth', type: 'range', label: 'Profundidad de onda', min: 1, max: 8, step: 0.5, unit: 'mm', visibleIf: (p) => p.surface === 'waves' },
      { key: 'twist', type: 'range', label: 'Giro de abajo hacia arriba', min: 0, max: 180, step: 1, unit: '°' },
    ].map((it) => ({ ...it, visibleIf: (p) => p.style === 'vase' && (!it.visibleIf || it.visibleIf(p)) })) },
    { title: 'Color', items: [{ key: 'color', type: 'color', label: 'Pantalla' }] },
  ],
  orientations: [{ id: 'base', label: 'De pie sobre la cama' }],

  build(p) {
    return p.style === 'vase' ? buildVase(p) : buildPerforated(p);
  },
};

function lightNote(issues) {
  issues.push({ level: 'info', msg: 'Usala solo con luces LED (velas LED o lámparas LED de bajo consumo): el plástico se ablanda con el calor de una lámpara común o de una vela.' });
}

function buildPerforated(p) {
  const issues = [];
  const n = p.shape === 'prism' ? Math.round(p.sides) : 0;
  const w = p.wall, H = p.height;
  // Diámetro = exterior (círculo) o distancia entre caras (prisma)
  const apMid = p.diameter / 2 - w / 2;
  const C = n ? 2 * n * apMid * Math.tan(Math.PI / n) : TAU * apMid;
  const cols = Math.round(p.columns);
  const pitch = C / cols;
  const strutMin = 1.6;
  const wd = Math.max(3, Math.min(pitch * (p.holeSize / 100), pitch - strutMin));
  const y0 = p.band, y1 = H - p.band;
  if (y1 - y0 < 15) return { parts: [], issues: [{ level: 'error', msg: 'Las franjas lisas ocupan casi toda la altura: no queda lugar para perforaciones.' }] };
  let rowsInfo, holes;
  const gen = (phi) => {
  const holes = [];
  if (p.holes === 'diamonds') {
    const a = wd / 2, b = a * 1.45; // lados de ~55° respecto de la horizontal
    const k = Math.sqrt(1 / (a * a) + 1 / (b * b));
    const pv = Math.max(b * (2 + strutMin * 1.2 * k - pitch / (2 * a)), b * 0.6);
    const rows = Math.max(1, Math.floor((y1 - y0 - 2 * b) / pv) + 1);
    const used = (rows - 1) * pv + 2 * b, start = y0 + (y1 - y0 - used) / 2 + b;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cx = (c + (r % 2 ? 0 : 0.5)) * pitch + phi;
      if (cx - a < 0.8 || cx + a > C - 0.8) continue;
      holes.push(holeShape('diamonds', cx, start + r * pv, wd, 2 * b));
    }
    rowsInfo = rows;
  } else {
    const hh = p.holes === 'drops' ? (wd / 2) * (1 + 1 / Math.cos((52 * Math.PI) / 180)) : wd * 2.2;
    const pv = hh + strutMin * 1.6;
    const rows = Math.max(1, Math.floor((y1 - y0 - hh) / pv) + 1);
    const used = (rows - 1) * pv + hh, start = y0 + (y1 - y0 - used) / 2 + hh / 2;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cx = (c + 0.5 + (r % 2 ? 0.5 : 0)) * pitch + phi;
      if (cx - wd / 2 < 0.8 || cx + wd / 2 > C - 0.8) continue;
      holes.push(holeShape(p.holes, cx, start + r * pv, wd, hh));
    }
    rowsInfo = rows;
  }
  return holes;
  };
  // En el prisma, ningún vértice de un hueco debe caer justo en una esquina: se corre apenas el patrón.
  const corners = n ? Array.from({ length: n + 1 }, (_, i) => (i * C) / n) : [];
  for (const phi of [0, 0.37, 0.71, 1.13, 1.57, 2.03, 0.19, 0.53, 0.89, 1.31, 1.79, 2.29]) {
    holes = gen(phi);
    if (!holes.flat().flat().some((pt) => corners.some((c) => Math.abs(pt.x - c) < 0.05))) break;
  }
  const region = difference(rect(C / 2, H / 2, C, H), holes.flat().map((r) => r));
  const thin = thinFraction(region, strutMin);
  if (thin > 0.03) issues.push({ level: 'warning', msg: 'Algunas uniones entre huecos quedan de menos de 1,6 mm: bajá el tamaño de los huecos o usá menos columnas.' });

  // Líneas de corte cada ~2,5 mm (y en las esquinas del prisma): siguen la curvatura y evitan triangulaciones degeneradas
  // Ningún vértice de un hueco puede caer sobre una línea de corte: se corren los cortes interiores.
  const xs = holes.flat().flat().map((pt) => pt.x).sort((u, v) => u - v);
  const clash = (c) => xs.some((x) => Math.abs(x - c) < 0.05);
  let cuts = [];
  const per = n ? Math.max(1, Math.ceil(C / n / 2.5)) : Math.max(48, Math.ceil(C / 2.5));
  const total = n ? n * per : per;
  for (let i = 0; i <= total; i++) {
    let c = (i * C) / total;
    const isCorner = n ? i % per === 0 : i === 0 || i === total;
    if (!isCorner) for (let t = 0; t < 8 && clash(c); t++) c += 0.11;
    cuts.push(c);
  }
  const map = makeMapper(n ? 'prism' : 'round', n, apMid, C);
  const geo = wallMesh(region, C, H, w, cuts, map);

  if (w < PRINT.minWall) issues.push({ level: 'warning', msg: `Pared de ${w} mm: por debajo de ${PRINT.minWall} mm la pantalla queda frágil.` });
  const openPct = Math.round((1 - area(region) / (C * H)) * 100);
  issues.push({ level: 'info', msg: `${holes.length} huecos en ${rowsInfo} filas (${openPct} % de la superficie). Todos tienen el techo a 45° o más: se imprimen sin soportes.` });
  lightNote(issues);
  return { parts: [part('body', 'Pantalla', p.color, geo)], issues };
}

function buildVase(p) {
  const issues = [];
  const H = p.height, rb = p.diameter / 2, rt = p.topDiameter / 2;
  const n = p.shape === 'prism' ? Math.round(p.sides) : 0;
  const twist = (p.twist * Math.PI) / 180;
  const waves = p.surface === 'waves';
  const lobes = Math.round(p.lobes);
  const Nt = n ? n * (twist ? 8 : 1) * (waves ? 6 : 1) : waves ? lobes * 20 : 160;
  const L = twist || waves ? 60 : 1;
  const radius = (phi, R) => {
    let r = R;
    if (n) { const s = TAU / n, local = ((phi % s) + s) % s; r = (R * Math.cos(s / 2)) / Math.cos(local - s / 2); }
    if (waves) r += p.waveDepth * Math.cos(lobes * phi) * (n ? 0.6 : 1);
    return r;
  };
  const V = [], Tr = [];
  const rings = [];
  for (let l = 0; l <= L; l++) {
    const z = (H * l) / L, t = z / H, R = rb + (rt - rb) * t, rot = twist * t;
    rings.push(V.length);
    for (let k = 0; k < Nt; k++) { const phi = (k / Nt) * TAU; const r = radius(phi, R); V.push([Math.cos(phi + rot) * r, Math.sin(phi + rot) * r, z]); }
  }
  const nx = (k) => (k + 1) % Nt;
  for (let l = 0; l < L; l++) for (let k = 0; k < Nt; k++) {
    const a = rings[l] + k, b = rings[l] + nx(k), c = rings[l + 1] + nx(k), d = rings[l + 1] + k;
    Tr.push(a, b, c, a, c, d);
  }
  const c0 = V.push([0, 0, 0]) - 1, c1 = V.push([0, 0, H]) - 1;
  for (let k = 0; k < Nt; k++) { Tr.push(c0, rings[0] + nx(k), rings[0] + k); Tr.push(c1, rings[L] + k, rings[L] + nx(k)); }

  const taper = (Math.atan2(rt - rb, H) * 180) / Math.PI;
  if (taper > 35) issues.push({ level: 'warning', msg: `La pared se abre ${taper.toFixed(0)}° hacia afuera: en modo vaso conviene no pasar de 30–35°.` });
  if (Math.min(rb, rt) < 25) issues.push({ level: 'info', msg: 'Con una boca tan chica puede costar meter la vela o el portalámparas.' });
  issues.push({ level: 'info', msg: 'Se descarga como un sólido: en el laminador activá "modo vaso" (Spiral vase) y poné 0 capas inferiores para que quede abierta abajo. Una línea de 0,6–0,8 mm deja la pared más firme.' });
  lightNote(issues);
  return { parts: [part('body', 'Pantalla', p.color, geometryFromMesh(V, Tr))], issues };
}
