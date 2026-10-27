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
