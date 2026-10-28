// Comprobaciones de la malla generada: cierre (manifold), orientación de caras,
// volumen, voladizos y piezas sin apoyo. Trabaja sobre las geometrías finales.
import { PRINT } from './palette.js';

/** Suelda vértices y devuelve una malla indexada { vertices: Float64Array, tris: Uint32Array }. */
export function weld(geometry, tol = 1e-4) {
  const pos = geometry.attributes.position.array;
  const n = pos.length / 3;
  const map = new Map();
  const verts = [];
  const remap = new Uint32Array(n);
  const q = 1 / tol;
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const key = Math.round(x * q) + ',' + Math.round(y * q) + ',' + Math.round(z * q);
    let id = map.get(key);
    if (id === undefined) { id = verts.length / 3; verts.push(x, y, z); map.set(key, id); }
    remap[i] = id;
  }
  const tris = [];
  for (let i = 0; i < n; i += 3) {
    const a = remap[i], b = remap[i + 1], c = remap[i + 2];
    if (a !== b && b !== c && a !== c) tris.push(a, b, c);
  }
  return { vertices: new Float64Array(verts), tris: new Uint32Array(tris) };
}

function find(parent, i) { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; }

export function analyzeParts(parts) {
  const shells = [];
  let openEdges = 0, badEdges = 0, volume = 0, triangles = 0;
  const meshes = [];
  const perPart = [];

  for (const part of parts) {
   let pOpen = 0, pBad = 0, partVol = 0, partTris = 0, partShells = 0;
   for (const geometry of part.volumes) {
    const m = weld(geometry);
    meshes.push({ ...m, protrusion: part.protrusion || 0, bridges: !!part.bridges });
    const { vertices: V, tris: T } = m;
    const nv = V.length / 3;
    triangles += T.length / 3;
    partTris += T.length / 3;
    const edges = new Map();
    for (let i = 0; i < T.length; i += 3) {
      for (let e = 0; e < 3; e++) {
        const a = T[i + e], b = T[i + ((e + 1) % 3)];
        const key = a < b ? a * nv + b : b * nv + a;
        const rec = edges.get(key);
        const dir = a < b ? 1 : -1;
        if (rec) { rec[0]++; rec[1] += dir; } else edges.set(key, [1, dir]);
      }
    }
    let vOpen = 0, vBad = 0;
    for (const [count, sum] of edges.values()) {
      if (count === 1) vOpen++;
      else if (count !== 2 || sum !== 0) vBad++;
    }
    pOpen += vOpen; pBad += vBad;
    openEdges += vOpen; badEdges += vBad;

    // Componentes conexas (cáscaras)
    const parent = new Uint32Array(nv).map((_, i) => i);
    for (let i = 0; i < T.length; i += 3) {
      const r0 = find(parent, T[i]);
      for (const v of [T[i + 1], T[i + 2]]) { const r = find(parent, v); if (r !== r0) parent[r] = r0; }
    }
    const byRoot = new Map();
    for (let i = 0; i < T.length; i += 3) {
      const root = find(parent, T[i]);
      let s = byRoot.get(root);
      if (!s) { s = { part: part.id, protrusion: part.protrusion || 0, minX: Infinity, minY: Infinity, minZ: Infinity, maxX: -Infinity, maxY: -Infinity, maxZ: -Infinity, volume: 0, upLevels: new Set() }; byRoot.set(root, s); }
      const ax = V[T[i] * 3], ay = V[T[i] * 3 + 1], az = V[T[i] * 3 + 2];
      const bx = V[T[i + 1] * 3], by = V[T[i + 1] * 3 + 1], bz = V[T[i + 1] * 3 + 2];
      const cx = V[T[i + 2] * 3], cy = V[T[i + 2] * 3 + 1], cz = V[T[i + 2] * 3 + 2];
      s.minX = Math.min(s.minX, ax, bx, cx); s.maxX = Math.max(s.maxX, ax, bx, cx);
      s.minY = Math.min(s.minY, ay, by, cy); s.maxY = Math.max(s.maxY, ay, by, cy);
      s.minZ = Math.min(s.minZ, az, bz, cz); s.maxZ = Math.max(s.maxZ, az, bz, cz);
      s.volume += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
      const nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      const len = Math.hypot((by - ay) * (cz - az) - (bz - az) * (cy - ay), (bz - az) * (cx - ax) - (bx - ax) * (cz - az), nz);
      if (len > 0 && nz / len > 0.999) s.upLevels.add(Math.round(az * 50));
    }
    for (const s of byRoot.values()) { shells.push(s); partVol += s.volume; }
    partShells += byRoot.size;
   }
    volume += partVol;
    perPart.push({ id: part.id, name: part.name, color: part.color, triangles: partTris, volumes: part.volumes.length, shells: partShells, closed: pOpen === 0 && pBad === 0, volume: partVol });
  }

  // Apoyo de cada cáscara: sobre la cama o en contacto con otra que esté más abajo.
  const touches = (a, b, e = 0.05) => a.minX <= b.maxX + e && a.maxX >= b.minX - e && a.minY <= b.maxY + e && a.maxY >= b.minY - e && a.minZ <= b.maxZ + e && a.maxZ >= b.minZ - e;
  let floating = 0;
  for (const s of shells) {
    if (s.minZ < 0.05) continue;
    if (!shells.some((o) => o !== s && o.minZ < s.minZ - 1e-3 && touches(s, o))) floating++;
  }

  // Voladizos > 45° que no estén apoyados en otra superficie
  let overhang = 0, shortOverhang = 0;
  meshes.forEach((m) => {
    const { vertices: V, tris: T } = m;
    const prot = m.protrusion;
    // Piezas con puentes declarados (techos horizontales cortos apoyados en ambos lados): no cuentan como voladizo.
    for (let i = 0; i < T.length; i += 3) {
      const a = T[i] * 3, b = T[i + 1] * 3, c = T[i + 2] * 3;
      const ux = V[b] - V[a], uy = V[b + 1] - V[a + 1], uz = V[b + 2] - V[a + 2];
      const vx = V[c] - V[a], vy = V[c + 1] - V[a + 1], vz = V[c + 2] - V[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const len = Math.hypot(nx, ny, nz);
      if (!len || nz / len > -0.7071) continue;
      const zc = (V[a + 2] + V[b + 2] + V[c + 2]) / 3;
      if (zc < 0.2) continue;
      if (m.bridges && nz / len < -0.999) continue;
      if (nz / len < -0.999) {
        const lvl = Math.round(zc * 50), xc = (V[a] + V[b] + V[c]) / 3, yc = (V[a + 1] + V[b + 1] + V[c + 1]) / 3;
        if (shells.some((s) => s.upLevels.has(lvl) && xc >= s.minX && xc <= s.maxX && yc >= s.minY && yc <= s.maxY)) continue;
      }
      if (prot && prot <= 2) shortOverhang += len / 2; else overhang += len / 2;
    }
  });

  let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const s of shells) {
    minX = Math.min(minX, s.minX); minY = Math.min(minY, s.minY); minZ = Math.min(minZ, s.minZ);
    maxX = Math.max(maxX, s.maxX); maxY = Math.max(maxY, s.maxY); maxZ = Math.max(maxZ, s.maxZ);
  }
  const dims = { x: maxX - minX, y: maxY - minY, z: maxZ - minZ };
  const filamentArea = Math.PI * (PRINT.filamentDiameter / 2) ** 2;
  return {
    dims, triangles, shells: shells.length, openEdges, badEdges, closed: openEdges === 0 && badEdges === 0,
    volume, grams: (volume / 1000) * PRINT.plaDensity, filamentMeters: volume / filamentArea / 1000,
    overhang, shortOverhang, floating, perPart,
    fitsBed: dims.x <= PRINT.bed.x && dims.y <= PRINT.bed.y && dims.z <= PRINT.bed.z,
  };
}

