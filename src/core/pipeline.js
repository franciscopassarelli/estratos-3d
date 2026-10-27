// Une parámetros -> geometría -> orientación -> análisis. La vista previa y los
// exportadores usan exactamente el mismo resultado, así nunca se desincronizan.
import * as THREE from 'three';
import { analyzeParts, analysisIssues } from './analysis.js';

export function allItems(def) {
  return def.sections.flatMap((s) => s.items);
}

/** Valida y normaliza los parámetros según el esquema del objeto. */
export function sanitize(def, input) {
  const p = { ...def.defaults, ...input };
  for (const it of allItems(def)) {
    const v = p[it.key];
    if (it.type === 'range' || it.type === 'stepper') {
      let n = Number(v);
      if (!Number.isFinite(n)) n = def.defaults[it.key];
      n = Math.min(it.max, Math.max(it.min, n));
      if (it.type === 'stepper') n = Math.round(n);
      p[it.key] = n;
    } else if (it.type === 'text') {
      p[it.key] = String(v ?? '').replace(/[\u0000-\u001f]/g, '').slice(0, it.maxLength || 40);
    } else if (it.type === 'color') {
      p[it.key] = /^#[0-9a-f]{6}$/i.test(v) ? v : def.defaults[it.key];
    } else if (it.type === 'toggle') {
      p[it.key] = !!v;
    } else if (it.options && !it.options.some((o) => o.value === v)) {
      p[it.key] = def.defaults[it.key];
    }
  }
  return p;
}

export function orientationMatrix(def, orientationId) {
  const o = (def.orientations || []).find((x) => x.id === orientationId) || (def.orientations || [])[0];
  return o && o.matrix ? o.matrix : null;
}

/** Aplica la orientación, apoya el modelo en z = 0 y lo centra en XY. */
export function placeParts(parts, matrix) {
  const box = new THREE.Box3();
  for (const pt of parts) for (const g of pt.volumes) {
    if (matrix) g.applyMatrix4(matrix);
    g.computeBoundingBox();
    box.union(g.boundingBox);
  }
  if (box.isEmpty()) return;
  const c = box.getCenter(new THREE.Vector3());
  for (const pt of parts) for (const g of pt.volumes) { g.translate(-c.x, -c.y, -box.min.z); g.computeBoundingBox(); }
}

export function buildModel(def, rawParams, orientationId) {
  const params = sanitize(def, rawParams);
  const t0 = performance.now();
  let result;
  try {
    result = def.build(params);
  } catch (err) {
    console.error(err);
    return { def, params, parts: [], issues: [{ level: 'error', msg: 'No se pudo generar la geometría con estos valores. Probá con medidas más moderadas o restablecé el diseño.' }], analysis: null, ms: 0 };
  }
  const parts = result.parts;
  placeParts(parts, orientationMatrix(def, orientationId));
  const analysis = parts.length ? analyzeParts(parts) : null;
  const issues = [...result.issues, ...(analysis ? analysisIssues(analysis) : [])];
  return { def, params, orientation: orientationId, parts, issues, analysis, ms: performance.now() - t0 };
}

export function statusOf(model) {
  if (!model.parts.length || model.issues.some((i) => i.level === 'error')) return 'error';
  if (model.issues.some((i) => i.level === 'warning')) return 'warning';
  return 'ok';
}

export function disposeModel(model) {
  model?.parts?.forEach((p) => p.volumes.forEach((g) => g.dispose()));
}
