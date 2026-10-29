import { union, difference, intersection, offset, bbox, translate, scale, circle, roundedRect, regularPolygon, stroke, rect, thinFraction } from '../core/geometry2d.js';
import { textRegion } from '../core/text.js';
import { extrudeRegion, part } from '../core/mesh.js';
import { PRINT } from '../core/palette.js';

function outline(shape, D) {
  if (shape === 'square') return roundedRect(0, 0, D, D, D * 0.12, 12);
  if (shape === 'hex') return offset(regularPolygon(0, 0, D / 2 - 3, 6, Math.PI / 6), 3);
  return circle(0, 0, D / 2, 128);
}

function pattern(kind, area, s, lw) {
  const b = bbox(area);
  const R = Math.hypot(b.w, b.h) / 2 + s;
  let lines = [];
  if (kind === 'hex') {
    const r = s / Math.sqrt(3);
    const cells = [];
    for (let row = -Math.ceil(R / (1.5 * r)); row <= Math.ceil(R / (1.5 * r)); row++) {
      for (let col = -Math.ceil(R / s) - 1; col <= Math.ceil(R / s) + 1; col++) {
        const cx = col * s + (row % 2 ? s / 2 : 0), cy = row * 1.5 * r;
        if (Math.hypot(cx, cy) > R) continue;
        const cell = regularPolygon(cx, cy, r, 6, Math.PI / 2);
        cells.push(difference(offset(cell, lw / 2, 'miter'), offset(cell, -lw / 2, 'miter')));
      }
    }
    lines = union(...cells);
  } else if (kind === 'rings') {
    const rings = [];
    for (let k = 1; k * s < R; k++) rings.push(difference(circle(0, 0, k * s + lw / 2, 96), circle(0, 0, k * s - lw / 2, 96)));
    lines = union(...rings);
  } else if (kind === 'rays') {
    const n = Math.max(8, Math.round((2 * Math.PI * R * 0.5) / s));
    const rays = [];
    for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; rays.push(stroke([{ x: 0, y: 0 }, { x: Math.cos(a) * R, y: Math.sin(a) * R }], lw, 'butt')); }
    lines = union(...rays);
  } else if (kind === 'diamonds') {
    const strokes = [];
    for (let k = -Math.ceil((2 * R) / s); k <= Math.ceil((2 * R) / s); k++) {
      const o = (k * s) / Math.SQRT2;
      strokes.push(stroke([{ x: -R + o * Math.SQRT2, y: -R }, { x: R + o * Math.SQRT2, y: R }], lw, 'butt'));
      strokes.push(stroke([{ x: -R + o * Math.SQRT2, y: R }, { x: R + o * Math.SQRT2, y: -R }], lw, 'butt'));
    }
    lines = union(...strokes);
  }
  return intersection(lines, area);
}

// ---------- Símbolos (emojis) dibujados con geometría ----------
// Las tipografías no traen emojis, así que se reemplazan por formas propias.

// Semiplano n·p <= d, aproximado con un cuadrado enorme rotado.
function halfPlane(nx, ny, d, L) {
  const ang = Math.atan2(ny, nx);
  return regularPolygon(nx * (d - L), ny * (d - L), L * Math.SQRT2, 4, ang + Math.PI / 4);
}

// Polígono convexo como intersección de semiplanos (no depende del formato interno de las regiones).
function convexPolygon(pts) {
  const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
  const L = 50 * Math.max(...pts.map((p) => Math.hypot(p.x - cx, p.y - cy)), 1);
  let reg = null;
  for (let i = 0; i < pts.length; i++) {
    const A = pts[i], B = pts[(i + 1) % pts.length];
    let nx = B.y - A.y, ny = -(B.x - A.x);
    const len = Math.hypot(nx, ny) || 1;
    nx /= len; ny /= len;
    if (nx * (cx - A.x) + ny * (cy - A.y) > 0) { nx = -nx; ny = -ny; } // normal hacia afuera
    const hp = halfPlane(nx, ny, nx * A.x + ny * A.y, L);
    reg = reg ? intersection(reg, hp) : hp;
  }
  return reg;
}

