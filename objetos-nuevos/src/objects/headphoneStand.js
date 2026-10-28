import * as THREE from 'three';
import { union, difference, bbox, translate, scale, stroke, roundedRect, thinFraction } from '../core/geometry2d.js';
import { textRegion } from '../core/text.js';
import { extrudeRegion, part } from '../core/mesh.js';
import { PRINT } from '../core/palette.js';

const rad = (d) => (d * Math.PI) / 180;

export default {
  id: 'soporte-auriculares',
  name: 'Soporte para auriculares',
  category: 'tecnologia',
  description: 'Stand vertical de escritorio con apoyo curvo para la vincha, base ancha y tu nombre o gamertag en relieve sobre el mástil. Se imprime acostado, sin soportes.',
  tags: ['auriculares', 'headset', 'gaming', 'escritorio', 'gamertag', 'soporte', 'stand'],
  printTime: '3–5 h',
  defaults: {
    height: 215, width: 60, baseDepth: 120, baseThickness: 12, mast: 26,
    saddleRadius: 55, saddleSpan: 150, saddleThickness: 10,
    text: 'PLAYER ONE', font: 'bungee', textHeight: 11, textMode: 'relief', textDepth: 1.2,
    color: '#26272B', colorText: '#E8742A',
  },
  sections: [
    { title: 'Medidas', items: [
      { key: 'height', type: 'range', label: 'Alto total', min: 180, max: 330, step: 1, unit: 'mm', help: 'Tiene que superar el largo de tus auriculares colgados' },
      { key: 'width', type: 'range', label: 'Ancho del apoyo', min: 35, max: 100, step: 1, unit: 'mm' },
      { key: 'baseDepth', type: 'range', label: 'Profundidad de la base', min: 80, max: 180, step: 1, unit: 'mm' },
      { key: 'baseThickness', type: 'range', label: 'Grosor de la base', min: 6, max: 25, step: 0.5, unit: 'mm', help: 'Más grosor = más peso y estabilidad' },
      { key: 'mast', type: 'range', label: 'Ancho del mástil', min: 14, max: 40, step: 0.5, unit: 'mm' },
    ] },
    { title: 'Apoyo de la vincha', items: [
      { key: 'saddleRadius', type: 'range', label: 'Radio de la curva', min: 30, max: 90, step: 1, unit: 'mm' },
      { key: 'saddleSpan', type: 'range', label: 'Apertura de la curva', min: 90, max: 200, step: 1, unit: '°' },
      { key: 'saddleThickness', type: 'range', label: 'Grosor del apoyo', min: 6, max: 18, step: 0.5, unit: 'mm' },
    ] },
    { title: 'Nombre o gamertag', items: [
      { key: 'text', type: 'text', label: 'Texto sobre el mástil (vacío = sin texto)', maxLength: 16, placeholder: 'Tu gamertag' },
      { key: 'font', type: 'font', label: 'Tipografía', visibleIf: (p) => !!p.text.trim() },
      { key: 'textHeight', type: 'range', label: 'Altura de letra', min: 5, max: 30, step: 0.5, unit: 'mm', visibleIf: (p) => !!p.text.trim() },
      { key: 'textMode', type: 'segmented', label: 'Acabado', options: [{ value: 'relief', label: 'Relieve' }, { value: 'engraved', label: 'Grabado' }], visibleIf: (p) => !!p.text.trim() },
      { key: 'textDepth', type: 'range', label: (p) => (p.textMode === 'relief' ? 'Altura del relieve' : 'Profundidad'), min: 0.6, max: 2.5, step: 0.1, unit: 'mm', visibleIf: (p) => !!p.text.trim() },
    ] },
    { title: 'Colores', items: [
      { key: 'color', type: 'color', label: 'Cuerpo' },
      { key: 'colorText', type: 'color', label: 'Texto', visibleIf: (p) => !!p.text.trim() && p.textMode === 'relief' },
    ] },
  ],
  // Geometría nativa: perfil lateral en XY extruido en Z (acostado sobre la cama).
  orientations: [{ id: 'side', label: 'Acostado (recomendado)', hint: 'Sin soportes; el texto queda arriba', matrix: null }],
  views: [{ id: 'standing', label: 'De pie', matrix: new THREE.Matrix4().makeRotationX(Math.PI / 2) }],
  useOrientation: 'standing',

  build(p) {
    const issues = [];
    const B = p.baseDepth, tb = p.baseThickness, tm = p.mast, ts = p.saddleThickness;
    const Rs = p.saddleRadius, Htop = p.height;
    const half = rad(p.saddleSpan / 2);
    // Arco del apoyo: su punto más alto toca el alto total
    const cy = Htop - ts / 2 - Rs;
    const arc = [];
    for (let i = 0; i <= 48; i++) { const t = Math.PI / 2 + half - (2 * half * i) / 48; arc.push({ x: Math.cos(t) * Rs, y: cy + Math.sin(t) * Rs }); }
    const saddle = stroke(arc, ts);
    const mastTop = cy + Rs; // se une al centro del arco
    const mast = roundedRect(0, (tb + mastTop) / 2, tm, mastTop - tb + 2, Math.min(3, tm / 4), 6);
    const base = roundedRect(0, tb / 2, B, tb, Math.min(tb / 2, 6), 8);
    // Refuerzos curvos entre mástil y base
    const fr = Math.min(18, (B - tm) / 4);
    const fillet = (sx) => {
      // Curva cóncava que termina 0,4 mm sobre la base (evita una tangencia exacta al unir)
      const lift = 0.4, pts = [];
      for (let i = 0; i <= 12; i++) { const t = (i / 12) * (Math.PI / 2); pts.push({ x: sx * (tm / 2 + fr - Math.cos(t) * fr), y: tb + lift + fr - Math.sin(t) * fr }); }
      pts.push({ x: sx * (tm / 2 + fr), y: tb - 0.5 }, { x: sx * (tm / 2 - 0.5), y: tb - 0.5 }, { x: sx * (tm / 2 - 0.5), y: tb + lift + fr });
      return [sx > 0 ? pts.reverse() : pts];
    };
    const body = union(base, mast, saddle, fillet(1), fillet(-1));
    const W = p.width;

    const parts = [];
    let bodyGeos = [extrudeRegion(body, 0, W)];
    const str = (p.text || '').trim();
    if (str) {
      const t = textRegion(str, p.font, p.textHeight);
      if (t.missing.length) issues.push({ level: 'warning', msg: `Se omitieron caracteres que la tipografía no tiene: ${t.missing.join(' ')}` });
      // El texto corre a lo largo del mástil, leyéndose de abajo hacia arriba
      let r = t.region.map((ring) => ring.map((pt) => ({ x: -pt.y, y: pt.x })));
      let b = bbox(r);
      const maxLen = mastTop - tb - fr - 12, maxW = tm - 5;
      if (b.h > maxLen || b.w > maxW) {
        const s = Math.min(maxLen / b.h, maxW / b.w);
        r = scale(r, s); b = bbox(r);
        issues.push({ level: 'info', msg: `El texto se achicó al ${Math.round(s * 100)} % para entrar en el mástil (letras de ${(p.textHeight * s).toFixed(1)} mm).` });
      }
      r = translate(r, -b.cx, tb + fr + 6 + (maxLen - b.h) / 2 + b.h / 2 - b.cy);
      if (thinFraction(r, PRINT.minFeature) > 0.08) issues.push({ level: 'warning', msg: 'El texto tiene trazos muy finos. Agrandalo, ensanchá el mástil o usá otra tipografía.' });
      if (p.textMode === 'relief') parts.push(part('text', 'Texto', p.colorText, extrudeRegion(r, W, W + p.textDepth), { focus: true }));
      else {
        const d = Math.min(p.textDepth, W / 4);
        bodyGeos = [extrudeRegion(body, 0, W - d), extrudeRegion(difference(body, r), W - d, W)];
      }
    }
    parts.unshift(part('body', 'Cuerpo', p.color, bodyGeos));

    if (Rs * Math.sin(half) * 2 < 60) issues.push({ level: 'info', msg: 'El apoyo es angosto: las vinchas anchas pueden quedar inclinadas.' });
    if (Rs + ts / 2 > B / 2 + 20) issues.push({ level: 'warning', msg: 'El apoyo sobresale mucho de la base: con auriculares pesados puede volcarse. Aumentá la profundidad de la base.' });
    if (tm < 18) issues.push({ level: 'info', msg: 'Un mástil de menos de 18 mm puede flexionar con auriculares pesados.' });
    if (Htop > PRINT.bed.y && Htop > PRINT.bed.x) issues.push({ level: 'warning', msg: `Acostado mide ${Htop.toFixed(0)} mm de largo: necesitás una cama grande o ubicarlo en diagonal.` });
    issues.push({ level: 'info', msg: 'Imprimilo acostado con 4 perímetros y 20–30 % de relleno: el mástil trabaja como una palanca.' });
    return { parts: parts.filter(Boolean), issues };
  },
};
