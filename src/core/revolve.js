// Sólidos de revolución alrededor de un eje vertical (Z), cerrados y aptos para imprimir.
import { geometryFromMesh } from './mesh.js';

/**
 * profile: polígono cerrado en el plano (r, z), sin repetir el primer punto.
 * Los puntos con r = 0 quedan sobre el eje (un solo vértice).
 */
export function revolve(profile, cx = 0, cy = 0, seg = 48) {
  const verts = [], ids = [];
  for (const [r, z] of profile) {
    if (r < 1e-6) { ids.push([verts.length]); verts.push([cx, cy, z]); continue; }
    const ring = [];
    for (let j = 0; j < seg; j++) {
      const a = (j / seg) * Math.PI * 2;
      ring.push(verts.length); verts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z]);
    }
    ids.push(ring);
  }
  const tris = [];
  const n = profile.length;
  for (let i = 0; i < n; i++) {
    const A = ids[i], B = ids[(i + 1) % n];
    if (A.length === 1 && B.length === 1) continue;
    for (let j = 0; j < seg; j++) {
      const j2 = (j + 1) % seg;
      if (A.length === 1) tris.push(A[0], B[j], B[j2]);
      else if (B.length === 1) tris.push(A[j], B[0], A[j2]);
      else tris.push(A[j], B[j], B[j2], A[j], B[j2], A[j2]);
    }
  }
  // Normales hacia afuera: si el volumen sale negativo, se invierten los triángulos
  let vol = 0;
  for (let t = 0; t < tris.length; t += 3) {
    const [a, b, c] = [verts[tris[t]], verts[tris[t + 1]], verts[tris[t + 2]]];
    vol += a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
  }
  if (vol < 0) for (let t = 0; t < tris.length; t += 3) [tris[t + 1], tris[t + 2]] = [tris[t + 2], tris[t + 1]];
  return geometryFromMesh(verts, tris);
}

/** Recorta un perfil (r, z) a la franja z0 ≤ z ≤ z1 (Sutherland–Hodgman). */
export function clipProfile(profile, z0, z1) {
  const clip = (pts, keep, zc) => {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const ia = keep(a[1]), ib = keep(b[1]);
      if (ia) out.push(a);
      if (ia !== ib) { const t = (zc - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, zc]); }
    }
    return out;
  };
  let p = clip(profile, (z) => z >= z0 - 1e-9, z0);
  p = clip(p, (z) => z <= z1 + 1e-9, z1);
  // Quitar puntos repetidos
  return p.filter((q, i) => { const r = p[(i + 1) % p.length]; return Math.hypot(q[0] - r[0], q[1] - r[1]) > 1e-6; });
}