const SHAPES = {
  heart() {
    const r = 1;
    return union(
      regularPolygon(0, 0, r, 4, 0),
      circle(r / 2, r / 2, r / Math.SQRT2, 64),
      circle(-r / 2, r / 2, r / Math.SQRT2, 64),
    );
  },
  star() {
    const R = 1, ri = R * 0.382, pts = [], inner = [];
    for (let k = 0; k < 5; k++) {
      const a = Math.PI / 2 + (k * 2 * Math.PI) / 5;
      pts.push({ x: R * Math.cos(a), y: R * Math.sin(a) });
      const b = a + Math.PI / 5;
      inner.push({ x: ri * Math.cos(b), y: ri * Math.sin(b) });
    }
    const tips = pts.map((P, k) => convexPolygon([P, inner[(k + 4) % 5], inner[k]]));
    return union(offset(convexPolygon(inner), 0.01), ...tips);
  },
  flower() {
    const petals = [];
    for (let k = 0; k < 5; k++) {
      const a = Math.PI / 2 + (k * 2 * Math.PI) / 5;
      petals.push(circle(0.55 * Math.cos(a), 0.55 * Math.sin(a), 0.45, 48));
    }
    return union(circle(0, 0, 0.4, 48), ...petals);
  },
  paw() {
    const toes = [[-0.62, 0.22], [-0.24, 0.62], [0.24, 0.62], [0.62, 0.22]].map(([x, y]) => circle(x, y, 0.2, 40));
    const pad = union(circle(0, -0.32, 0.38, 64), circle(-0.24, -0.5, 0.26, 48), circle(0.24, -0.5, 0.26, 48));
    return union(pad, ...toes);
  },
};

const SYMBOL_OF = new Map();
const addSyms = (chars, name) => Array.from(chars).forEach((c) => SYMBOL_OF.set(c, name));
addSyms('❤♥♡❣💕💖💗💓💘💝💙💚💛💜🖤🤍🤎🧡🩷🩵🩶💞', 'heart');
addSyms('★☆⭐🌟✨✦✧', 'star');
addSyms('✿❀❁🌸🌼🌺🏵💮', 'flower');
addSyms('🐾', 'paw');
const IGNORE = /[︎️‍\u{1F3FB}-\u{1F3FF}]/u;
const LOOKS_EMOJI = /\p{Extended_Pictographic}/u;

// Escala a una altura dada y centra en (0, cy).
function fitSymbol(name, h, cy) {
  let g = SHAPES[name]();
  const b = bbox(g);
  g = scale(g, h / b.h);
  const nb = bbox(g);
  return translate(g, -nb.cx, cy - nb.cy);
}

