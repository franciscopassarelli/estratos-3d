// Kernel 2D: todas las piezas se describen como "regiones" (listas de anillos en mm)
// y se combinan con operaciones booleanas robustas (Clipper) antes de extruirse.
import ClipperLib from 'clipper-lib';
import * as THREE from 'three';

const SCALE = 1000; // 1 unidad Clipper = 1 µm
const { ClipType, PolyType, PolyFillType, JoinType, EndType } = ClipperLib;

const toC = (ring) => ring.map((p) => ({ X: Math.round(p.x * SCALE), Y: Math.round(p.y * SCALE) }));
const fromC = (path) => path.map((p) => ({ x: p.X / SCALE, y: p.Y / SCALE }));

function run(type, subject, clip) {
  const c = new ClipperLib.Clipper();
  c.StrictlySimple = true;
  c.AddPaths(subject.filter((r) => r.length > 2).map(toC), PolyType.ptSubject, true);
  if (clip) c.AddPaths(clip.filter((r) => r.length > 2).map(toC), PolyType.ptClip, true);
  const out = new ClipperLib.Paths();
  c.Execute(type, out, PolyFillType.pftNonZero, PolyFillType.pftNonZero);
  return ClipperLib.Clipper.CleanPolygons(out, 2).filter((p) => p.length > 2).map(fromC);
}

/** Une cualquier cantidad de regiones. */
export const union = (...regions) => run(ClipType.ctUnion, regions.flat());
export const difference = (a, b) => run(ClipType.ctDifference, a, b);
export const intersection = (a, b) => run(ClipType.ctIntersection, a, b);

/** Desplaza el contorno de una región (delta positivo = crecer). */
export function offset(region, delta, join = 'round') {
  if (!region.length) return [];
  const co = new ClipperLib.ClipperOffset(2, 0.02 * SCALE);
  const jt = join === 'miter' ? JoinType.jtMiter : join === 'square' ? JoinType.jtSquare : JoinType.jtRound;
  co.AddPaths(union(region).map(toC), jt, EndType.etClosedPolygon);
  const out = new ClipperLib.Paths();
  co.Execute(out, delta * SCALE);
  return union(out.map(fromC));
}

/** Convierte una polilínea abierta en una franja de ancho dado (trazo con extremos redondeados). */
export function stroke(points, width, cap = 'round') {
  const co = new ClipperLib.ClipperOffset(2, 0.02 * SCALE);
  co.AddPath(toC(points), JoinType.jtRound, cap === 'round' ? EndType.etOpenRound : EndType.etOpenButt);
  const out = new ClipperLib.Paths();
  co.Execute(out, (width / 2) * SCALE);
  return union(out.map(fromC));
}

/** Área neta (mm²) de una región. */
export function area(region) {
  return Math.abs(union(region).reduce((s, r) => s + ClipperLib.Clipper.Area(toC(r)), 0)) / (SCALE * SCALE);
}

export function bbox(region) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of region) for (const p of r) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  if (minX === Infinity) return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0, cx: 0, cy: 0 };
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

export const translate = (region, dx, dy) => region.map((r) => r.map((p) => ({ x: p.x + dx, y: p.y + dy })));
export const scale = (region, s, sy = s) => region.map((r) => r.map((p) => ({ x: p.x * s, y: p.y * sy })));
export const center = (region) => { const b = bbox(region); return translate(region, -b.cx, -b.cy); };

/**
 * Detecta trazos más finos que `minWidth` mediante una apertura morfológica
 * (erosión + dilatación). Devuelve la fracción de área que se perdería.
 */
export function thinFraction(region, minWidth) {
  const a = area(region);
  if (a < 1e-6) return 0;
  const opened = offset(offset(region, -minWidth / 2), minWidth / 2);
  return Math.max(0, (a - area(opened)) / a);
}

/** Cantidad de islas (contornos exteriores) de una región. */
export function islandCount(region) {
  return toShapes(region).length;
}

/** Región -> THREE.Shape[] respetando agujeros e islas dentro de agujeros. */
export function toShapes(region) {
  const c = new ClipperLib.Clipper();
  c.StrictlySimple = true;
  c.AddPaths(region.filter((r) => r.length > 2).map(toC), PolyType.ptSubject, true);
  const tree = new ClipperLib.PolyTree();
  c.Execute(ClipType.ctUnion, tree, PolyFillType.pftNonZero, PolyFillType.pftNonZero);
  const shapes = [];
  const vec = (path) => fromC(path).map((p) => new THREE.Vector2(p.x, p.y));
  const walk = (node) => {
    for (const outer of node.Childs()) {
      if (outer.Contour().length < 3) continue;
      const shape = new THREE.Shape(vec(outer.Contour()));
      for (const hole of outer.Childs()) {
        if (hole.Contour().length >= 3) shape.holes.push(new THREE.Path(vec(hole.Contour())));
        walk(hole);
      }
      shapes.push(shape);
    }
  };
  walk(tree);
  return shapes;
}

// ---------- Primitivas ----------
export function circle(cx, cy, r, seg = 48) {
  const pts = [];
  for (let i = 0; i < seg; i++) { const a = (i / seg) * Math.PI * 2; pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }); }
  return [pts];
}
export function ellipse(cx, cy, rx, ry, seg = 72) {
  const pts = [];
  for (let i = 0; i < seg; i++) { const a = (i / seg) * Math.PI * 2; pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry }); }
  return [pts];
}
export function rect(cx, cy, w, h) {
  return [[{ x: cx - w / 2, y: cy - h / 2 }, { x: cx + w / 2, y: cy - h / 2 }, { x: cx + w / 2, y: cy + h / 2 }, { x: cx - w / 2, y: cy + h / 2 }]];
}
export function roundedRect(cx, cy, w, h, r, segPerCorner = 10) {
  r = Math.max(0, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3));
  if (r < 0.01) return rect(cx, cy, w, h);
  const pts = [];
  const corners = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 90], [-w / 2 + r, -h / 2 + r, 180], [w / 2 - r, -h / 2 + r, 270]];
  for (const [x, y, a0] of corners) {
    for (let i = 0; i <= segPerCorner; i++) {
      const a = ((a0 + (90 * i) / segPerCorner) * Math.PI) / 180;
      pts.push({ x: cx + x + Math.cos(a) * r, y: cy + y + Math.sin(a) * r });
    }
  }
  return [pts];
}
export function chamferRect(cx, cy, w, h, c) {
  c = Math.min(c, w / 2 - 0.1, h / 2 - 0.1);
  const x = w / 2, y = h / 2;
  return [[[x - c, -y], [x, -y + c], [x, y - c], [x - c, y], [-x + c, y], [-x, y - c], [-x, -y + c], [-x + c, -y]].map(([a, b]) => ({ x: cx + a, y: cy + b }))];
}
export function regularPolygon(cx, cy, r, n, rot = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = rot + (i / n) * Math.PI * 2; pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }); }
  return [pts];
}

/** Región -> atributo `d` de SVG (para iconos generados con la misma geometría). */
export function toSvgPath(region, size = 24, pad = 2) {
  const b = bbox(region);
  const s = (size - pad * 2) / Math.max(b.w, b.h, 1e-6);
  const ox = pad + ((size - pad * 2) - b.w * s) / 2, oy = pad + ((size - pad * 2) - b.h * s) / 2;
  return union(region).map((r) => 'M' + r.map((p) => `${((p.x - b.minX) * s + ox).toFixed(2)} ${((b.maxY - p.y) * s + oy).toFixed(2)}`).join('L') + 'Z').join('');
}
