// Llavero con nombre articulado: letras paradas unidas por bisagras que se imprimen ya armadas.
// Cada bisagra es un perno con cono a 50° (de la letra de la izquierda) dentro de un anillo
// (de la letra de la derecha): no necesita soportes y gira libre. Se imprime parado y a dos
// colores con un cambio de filamento a mitad de altura.
import * as THREE from 'three';
import { union, intersection, rect, circle, difference, bbox, translate, islandCount, area } from '../core/geometry2d.js';
import { textRegion } from '../core/text.js';
import { extrudeRegion, part } from '../core/mesh.js';
import { revolve, clipProfile } from '../core/revolve.js';

const K = 1.2; // pendiente de los conos (≈ 50°)
const STAND = new THREE.Matrix4().makeRotationX(Math.PI / 2);

/** Región en el plano XZ (x, z) extruida a lo ancho y ∈ [-w/2, w/2]. */
function xz(region, w) {
  if (!region.length) return null;
  const g = extrudeRegion(region, -w / 2, w / 2);
  g.applyMatrix4(STAND);
  return g;
}

export default {
  id: 'llavero-articulado',
  name: 'Llavero nombre articulado',
  category: 'accesorios',
  description: 'Letras paradas unidas por bisagras que giran: el nombre se dobla como una víbora. Se imprime ya armado, sin soportes, y a dos colores con un cambio de filamento.',
  tags: ['llavero', 'nombre', 'articulado', 'flexi', 'dos colores', 'regalo', 'niños'],
  printTime: '40–90 min',
  defaults: { text: 'ESTRATOS3D', font: 'titan', letterHeight: 15, depth: 8, split: 55, clearance: 0.45, ring: true, colorBottom: '#1A1F24', colorTop: '#47D0B0' },
  sections: [
    { title: 'Texto', items: [
      { key: 'text', type: 'text', label: 'Nombre', maxLength: 10, placeholder: 'Tu nombre', help: 'Se escribe en mayúsculas.' },
      // Pacifico (cursiva) no sirve parada: tiene trazos inclinados en el aire y partes sueltas
      { key: 'font', type: 'font', label: 'Tipografía', exclude: ['pacifico'] },
      { key: 'letterHeight', type: 'range', label: 'Alto de las letras', min: 12, max: 24, step: 0.5, unit: 'mm', help: 'Si el nombre es largo, se achica solo para entrar en la cama.' },
      { key: 'depth', type: 'range', label: 'Espesor de las letras', min: 6, max: 12, step: 0.5, unit: 'mm' },
    ] },
    { title: 'Bisagras', items: [
      { key: 'clearance', type: 'range', label: 'Juego de las bisagras', min: 0.3, max: 0.7, step: 0.05, unit: 'mm', help: 'Si quedan pegadas, subilo. Si quedan flojas, bajalo.' },
      { key: 'ring', type: 'toggle', label: 'Argolla para el llavero' },
    ] },
    { title: 'Colores', items: [
      { key: 'split', type: 'range', label: 'Altura del cambio de color', min: 25, max: 75, step: 5, unit: '%' },
      { key: 'colorBottom', type: 'color', label: 'Abajo' },
      { key: 'colorTop', type: 'color', label: 'Arriba' },
    ] },
  ],
  orientations: [{ id: 'upright', label: 'Parado, en línea recta' }],
  views: [{ id: 'curved', label: 'Doblado' }],
  useOrientation: 'curved',
  // Miniatura: de frente y bajo (las letras están paradas) y más cerca, porque es largo y finito
  photo: { dir: [0.25, -1, 0.3], zoom: 0.75 },

  build(p, orientationId = 'upright') {
    const issues = [];
    const raw = String(p.text || '').toUpperCase();
    const chars = [...raw].filter((c) => c.trim());
    if (raw.includes(' ')) issues.push({ level: 'info', msg: 'Los espacios se omiten: cada letra va unida a la siguiente.' });
    const D = p.depth, c = p.clearance;
    // Por si llega con Pacifico guardada de antes (o desde un enlace viejo)
    const font = p.font === 'pacifico' ? 'titan' : p.font;
    const R = 2.8, rp = 1.1, wa = 3, delta = c;

    // Letras: cada una apoyada en la cama (y = 0 abajo)
    const makeGlyphs = (h) => {
      const out = [], miss = [];
      for (const ch of chars) {
        const t = textRegion(ch, font, h);
        if (t.missing.length || !t.region.length) { miss.push(ch); continue; }
        const b = bbox(t.region);
        out.push(translate(t.region, -b.minX, -b.minY));
      }
      return { out, miss };
    };
    let H = p.letterHeight;
    let { out: glyphs, miss } = makeGlyphs(H);
    // Si no entra en la cama, se achican las letras: las bisagras y la argolla miden siempre lo mismo,
    // y el ancho de cada letra es proporcional a su alto.
    const LIMIT = 215, H_MIN = 12;
    const fixed = Math.max(0, glyphs.length - 1) * (2 * (R + c) + 0.4) + (p.ring ? 12 : 0);
    const lettersW = glyphs.reduce((s, gl) => s + bbox(gl).w, 0);
    if (lettersW > 0 && fixed + lettersW > LIMIT) {
      const Hfit = Math.max(H_MIN, Math.floor(((H * (LIMIT - fixed)) / lettersW) * 2) / 2);
      if (Hfit < H) {
        H = Hfit;
        ({ out: glyphs, miss } = makeGlyphs(H));
        issues.push({ level: 'info', msg: `Las letras se achicaron a ${String(H).replace('.', ',')} mm de alto para que el llavero entre en una cama de 22 cm.` });
      }
    }
    for (const ch of miss) issues.push({ level: 'warning', msg: `La tipografía no tiene la letra «${ch}» y se omitió.` });
    const z1 = Math.max(3.2, H * 0.22);
    // Las bisagras quedan más bajas que las letras: así se lee el nombre y no parecen «I»
    const zs = H * (p.split / 100);
    // y, si se puede, terminan en el cambio de color: quedan del color de abajo, como uniones
    const Hk = Math.min(H - 1, Math.max(z1 + (R - rp) * K + 2.2, Math.min(zs, H * 0.68)));

    if (!glyphs.length) return { parts: [], issues: [{ level: 'error', msg: 'Escribí al menos una letra.' }] };

    const bottom = [], top = [];
    let g = 0; // a qué letra pertenece cada pieza (para mostrarlo doblado)
    const band = (r, z0, z2) => intersection(r, rect(0, (z0 + z2) / 2, 1e4, z2 - z0));
    const pushXZ = (region, w) => {
      let lo = band(region, -1, zs), hi = band(region, zs, 1e3);
      // Islas de la mitad de abajo que no llegan a la cama (la punta de la V de una M):
      // van con la mitad de arriba, que es de donde cuelgan.
      const sgn = (r) => Math.sign(r.reduce((a, q, i) => { const n = r[(i + 1) % r.length]; return a + q.x * n.y - n.x * q.y; }, 0));
      const outer = lo.length ? sgn(lo.reduce((m, r) => (area([r]) > area([m]) ? r : m), lo[0])) : 1;
      const loose = lo.filter((r) => sgn(r) === outer && Math.min(...r.map((q) => q.y)) > 0.3);
      if (loose.length && islandCount(lo) > 1) {
        const keep = difference(lo, union(...loose.map((r) => [r])));
        if (keep.length) { hi = union(hi, ...loose.map((r) => [r])); lo = keep; }
      }
      if (lo.length) bottom.push({ geo: xz(lo, w), g });
      if (hi.length) top.push({ geo: xz(hi, w), g });
    };
    const pushRev = (profile, cx) => {
      const lo = clipProfile(profile, 0, zs), hi = clipProfile(profile, zs, 1e3);
      if (lo.length > 2) bottom.push({ geo: revolve(lo, cx, 0, 48), g });
      if (hi.length > 2) top.push({ geo: revolve(hi, cx, 0, 48), g });
    };

    let x = 0;
    const placed = [];
    glyphs.forEach((g, i) => {
      const b = bbox(g);
      if (i > 0) x += R + c + 0.4; // la letra arranca justo después del anillo
      placed.push({ g: translate(g, x, 0), minX: x, maxX: x + b.w });
      x += b.w;
      if (i < glyphs.length - 1) x += R + c; // eje de la bisagra
    });

    const axes = [];
    for (let i = 0; i < placed.length; i++) {
      const L = placed[i];
      g = i;
      pushXZ(L.g, D);
      if (i === placed.length - 1) break;
      const N = placed[i + 1];
      const xk = L.maxX + R + c;
      axes.push(xk);
      // Brazo de la letra izquierda: abajo, hasta el cilindro del perno
      const low = band(L.g, 0, z1);
      const attach = low.length ? bbox(low).maxX : L.maxX;
      pushXZ(rect((attach - 1 + xk) / 2, z1 / 2, xk - attach + 1, z1), wa);
      // Perno: cilindro abajo, cono a 50° y perno fino hasta arriba
      pushRev([[0, 0], [R, 0], [R, z1], [rp, z1 + (R - rp) * K], [rp, Hk], [0, Hk]], xk);
      g = i + 1;
      // Anillo de la letra derecha: su cara de abajo copia el cono con juego
      pushRev([[R, z1 + delta * K], [rp + delta, z1 + (R - rp) * K], [rp + delta, Hk], [R, Hk]], xk);
      const xa = xk + R - 0.6;
      const zB0 = z1 + (delta + 0.6) * K;
      // Brazo colgado arriba: su cara de abajo baja a 50° hacia la letra (sin voladizos).
      // Se alarga hasta tocar material de la letra (por ejemplo la pata de la A).
      const zTop = Hk;
      const arm = (xe) => { const zE = Math.max(0, zB0 - (xe - xa) * K);
        return zE > 0 ? [[{ x: xa, y: zB0 }, { x: xe, y: zE }, { x: xe, y: zTop }, { x: xa, y: zTop }]]
          : [[{ x: xa, y: zB0 }, { x: xa + zB0 / K, y: 0 }, { x: xe, y: 0 }, { x: xe, y: zTop }, { x: xa, y: zTop }]]; };
      let xe = N.minX + 1.2;
      while (islandCount(union(N.g, arm(xe))) > 1 && xe < N.maxX) xe += 0.6;
      pushXZ(arm(xe), wa);
    }

    // Argolla horizontal apoyada en la cama, antes de la primera letra
    if (p.ring) {
      const first = placed[0], low = band(first.g, 0, 3);
      const att = low.length ? bbox(low).minX : 0;
      const hr = 2.4, rr = 5.2, cx = -rr - 1.5;
      const tab = difference(union(circle(cx, 0, rr, 48), rect((cx + att + 1.2) / 2, 0, att + 1.2 - cx, 4)), circle(cx, 0, hr, 40));
      bottom.push({ geo: extrudeRegion(tab, 0, Math.min(3, zs)), g: 0 });
    }

    const xMax = x + (p.ring ? 12 : 0);
    if (xMax > 215) issues.push({ level: 'warning', msg: `Mide unos ${Math.round(xMax)} mm de largo: no entra en una cama de 22 cm. Usá letras más bajas o un nombre más corto.` });
    issues.push({ level: 'info', msg: `Para los dos colores, poné un cambio de filamento (M600 o pausa) en la capa de ${zs.toFixed(1)} mm.` });
    issues.push({ level: 'info', msg: 'Al terminar, doblá cada bisagra con suavidad para despegarla. Las letras con brazos (E, F, T) se imprimen paradas sin problema.' });
    // Ambas mitades se tocan en la capa del cambio: la de arriba se apoya en la de abajo
    // Vista «doblado»: cada bisagra gira un poco, alternando, para mostrar que se mueve
    if (orientationId === 'curved') {
      const ang = [16, -22, 18, -14, 20, -16, 14, -18, 16];
      for (let j = axes.length - 1; j >= 0; j--) {
        const m = new THREE.Matrix4().makeTranslation(axes[j], 0, 0)
          .multiply(new THREE.Matrix4().makeRotationZ((ang[j % ang.length] * Math.PI) / 180))
          .multiply(new THREE.Matrix4().makeTranslation(-axes[j], 0, 0));
        for (const it of [...bottom, ...top]) if (it.g > j) it.geo.applyMatrix4(m);
      }
    }
    return {
      parts: [
        part('bottom', 'Mitad de abajo', p.colorBottom, bottom.map((it) => it.geo), { bridges: true, protrusion: 2 }),
        part('top', 'Mitad de arriba', p.colorTop, top.map((it) => it.geo), { focus: true, bridges: true, protrusion: 2 }),
      ].filter(Boolean),
      issues,
      ring: p.ring ? { x: -5.2 - 1.5, y: 0, z: 1.5, dx: -1, dy: 0 } : null,
    };
  },
};