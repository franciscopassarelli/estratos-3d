// Prueba cada objeto y variante: geometría cerrada, volumen positivo, sin piezas flotantes y exportación.
import { OBJECTS } from '../src/objects/index.js';
import { buildModel, statusOf } from '../src/core/pipeline.js';
import { exportModel } from '../src/export/formats.js';
import fs from 'fs';

const variants = {
  llavero: [{}, { variant: 'rect', mode: 'engraved' }, { variant: 'capsule', mode: 'inlay', symbol: 'heart' }, { font: 'pacifico', text: 'Martín' }, { holeSide: 'top', font: 'bungee', text: 'ÑANDÚ' }, { variant: 'rect', rim: 1.5, symbol: 'paw' }, { font: 'titan', text: 'Ale' }],
  placa: [{}, { shape: 'oval', mode: 'inlay', decoration: 'heart' }, { shape: 'badge', mode: 'engraved', holes: 'none', line2: '' }, { font: 'archivo', line1: 'Consultorio 3', line2: 'Dra. Pérez', border: 0 }],
  'soporte-celular': [{}, { cable: false }, { angle: 80, backLength: 140, baseDepth: 60 }],
  organizador: [{}, { variant: 'cups', cols: 3, rows: 2, label: '' }, { cols: 1, rows: 1, radius: 0 }],
  maceta: [{}, { variant: 'waves', twist: 0 }, { variant: 'smooth', drain: 0 }, { sides: 3, twist: 120 }],
  'display-qr': [{}, { qrType: 'whatsapp', qrData: '11 5466 1930', footer: '', lean: 0, border: 0 }, { qrType: 'text', qrData: 'Alias: mi.negocio — ñ', ecc: 'Q', width: 200, height: 220, qrSize: 160 }, { qrType: 'instagram', qrData: '@estratos3d', title: '', width: 70, height: 90 }],
  'cartel-wifi': [{}, { password: 'clave1234', showPassword: true }, { security: 'nopass', title: '', hidden: true }],
  'llavero-qr': [{}, { backText: '', frontText: '' }, { qrType: 'url', qrData: 'estratos3d.com', ecc: 'M', qrSize: 40 }, { qrType: 'instagram', qrData: '@estratos3d', backText: 'Ñandú' }],
  posavasos: [{}, { shape: 'hex', pattern: 'diamonds', textMode: 'engraved', holder: true, count: 1 }, { shape: 'square', pattern: 'rays', text: '', count: 2 }, { pattern: 'rings', channel: false, count: 6 }, { pattern: 'none', text: 'AB', font: 'archivo', holder: true, capacity: 8 }],
  'pantalla-lampara': [{}, { holes: 'drops' }, { holes: 'slots', shape: 'prism', sides: 6 }, { shape: 'prism', sides: 4, columns: 8, holeSize: 85 }, { shape: 'prism', sides: 3, holes: 'drops', columns: 9 }, { style: 'vase' }, { style: 'vase', shape: 'prism', surface: 'smooth', twist: 0 }],
  'bandeja-cajon': [{}, { printSet: 'all', modulesX: 3, modulesY: 2, drawerW: 420, drawerD: 300, divX: 1, divY: 3, dividerPct: 100, radius: 0 }, { divX: 5, divY: 1, radius: 12, dividerPct: 30 }],
  'soporte-auriculares': [{}, { textMode: 'engraved', saddleSpan: 200, height: 200 }, { text: '', mast: 14, baseDepth: 80, saddleRadius: 90 }],
  'soporte-mandos': [{}, { bays: 3, bayWidth: 70, angle: 55, backHeight: 140 }, { bays: 1, text: '' }, { dividers: false }],
  'soporte-notebook': [{}, { slots: 3, device: 8, tilt: 15, gap: 6 }, { slots: 2, device: 35, sleeve: 10, tilt: 0 }],
  'cartel-deslizante': [{}, { title: '', holes: false, width: 125, windowWidth: 40, word1: 'ABIERTO', word2: 'CERRADO' }, { border: 0, height: 50, title: 'BAÑO', word1: 'BAÑO', word2: 'PRIVADO' }],
};
let fail = 0;
for (const def of OBJECTS) {
  for (const [i, v] of (variants[def.id] || [{}]).entries()) {
    for (const o of def.orientations) {
      const m = buildModel(def, v, o.id);
      const a = m.analysis;
      const ok = a && a.closed && a.volume > 0 && a.floating === 0;
      if (!ok) fail++;
      console.log(`${ok ? 'OK  ' : 'FAIL'} ${def.id}#${i} [${o.id}] ${statusOf(m)} parts=${m.parts.length} tris=${a?.triangles} closed=${a?.closed}(${a?.openEdges}/${a?.badEdges}) vol=${a?.volume.toFixed(0)} dims=${a && [a.dims.x, a.dims.y, a.dims.z].map((n) => n.toFixed(1)).join('x')} overhang=${a?.overhang.toFixed(0)} float=${a?.floating} ${m.ms.toFixed(0)}ms`);
      for (const is of m.issues) console.log('      ', is.level, '-', is.msg);
      if (i === 0 && o === def.orientations[0]) for (const fmt of ['3mf', 'stl', 'obj']) for (const f of exportModel(m, fmt, { stlMode: 'parts' })) fs.writeFileSync('out/' + f.name, f.bytes);
    }
  }
}
console.log(fail ? `${fail} fallos` : 'Todo correcto');
process.exit(fail ? 1 : 0);
