// Texto -> región 2D. Usa tipografías libres (SIL OFL) convertidas a formato typeface.
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import archivo from '../fonts/archivo.js';
import pacifico from '../fonts/pacifico.js';
import bungee from '../fonts/bungee.js';
import titan from '../fonts/titan.js';
import { union, difference, bbox, translate } from './geometry2d.js';

export const FONTS = [
  { id: 'archivo', label: 'Archivo Black', css: "'Archivo Black', sans-serif", note: 'Sólida y legible', data: archivo },
  { id: 'titan', label: 'Titan One', css: "'Titan One', sans-serif", note: 'Redondeada', data: titan },
  { id: 'pacifico', label: 'Pacifico', css: "'Pacifico', cursive", note: 'Cursiva unida', data: pacifico },
  { id: 'bungee', label: 'Bungee', css: "'Bungee', sans-serif", note: 'Cartelería', data: bungee },
];

const fontCache = new Map();
function getFont(id) {
  const def = FONTS.find((f) => f.id === id) || FONTS[0];
  if (!fontCache.has(def.id)) {
    const font = new Font(def.data);
    const ref = shapesToRegion(font.generateShapes('H', 1), 4);
    fontCache.set(def.id, { font, capRatio: bbox(ref).h || 0.7 });
  }
  return fontCache.get(def.id);
}

function shapesToRegion(shapes, curveSegments) {
  const parts = [];
  for (const s of shapes) {
    const { shape, holes } = s.extractPoints(curveSegments);
    const outer = [shape.map((v) => ({ x: v.x, y: v.y }))];
    const hs = holes.map((h) => h.map((v) => ({ x: v.x, y: v.y })));
    // Restar los agujeros explícitamente evita depender del sentido de giro de cada fuente.
    parts.push(hs.length ? difference(outer, hs) : union(outer));
  }
  return union(...parts);
}

/** Caracteres que la tipografía no puede dibujar. */
export function unsupportedChars(str, fontId) {
  const { font } = getFont(fontId);
  const missing = new Set();
  for (const ch of str) if (ch !== '\n' && ch !== ' ' && !font.data.glyphs[ch]) missing.add(ch);
  return [...missing];
}

/**
 * Genera la región de un texto (una o varias líneas) centrada en el origen.
 * capHeight = altura de las mayúsculas en mm.
 */
export function textRegion(str, fontId, capHeight, { lineGap = 0.55, curveSegments = 6 } = {}) {
  const { font, capRatio } = getFont(fontId);
  const missing = unsupportedChars(str, fontId);
  const clean = [...str].filter((ch) => !missing.includes(ch)).join('');
  const size = capHeight / capRatio;
  const lines = clean.split('\n');
  const lineStep = capHeight * (1 + lineGap);
  let all = [];
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    let r = shapesToRegion(font.generateShapes(line, size), curveSegments);
    if (!r.length) return;
    const b = bbox(r);
    r = translate(r, -b.cx, -i * lineStep);
    all.push(r);
  });
  let region = all.length ? union(...all) : [];
  const b = bbox(region);
  region = translate(region, -b.cx, -b.cy);
  return { region, missing, size };
}
