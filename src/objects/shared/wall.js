// Pared con huecos «desenrollada» (x = recorrido, y = altura) y su mapeo a un cilindro o prisma.
// La usa el servilletero navideño.
import * as THREE from 'three';
import { toShapes, intersection } from '../../core/geometry2d.js';
import { geometryFromMesh, fixTJunctions } from '../../core/mesh.js';

const TAU = Math.PI * 2;

// ---------- Mapeo de la pared "desenrollada" (x = recorrido, y = altura) al cilindro o prisma ----------
export function makeMapper(shape, sides, apothemMid, C) {
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
export function wallMesh(region, C, H, w, cuts, map) {
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