// Arma la línea de texto mezclando letras de la tipografía y símbolos.
function richText(str, font, h, issues) {
  const chars = Array.from(str).filter((c) => !IGNORE.test(c));
  const unknown = [...new Set(chars.filter((c) => LOOKS_EMOJI.test(c) && !SYMBOL_OF.has(c)))];
  if (unknown.length) issues.push({ level: 'warning', msg: `Estos emojis no están disponibles y se omitieron: ${unknown.join(' ')}. Podés usar ❤ ★ ✿ 🐾` });
  const clean = chars.filter((c) => !unknown.includes(c));

  // Sin símbolos: camino normal (conserva el kerning de la tipografía).
  if (!clean.some((c) => SYMBOL_OF.has(c))) {
    const t = textRegion(clean.join(''), font, h);
    return { region: t.region, missing: t.missing };
  }

  // Separar en tramos de texto y símbolos
  const runs = [];
  for (const c of clean) {
    const sym = SYMBOL_OF.get(c);
    if (sym) runs.push({ sym });
    else if (runs.length && runs[runs.length - 1].text !== undefined) runs[runs.length - 1].text += c;
    else runs.push({ text: c });
  }

  const hasLetters = runs.some((r) => r.text && r.text.trim());
  const ref = hasLetters ? bbox(textRegion('H', font, h).region) : { h, cy: 0 };
  const symH = hasLetters ? ref.h * 1.1 : h;
  const gap = h * 0.12, spaceW = h * 0.3;
  const missing = [];
  const pieces = [];
  let x = 0;
  for (const r of runs) {
    if (r.sym) {
      let g = fitSymbol(r.sym, symH, ref.cy);
      const b = bbox(g);
      g = translate(g, x - (b.cx - b.w / 2), 0);
      pieces.push(g);
      x += b.w + gap;
      continue;
    }
    const lead = r.text.length - r.text.trimStart().length;
    const trail = r.text.length - r.text.trimEnd().length;
    x += lead * spaceW;
    const body = r.text.trim();
    if (body) {
      const t = textRegion(body, font, h);
      missing.push(...t.missing);
      if (t.region.length) {
        const b = bbox(t.region);
        pieces.push(translate(t.region, x - (b.cx - b.w / 2), 0));
        x += b.w + gap;
      }
    }
    x += trail * spaceW;
  }
  return { region: pieces.length ? union(...pieces) : [], missing: [...new Set(missing)] };
}