/** Convierte el análisis en mensajes para el usuario. */
export function analysisIssues(a) {
  const out = [];
  if (!a.closed) out.push({ level: 'error', msg: `La malla no es cerrada (${a.openEdges} aristas abiertas, ${a.badEdges} inconsistentes). El laminador podría repararla o fallar.` });
  if (a.volume <= 0) out.push({ level: 'error', msg: 'El volumen calculado no es positivo: las caras están invertidas.' });
  if (a.floating) out.push({ level: 'error', msg: `${a.floating} pieza(s) no se apoyan en la cama ni en otra parte del modelo.` });
  if (a.overhang > 25) out.push({ level: 'warning', msg: `Necesitará soportes: hay unos ${Math.round(a.overhang)} mm² de superficie con voladizos de más de 45°.` });
  else if (a.overhang > 2) out.push({ level: 'info', msg: `Hay voladizos pequeños (${Math.round(a.overhang)} mm²); suelen imprimirse sin soportes.` });
  if (a.shortOverhang > 0) out.push({ level: 'info', msg: 'El relieve vertical tiene voladizos cortos (≤ 2 mm) que normalmente se imprimen sin soportes.' });
  if (!a.fitsBed) out.push({ level: 'warning', msg: `Mide más que una cama de ${PRINT.bed.x} × ${PRINT.bed.y} × ${PRINT.bed.z} mm. Verificá el tamaño de tu impresora.` });
  return out;
}
