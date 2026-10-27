// Cartel de mesa con base: placa plana (se imprime acostada, a dos colores) que se
// encastra en una base con ranura inclinada. Lo usan el display QR y el cartel Wi-Fi.
import * as THREE from 'three';
import { union, difference, offset, bbox, translate, scale, area, roundedRect, rect, thinFraction } from '../../core/geometry2d.js';
import { extrudeRegion, part } from '../../core/mesh.js';
import { qrRegion } from '../../core/qr.js';
import { PRINT } from '../../core/palette.js';

const rad = (d) => (d * Math.PI) / 180;

/** Ítems de controles comunes a los carteles con base. */
export const signSizeItems = [
  { key: 'width', type: 'range', label: 'Ancho del cartel', min: 70, max: 200, step: 1, unit: 'mm' },
  { key: 'height', type: 'range', label: 'Alto del cartel', min: 90, max: 220, step: 1, unit: 'mm' },
  { key: 'thickness', type: 'range', label: 'Grosor de la placa', min: 2.4, max: 5, step: 0.1, unit: 'mm' },
  { key: 'relief', type: 'range', label: 'Relieve del QR y los textos', min: 0.6, max: 1.6, step: 0.1, unit: 'mm' },
  { key: 'border', type: 'range', label: 'Marco', min: 0, max: 5, step: 0.5, unit: 'mm', help: '0 = sin marco' },
];
export const signBaseItems = [
  { key: 'lean', type: 'range', label: 'Inclinación hacia atrás', min: 0, max: 25, step: 1, unit: '°' },
  { key: 'baseDepth', type: 'range', label: 'Profundidad de la base', min: 30, max: 80, step: 1, unit: 'mm' },
  { key: 'clearance', type: 'range', label: 'Holgura de la ranura', min: 0.1, max: 0.8, step: 0.05, unit: 'mm', help: 'Si queda floja, bajala; si no entra, subila' },
];
export const signViews = [{ id: 'assembled', label: 'Armado' }];
export const signOrientations = [{ id: 'flat', label: 'Placa acostada y base al lado', hint: 'Sin soportes; el QR y los textos en la cara de arriba' }];

/**
 * blocks: [{ kind: 'region', region, maxH?, gap } | { kind: 'qr', payload, gap }]
 * Apila los bloques de arriba hacia abajo en la cara útil de la placa.
 */
