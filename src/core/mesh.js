// Región 2D -> sólidos 3D (mm, eje Z hacia arriba).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { toShapes } from './geometry2d.js';

/** Extruye una región entre z0 y z1. Devuelve una geometría solo con posiciones (o null si está vacía). */
export function extrudeRegion(region, z0, z1) {
  const shapes = toShapes(region);
  if (!shapes.length || z1 - z0 <= 1e-4) return null;
  const g = new THREE.ExtrudeGeometry(shapes, { depth: z1 - z0, bevelEnabled: false, curveSegments: 1, steps: 1 });
  g.translate(0, 0, z0);
  return fixTJunctions(positionsOnly(g));
}

/**
 * Repara uniones en T: cuando el triangulador apoya una arista sobre vértices
 * intermedios (pasa si un agujero comparte una línea con el contorno), la malla
 * queda abierta. Se subdivide cada triángulo afectado para que vuelva a ser cerrada.
 */
export function fixTJunctions(geometry, tol = 1e-4) {
  const pos = geometry.attributes.position.array;
  const q = 1 / tol, map = new Map(), V = [], T = [];
  for (let i = 0; i < pos.length; i += 3) {
    const key = Math.round(pos[i] * q) + ',' + Math.round(pos[i + 1] * q) + ',' + Math.round(pos[i + 2] * q);
    let id = map.get(key);
    if (id === undefined) { id = V.length; V.push([pos[i], pos[i + 1], pos[i + 2]]); map.set(key, id); }
    T.push(id);
  }
  const nv = V.length, edges = new Map();
  const ek = (a, b) => (a < b ? a * nv + b : b * nv + a);
  for (let i = 0; i < T.length; i += 3) for (let k = 0; k < 3; k++) { const key = ek(T[i + k], T[i + ((k + 1) % 3)]); edges.set(key, (edges.get(key) || 0) + 1); }
  const openVerts = new Set();
  for (const [key, c] of edges) if (c === 1) { openVerts.add(Math.floor(key / nv)); openVerts.add(key % nv); }
  if (!openVerts.size) return geometry;
  const cand = [...openVerts];
  const out = [];
  for (let i = 0; i < T.length; i += 3) {
    const tri = [T[i], T[i + 1], T[i + 2]];
    let done = false;
    for (let k = 0; k < 3 && !done; k++) {
      const a = tri[k], b = tri[(k + 1) % 3], c = tri[(k + 2) % 3];
      if (edges.get(ek(a, b)) !== 1) continue;
      const A = V[a], B = V[b];
      const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L2 = d[0] ** 2 + d[1] ** 2 + d[2] ** 2;
      if (L2 < 1e-12) continue;
      const mids = [];
      for (const v of cand) {
        if (v === a || v === b) continue;
        const P = V[v], w = [P[0] - A[0], P[1] - A[1], P[2] - A[2]];
        const t = (w[0] * d[0] + w[1] * d[1] + w[2] * d[2]) / L2;
        if (t <= 1e-6 || t >= 1 - 1e-6) continue;
        const dx = w[0] - t * d[0], dy = w[1] - t * d[1], dz = w[2] - t * d[2];
        if (dx * dx + dy * dy + dz * dz < tol * tol) mids.push([t, v]);
      }
      if (!mids.length) continue;
      mids.sort((m, n) => m[0] - n[0]);
      const chain = [a, ...mids.map((m) => m[1]), b];
      // La subdivisión de un lado puede dejar otro lado con uniones en T: se reprocesa.
      for (let j = 0; j < chain.length - 1; j++) out.push(chain[j], chain[j + 1], c);
      done = true;
    }
    if (!done) out.push(...tri);
  }
  const arr = new Float32Array(out.length * 3);
  out.forEach((v, j) => { arr[j * 3] = V[v][0]; arr[j * 3 + 1] = V[v][1]; arr[j * 3 + 2] = V[v][2]; });
  geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  return out.length !== T.length ? fixTJunctions(geometry, tol) : geometry;
}

export function positionsOnly(g) {
  const out = new THREE.BufferGeometry();
  const src = g.index ? g.toNonIndexed() : g;
  out.setAttribute('position', src.getAttribute('position').clone());
  g.dispose();
  return out;
}

export function merge(geoms) {
  const list = geoms.filter(Boolean);
  if (!list.length) return null;
  if (list.length === 1) return list[0];
  const m = mergeGeometries(list, false);
  list.forEach((g) => g.dispose());
  return m;
}

/** Crea una pieza del modelo. Cada pieza = un color / un componente en el 3MF. */
// Una pieza puede tener varios volúmenes cerrados que se tocan (p. ej. base + capa superior grabada).
// Cada volumen es una malla cerrada por sí misma; el 3MF los agrupa como componentes.
export function part(id, name, color, geometries, extra = {}) {
  const volumes = (Array.isArray(geometries) ? geometries : [geometries]).filter(Boolean);
  return volumes.length ? { id, name, color, volumes, ...extra } : null;
}

/** Geometría construida a mano desde vértices y triángulos (índices). */
export function geometryFromMesh(vertices, triangles) {
  const pos = new Float32Array(triangles.length * 3);
  for (let i = 0; i < triangles.length; i++) {
    const v = vertices[triangles[i]];
    pos[i * 3] = v[0]; pos[i * 3 + 1] = v[1]; pos[i * 3 + 2] = v[2];
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return g;
}
