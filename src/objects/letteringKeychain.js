// Llavero lettering: dos líneas en cursiva sobre una base que sigue el contorno, a tres colores.
// Abajo la base (color 1), arriba la primera línea y el detalle (color 2) y la segunda línea (color 3).
import { union, difference, offset, stroke, bbox, translate, circle, islandCount } from '../core/geometry2d.js';
import { textRegion } from '../core/text.js';
import { symbolRegion } from '../core/symbols.js';
import { extrudeRegion, part } from '../core/mesh.js';

export default {
  id: 'llavero-lettering',
  name: 'Llavero lettering',
  category: 'accesorios',
  description: 'Dos palabras en letra cursiva, como un sticker: una chica arriba y una grande abajo, con un detalle y un subrayado. Base con contorno y texto a dos colores.',
  tags: ['llavero', 'lettering', 'frase', 'cursiva', 'nombre', 'sticker', 'tres colores', 'regalo'],
  printTime: '40–70 min',
  defaults: {
    line1: 'tu', line2: 'idea', font: 'pacifico', size: 16, symbol: 'sparkle', swoosh: true,
    thickness: 3, relief: 1.2, outline: 2.6, layered: true,
    colorBase: '#26272B', colorLine1: '#F1F1EC', colorLine2: '#3CC7B4',
  },
  sections: [
    { title: 'Texto', items: [
      { key: 'line1', type: 'text', label: 'Palabra chica (arriba)', maxLength: 10, placeholder: 'tu' },
      { key: 'line2', type: 'text', label: 'Palabra grande', maxLength: 12, placeholder: 'idea' },
      { key: 'font', type: 'font', label: 'Tipografía' },
      { key: 'size', type: 'range', label: 'Alto de la palabra grande', min: 10, max: 26, step: 0.5, unit: 'mm' },
    ] },
    { title: 'Detalles', items: [
      { key: 'symbol', type: 'symbol', label: 'Detalle al lado de la palabra chica' },
      { key: 'swoosh', type: 'toggle', label: 'Subrayado curvo' },
      { key: 'outline', type: 'range', label: 'Borde de la base', min: 1.6, max: 5, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Medidas', items: [
      { key: 'thickness', type: 'range', label: 'Grosor de la base', min: 2, max: 5, step: 0.1, unit: 'mm' },
      { key: 'relief', type: 'range', label: 'Altura del texto', min: 0.6, max: 2.4, step: 0.1, unit: 'mm' },
      { key: 'layered', type: 'toggle', label: 'Para una sola boquilla', help: 'La palabra grande sube 0,6 mm más y su tapa se pinta con un cambio de filamento.' },
    ] },
    { title: 'Colores', items: [
      { key: 'colorBase', type: 'color', label: 'Base' },
      { key: 'colorLine1', type: 'color', label: 'Palabra chica y detalles' },
      { key: 'colorLine2', type: 'color', label: 'Palabra grande' },
    ] },
  ],
  orientations: [{ id: 'flat', label: 'Plano sobre la cama' }],

  build(p) {
    const issues = [];
    const H = p.size;
    const t2 = textRegion(p.line2 || '', p.font, H);
    const t1 = textRegion(p.line1 || '', p.font, H * 0.5);
    for (const t of [t1, t2]) if (t.missing.length) issues.push({ level: 'warning', msg: `La tipografía no tiene estos caracteres y se omitieron: ${t.missing.join(' ')}` });
    if (!t2.region.length && !t1.region.length) return { parts: [], issues: [{ level: 'error', msg: 'Escribí al menos una palabra.' }] };

    // Palabra grande centrada; la chica arriba a la izquierda, un poco metida sobre la grande
    const b2 = bbox(t2.region);
    let l2 = t2.region, l1 = [];
    if (t1.region.length) {
      const b1 = bbox(t1.region);
      const x1 = (b2.w ? b2.minX : 0) + b1.w / 2 + H * 0.05, y1 = (b2.w ? b2.maxY : 0) + b1.h / 2 - H * 0.22;
      l1 = translate(t1.region, x1 - b1.cx, y1 - b1.cy);
    }
    const deco = [];
    if (p.symbol !== 'none' && l1.length) {
      const s = symbolRegion(p.symbol, H * 0.5), sb = bbox(s), b1 = bbox(l1);
      deco.push(translate(s, b1.maxX + H * 0.2 - sb.minX, b1.cy + H * 0.1 - sb.cy));
    }
    if (p.swoosh && l2.length) {
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const t = i / 48, x = b2.minX + b2.w * (0.12 + 0.86 * t);
        pts.push({ x, y: b2.minY - H * 0.14 + t * H * 0.2 - Math.sin(t * Math.PI) * H * 0.07 });
      }
      deco.push(stroke(pts, Math.max(1.4, H * 0.09), 'round'));
    }
    const line1 = union(l1, ...deco);
    const content = union(line1, l2);
    // Base: contorno redondeado y relleno de huecos chicos entre letras
    let base = offset(offset(content, p.outline + 6), -6);
    // Sin agujeros sueltos en la base (quedan entre una descendente y el subrayado)
    const sgn = (r) => Math.sign(r.reduce((a, q, i) => { const n = r[(i + 1) % r.length]; return a + q.x * n.y - n.x * q.y; }, 0));
    const big = base.reduce((m, r) => (r.length && Math.abs(bbox([r]).w * bbox([r]).h) > Math.abs(bbox([m]).w * bbox([m]).h) ? r : m), base[0]);
    base = union(...base.filter((r) => sgn(r) === sgn(big)).map((r) => [r]));
    // Argolla arriba a la izquierda
    const cb = bbox(base), holeR = 2.4, R = holeR + 2.4;
    const hx = cb.minX + R * 0.9, hy = cb.maxY - R * 0.25;
    base = difference(union(base, circle(hx, hy, R, 48)), circle(hx, hy, holeR, 40));
    if (islandCount(base) > 1) issues.push({ level: 'error', msg: 'La base quedó en dos partes. Aumentá el borde.' });
    const T = p.thickness, top = T + p.relief;
    const l2only = difference(l2, offset(line1, 0.4));
    const parts = [
      part('base', 'Base', p.colorBase, extrudeRegion(base, 0, T)),
      part('line1', 'Palabra chica', p.colorLine1, extrudeRegion(line1, T, top), { focus: true }),
    ];
    if (p.layered) {
      // Una sola boquilla: la palabra grande es 0,6 mm más alta y su tapa cambia de color
      parts.push(part('line2a', 'Palabra grande (abajo)', p.colorLine1, extrudeRegion(l2only, T, top)));
      parts.push(part('line2', 'Palabra grande', p.colorLine2, extrudeRegion(l2only, top, top + 0.6)));
      issues.push({ level: 'info', msg: `Cambios de filamento: en la capa de ${T.toFixed(1)} mm (color de la palabra chica) y en la de ${top.toFixed(1)} mm (color de la palabra grande).` });
    } else {
      parts.push(part('line2', 'Palabra grande', p.colorLine2, extrudeRegion(l2only, T, top)));
      issues.push({ level: 'info', msg: 'Las dos palabras van a la misma altura en distinto color: necesitás una impresora multicolor (AMS, MMU) o activar «Para una sola boquilla».' });
    }
    return { parts: parts.filter(Boolean), issues, ring: { x: hx, y: hy, z: T / 2, dx: -0.6, dy: 0.8 } };
  },
};