export function buildSign(p, blocks, orientationId, issues) {
  const W = p.width, H = p.height, T = p.thickness, R = p.relief;
  const insert = Math.min(12, H * 0.12); // parte de la placa que queda dentro de la ranura
  const margin = Math.max(p.border + 4, 6);
  const top = H / 2 - margin, bottom = -H / 2 + insert + margin * 0.6;
  const availH = top - bottom, availW = W - 2 * margin;

  // QR: tamaño máximo que entra a lo ancho dejando zona de silencio de 2 módulos
  const qrBlock = blocks.find((b) => b.kind === 'qr');
  let qr = null;
  const fixedH = blocks.filter((b) => b.kind !== 'qr').reduce((s, b) => s + bbox(b.region).h + (b.gap || 0), 0) + (qrBlock?.gap || 0);
  if (qrBlock) {
    let size = Math.min(p.qrSize, availW, availH - fixedH);
    try {
      let probe = qrRegion(qrBlock.payload, 100, p.ecc || 'M');
      const quiet = 4 * (size / probe.n); // 2 módulos por lado
      size = Math.min(p.qrSize, availW - quiet, availH - fixedH - quiet);
      if (size < 20) {
        issues.push({ level: 'error', msg: 'No hay lugar para el código QR. Agrandá el cartel o achicá los textos.' });
        return { parts: [], issues };
      }
      if (size < p.qrSize - 0.5) issues.push({ level: 'info', msg: `El QR se ajustó a ${size.toFixed(0)} mm para que entre en el cartel con su margen.` });
      qr = qrRegion(qrBlock.payload, size, p.ecc || 'M');
      qrBlock.region = qr.region;
      qrBlock.quiet = 2 * qr.module;
    } catch (e) {
      issues.push({ level: 'error', msg: e.tooLong ? 'El contenido es demasiado largo para el código QR. Acortá el enlace o el texto.' : 'No se pudo generar el código QR.' });
      return { parts: [], issues };
    }
  }

  // Ajuste de textos al ancho y apilado vertical centrado
  const placed = [];
  let total = 0;
  for (const b of blocks) {
    let r = b.region;
    if (!r || !r.length) continue;
    let bb = bbox(r);
    const maxW = b.kind === 'qr' ? Infinity : availW;
    if (bb.w > maxW) { const s = maxW / bb.w; r = scale(r, s); bb = bbox(r); if (b.label) issues.push({ level: 'info', msg: `${b.label} se achicó al ${Math.round(s * 100)} % para entrar a lo ancho.` }); }
    const q = b.quiet || 0;
    placed.push({ r: translate(r, -bb.cx, -bb.cy), h: bb.h, gap: b.gap || 0, quiet: q, kind: b.kind });
    total += bb.h + 2 * q + (placed.length > 1 ? b.gap || 0 : 0);
  }
  if (total > availH + 0.01) {
    issues.push({ level: 'error', msg: 'El contenido no entra a lo alto. Agrandá el cartel, achicá el QR o los textos.' });
    return { parts: [], issues };
  }
  let y = (top + bottom) / 2 + total / 2;
  const content = [];
  placed.forEach((b, i) => {
    if (i > 0) y -= b.gap;
    y -= b.quiet;
    content.push(translate(b.r, 0, y - b.h / 2));
    y -= b.h + b.quiet;
  });
  const art = union(...content);

  if (qr) {
    if (qr.module < 1) issues.push({ level: 'warning', msg: `Cada módulo del QR mide ${qr.module.toFixed(2)} mm: puede costar leerlo. Agrandá el QR o acortá el contenido (ideal: más de 1,2 mm).` });
    else issues.push({ level: 'ok', msg: `QR de ${(qr.module * qr.n).toFixed(0)} mm con módulos de ${qr.module.toFixed(2)} mm: se puede escanear hasta a unos ${Math.round(qr.module * qr.n)} cm.` });
  }
  const thin = thinFraction(difference(art, qr ? qr.region : []), PRINT.minFeature);
  if (thin > 0.08) issues.push({ level: 'warning', msg: 'Algunos trazos de texto miden menos de 0,8 mm. Usá letras más grandes o una tipografía más gruesa.' });

  const plate = roundedRect(0, 0, W, H, Math.min(8, W / 10), 10);
  const frame = p.border > 0 ? difference(plate, offset(plate, -p.border)) : [];
  // El marco no baja hasta la zona que entra en la ranura
  const frameCut = frame.length ? difference(frame, rect(0, -H / 2 + insert / 2, W + 2, insert + 0.01)) : [];
  if (p.border > 0 && p.border < PRINT.minWall) issues.push({ level: 'warning', msg: 'El marco es muy fino para imprimirse firme.' });

  const plateGeo = extrudeRegion(plate, 0, T);
  const artGeo = extrudeRegion(union(art, frameCut), T, T + R);

  // ---- Base con ranura (perfil en y-z, extruido a lo largo de x)
  const a = rad(p.lean), Db = p.baseDepth;
  const slotW = T + p.clearance;
  const slotDepth = insert;
  const Hb = Math.max(10, slotDepth * Math.cos(a) + 3);
  const Lb = Math.max(60, Math.min(W - 10, W * 0.85));
  const u = { y: Math.sin(a), z: Math.cos(a) }, n = { y: Math.cos(a), z: -Math.sin(a) };
  const yTop = -Db * 0.08; // la ranura un poco adelante del centro: el peso del cartel cae sobre la base
  const S0 = { y: yTop - slotDepth * u.y, z: Hb - slotDepth * u.z };
  const ext = slotDepth + 6;
  const slot = [[
    { x: S0.y - n.y * slotW / 2, y: S0.z - n.z * slotW / 2 },
    { x: S0.y + n.y * slotW / 2, y: S0.z + n.z * slotW / 2 },
    { x: S0.y + n.y * slotW / 2 + u.y * ext, y: S0.z + n.z * slotW / 2 + u.z * ext },
    { x: S0.y - n.y * slotW / 2 + u.y * ext, y: S0.z - n.z * slotW / 2 + u.z * ext },
  ]];
  const ch = Math.min(4, Hb / 3);
  const profile = [[
    { x: -Db / 2, y: 0 }, { x: Db / 2, y: 0 }, { x: Db / 2, y: Hb - ch }, { x: Db / 2 - ch, y: Hb }, { x: -Db / 2 + ch, y: Hb }, { x: -Db / 2, y: Hb - ch },
  ]];
  const baseRegion = difference(profile, slot);
  const baseGeo = extrudeRegion(baseRegion, -Lb / 2, Lb / 2);
  // (a, b, c) -> (x = c, y = a, z = b): permutación cíclica, conserva las normales
  baseGeo?.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  if (Db < Hb + T * 3) issues.push({ level: 'warning', msg: 'La base es poco profunda para este cartel: podría volcarse.' });
  const tip = (H / 2) * Math.sin(a) + yTop;
  if (tip > Db / 2 + 5) issues.push({ level: 'warning', msg: 'Con tanta inclinación, el cartel sobresale por detrás de la base y puede volcarse. Aumentá la profundidad de la base.' });
  if (W > Lb + 50) issues.push({ level: 'info', msg: 'El cartel es mucho más ancho que la base: conviene una base más profunda.' });

  const plateGeos = [plateGeo];
  if (orientationId === 'assembled') {
    // Placa de pie dentro de la ranura (solo para mirar)
    const theta = Math.PI / 2 - a;
    const m = new THREE.Matrix4().makeRotationX(theta);
    const P = { y: (-H / 2) * u.y + (T / 2) * -n.y, z: (-H / 2) * u.z + (T / 2) * -n.z };
    m.premultiply(new THREE.Matrix4().makeTranslation(0, S0.y - P.y, S0.z - P.z + 0.01));
    plateGeo?.applyMatrix4(m); artGeo?.applyMatrix4(m);
  } else {
    const dy = H / 2 + Db / 2 + 8;
    plateGeo?.translate(0, dy / 2, 0); artGeo?.translate(0, dy / 2, 0);
    baseGeo?.translate(0, -dy / 2, 0);
  }

  const parts = [
    part('plate', 'Placa', p.colorBase, plateGeos),
    part('art', 'QR y textos', p.colorArt, artGeo, { focus: true }),
    part('base', 'Base', p.colorStand, baseGeo),
  ].filter(Boolean);
  return { parts, issues, insert };
}

/** Texto en una línea con tamaño de mayúsculas `h` (región centrada). */
export function lineRegion(textRegion, str, font, h) {
  const s = (str || '').trim();
  if (!s) return { region: [], missing: [] };
  return textRegion(s, font, h);
}

/** Ícono de Wi-Fi: tres arcos y un punto. */
export function wifiIcon(h) {
  const pts = (r) => { const out = []; for (let i = 0; i <= 24; i++) { const t = rad(45 + (90 * i) / 24); out.push({ x: Math.cos(t) * r, y: Math.sin(t) * r }); } return out; };
  const w = h * 0.13;
  const arcs = [0.42, 0.7, 0.98].map((k) => strokeArc(pts(k * h), w));
  const dot = roundedRect(0, w * 0.9, w * 1.8, w * 1.8, w * 0.9, 8);
  return union(...arcs, dot);
}

import { stroke } from '../../core/geometry2d.js';
function strokeArc(points, w) { return stroke(points, w); }

export { area };