export default {
  id: 'posavasos',
  name: 'Posavasos personalizados',
  category: 'hogar',
  description: 'Set de posavasos con borde y canal que junta las gotas, patrón geométrico y nombre o iniciales en relieve o grabado. Con porta-posavasos opcional.',
  tags: ['emoji', 'corazón', 'posavasos', 'vasos', 'mesa', 'cocina', 'regalo', 'bar', 'iniciales', 'geométrico'],
  printTime: '45 min–1 h 30 c/u',
  defaults: {
    shape: 'round', diameter: 95, thickness: 4, count: 4,
    text: 'Salud', font: 'pacifico', textHeight: 18, textFill: 92, textMode: 'relief',
    pattern: 'hex', spacing: 12, lineWidth: 1.2,
    rimWidth: 3, channel: true, relief: 1.2, cutDepth: 1,
    holder: false, capacity: 4, clearance: 1.2,
    colorBase: '#26272B', colorTop: '#C9A24A',
  },
  sections: [
    { title: 'Forma', items: [
      { key: 'shape', type: 'cards', label: 'Contorno', options: [
        { value: 'round', label: 'Redondo', hint: 'Clásico' },
        { value: 'square', label: 'Cuadrado', hint: 'Esquinas suaves' },
        { value: 'hex', label: 'Hexagonal', hint: 'Se apoyan en panal' },
      ] },
      { key: 'diameter', type: 'range', label: 'Tamaño', min: 70, max: 130, step: 1, unit: 'mm', help: 'Diámetro, o lado si es cuadrado' },
      { key: 'thickness', type: 'range', label: 'Grosor de la base', min: 3, max: 6, step: 0.1, unit: 'mm' },
      { key: 'count', type: 'stepper', label: 'Cantidad en la misma impresión', min: 1, max: 6 },
    ] },
    { title: 'Texto o iniciales', items: [
      { key: 'text', type: 'text', label: 'Texto al centro (vacío = sin texto)', maxLength: 30, placeholder: 'Iniciales o nombre', help: 'Podés sumar emojis: ❤ corazón, ★ estrella, ✿ flor, 🐾 huellita' },
      { key: 'font', type: 'font', label: 'Tipografía', visibleIf: (p) => !!p.text.trim() },
      { key: 'textHeight', type: 'range', label: 'Altura de letra', min: 6, max: 70, step: 0.5, unit: 'mm', visibleIf: (p) => !!p.text.trim() },
      { key: 'textFill', type: 'range', label: 'Ocupar el centro hasta', min: 60, max: 100, step: 1, unit: '%', help: 'Límite para que el texto no toque el borde', visibleIf: (p) => !!p.text.trim() },
      { key: 'textMode', type: 'segmented', label: 'Acabado', options: [{ value: 'relief', label: 'Alto relieve' }, { value: 'engraved', label: 'Bajo relieve' }], visibleIf: (p) => !!p.text.trim() },
    ] },
    { title: 'Patrón y borde', items: [
      { key: 'pattern', type: 'cards', label: 'Patrón', options: [
        { value: 'hex', label: 'Panal', hint: 'Hexágonos' },
        { value: 'diamonds', label: 'Rombos', hint: 'Trama cruzada' },
        { value: 'rings', label: 'Anillos', hint: 'Círculos concéntricos' },
        { value: 'rays', label: 'Rayos', hint: 'Desde el centro' },
        { value: 'none', label: 'Liso', hint: 'Sin patrón' },
      ] },
      { key: 'spacing', type: 'range', label: 'Separación del patrón', min: 6, max: 25, step: 0.5, unit: 'mm', visibleIf: (p) => p.pattern !== 'none' },
      { key: 'lineWidth', type: 'range', label: 'Grosor de las líneas', min: 0.8, max: 3, step: 0.1, unit: 'mm', visibleIf: (p) => p.pattern !== 'none' },
      { key: 'rimWidth', type: 'range', label: 'Ancho del borde', min: 1.6, max: 6, step: 0.1, unit: 'mm' },
      { key: 'relief', type: 'range', label: 'Altura del borde y el relieve', min: 0.6, max: 2.5, step: 0.1, unit: 'mm' },
      { key: 'channel', type: 'toggle', label: 'Canal anti-goteo junto al borde' },
      { key: 'cutDepth', type: 'range', label: 'Profundidad del canal y del grabado', min: 0.6, max: 2, step: 0.1, unit: 'mm', visibleIf: (p) => p.channel || (p.text.trim() && p.textMode === 'engraved') },
    ] },
    { title: 'Porta-posavasos', items: [
      { key: 'holder', type: 'toggle', label: 'Incluir un soporte para guardarlos apilados' },
      { key: 'capacity', type: 'stepper', label: 'Capacidad del soporte', min: 2, max: 8, visibleIf: (p) => p.holder },
      { key: 'clearance', type: 'range', label: 'Holgura del soporte', min: 0.6, max: 3, step: 0.1, unit: 'mm', visibleIf: (p) => p.holder },
    ] },
    { title: 'Colores', items: [
      { key: 'colorBase', type: 'color', label: 'Base' },
      { key: 'colorTop', type: 'color', label: 'Borde, patrón y texto' },
    ] },
  ],
  orientations: [{ id: 'flat', label: 'Planos sobre la cama' }],

  build(p) {
    const issues = [];
    const D = p.diameter, T = p.thickness, H = p.relief;
    const out = outline(p.shape, D);
    const rim = difference(out, offset(out, -p.rimWidth));
    const chW = 2.4;
    const channel = p.channel ? difference(offset(out, -p.rimWidth), offset(out, -(p.rimWidth + chW))) : [];
    const inner = offset(out, -(p.rimWidth + (p.channel ? chW : 0) + 1.6));

    // Texto al centro
    let text = [];
    const str = (p.text || '').trim();
    if (str) {
      const t = richText(str, p.font, p.textHeight, issues);
      if (t.missing.length) issues.push({ level: 'warning', msg: `Se omitieron caracteres que la tipografía no tiene: ${t.missing.join(' ')}` });
      text = t.region;
      const ib = bbox(inner), tb = bbox(text);
      // Encaje real según la forma: en cuadrado alcanza con que entre en el lado;
      // en redondo/hex, que las esquinas del rectángulo del texto queden dentro del círculo.
      const fill = p.textFill / 100;
      let s = 1;
      if (p.shape === 'square') {
        s = Math.min(1, (ib.w * fill) / tb.w, (ib.h * fill) / tb.h);
      } else {
        const R = (Math.min(ib.w, ib.h) / 2) * fill;
        s = Math.min(1, R / Math.hypot(tb.w / 2, tb.h / 2));
      }
      if (s < 1) { text = scale(text, s); issues.push({ level: 'info', msg: `El texto se achicó al ${Math.round(s * 100)} % para entrar en el centro. Subí "Ocupar el centro" o agrandá el posavasos.` }); }
      const nb = bbox(text);
      text = translate(text, -nb.cx, -nb.cy);
      if (thinFraction(text, PRINT.minFeature) > 0.08) issues.push({ level: 'warning', msg: 'El texto tiene trazos de menos de 0,8 mm. Agrandalo o usá una tipografía más gruesa.' });
    }
    const keep = text.length ? offset(text, 2.4) : [];
    const pat = p.pattern === 'none' ? [] : pattern(p.pattern, difference(inner, keep), p.spacing, p.lineWidth);
    if (p.pattern !== 'none' && p.lineWidth < PRINT.minFeature + 0.2) issues.push({ level: 'info', msg: 'Líneas de menos de 1 mm: imprimí con capa fina para que salgan parejas.' });

    const engraved = text.length && p.textMode === 'engraved';
    const cuts = union(channel, engraved ? text : []);
    const d = Math.min(p.cutDepth, T - 1.2);
    if (cuts.length && d < p.cutDepth) issues.push({ level: 'info', msg: `El canal y el grabado se limitaron a ${d.toFixed(1)} mm para dejar 1,2 mm de fondo.` });
    const baseGeos = () => (cuts.length ? [extrudeRegion(out, 0, T - d), extrudeRegion(difference(out, cuts), T - d, T)] : [extrudeRegion(out, 0, T)]);
    const topRegion = union(rim, pat, engraved ? [] : text);
    const topGeo = () => extrudeRegion(topRegion, T, T + H);

    // Copias en grilla
    const n = Math.round(p.count);
    const cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
    const ob = bbox(out), gap = 6;
    const base = [], top = [];
    for (let k = 0; k < n; k++) {
      const i = k % cols, j = Math.floor(k / cols);
      const dx = (i - (cols - 1) / 2) * (ob.w + gap), dy = ((rows - 1) / 2 - j) * (ob.h + gap);
      for (const g of baseGeos()) { g?.translate(dx, dy, 0); base.push(g); }
      const tg = topGeo(); tg?.translate(dx, dy, 0); top.push(tg);
    }
    const parts = [part('base', 'Base', p.colorBase, base), part('top', 'Borde, patrón y texto', p.colorTop, top, { focus: true })];

    if (p.holder) {
      const wall = 2.4, floor = 2;
      const inside = offset(out, p.clearance);
      const shell = offset(out, p.clearance + wall);
      const hH = floor + Math.round(p.capacity) * (T + H) + 1;
      const notchW = Math.min(36, ob.w * 0.45), notchZ = floor + 3;
      const notch = rect(0, -ob.h / 2 - 10, notchW, ob.h * 0.6 + 20);
      const walls = difference(shell, inside);
      const hx = (cols / 2) * (ob.w + gap) + bbox(shell).w / 2 + 2;
      const geos = [extrudeRegion(shell, 0, floor), extrudeRegion(walls, floor, notchZ), extrudeRegion(difference(walls, notch), notchZ, hH)];
      geos.forEach((g) => g?.translate(hx, 0, 0));
      parts.push(part('holder', 'Porta-posavasos', p.colorBase, geos));
      issues.push({ level: 'info', msg: `El soporte guarda ${Math.round(p.capacity)} posavasos apilados; la abertura del frente sirve para sacarlos con el dedo.` });
    }
    if (H < PRINT.minWall && p.rimWidth < 2) issues.push({ level: 'info', msg: 'Un borde bajo y angosto contiene menos líquido.' });
    issues.push({ level: 'info', msg: `Para dos colores con un solo extrusor, cambiá el filamento a ${T.toFixed(1)} mm de altura: todo lo que está arriba sale del segundo color.` });
    return { parts: parts.filter(Boolean), issues };
  },
};