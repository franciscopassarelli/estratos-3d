// Exportadores reales a STL (binario), OBJ (+MTL) y 3MF (núcleo 3MF con materiales base).
import { zipSync, strToU8 } from 'fflate';
import { weld } from '../core/analysis.js';

const BED_CENTER = 110; // los modelos se ubican en el centro de una cama de 220 mm

// ---------- STL ----------
export function toSTL(parts, name = 'modelo') {
  let triCount = 0;
  for (const p of parts) for (const g of p.volumes) triCount += g.attributes.position.count / 3;
  const buf = new ArrayBuffer(84 + triCount * 50);
  const dv = new DataView(buf);
  const header = `Estratos 3D - ${name}`.slice(0, 79);
  for (let i = 0; i < header.length; i++) dv.setUint8(i, header.charCodeAt(i) & 0x7f);
  dv.setUint32(80, triCount, true);
  let o = 84;
  for (const p of parts) for (const g of p.volumes) {
    const a = g.attributes.position.array;
    for (let i = 0; i < a.length; i += 9) {
      const ux = a[i + 3] - a[i], uy = a[i + 4] - a[i + 1], uz = a[i + 5] - a[i + 2];
      const vx = a[i + 6] - a[i], vy = a[i + 7] - a[i + 1], vz = a[i + 8] - a[i + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1;
      dv.setFloat32(o, nx / l, true); dv.setFloat32(o + 4, ny / l, true); dv.setFloat32(o + 8, nz / l, true);
      for (let k = 0; k < 9; k++) dv.setFloat32(o + 12 + k * 4, a[i + k], true);
      dv.setUint16(o + 48, 0, true);
      o += 50;
    }
  }
  return new Uint8Array(buf);
}

// ---------- OBJ + MTL ----------
const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const fmt = (n) => (Math.abs(n) < 5e-6 ? '0' : n.toFixed(4).replace(/\.?0+$/, ''));

export function toOBJ(parts, name = 'modelo') {
  let obj = `# Estratos 3D - ${name}\n# Unidades: milímetros, eje Z hacia arriba\nmtllib ${name}.mtl\n`;
  let mtl = `# Estratos 3D - colores de ${name}\n`;
  let offsetV = 1;
  parts.forEach((p, idx) => {
    const mat = `mat_${idx}_${p.id}`;
    const [r, g, b] = hexToRgb(p.color);
    mtl += `newmtl ${mat}\nKd ${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)}\nKa 0 0 0\nKs 0.1 0.1 0.1\nNs 20\nd 1\nillum 2\n\n`;
   p.volumes.forEach((geo, vi) => {
    const { vertices: V, tris: T } = weld(geo);
    obj += `o ${p.id}_${vi + 1}\nusemtl ${mat}\n`;
    const lines = [];
    for (let i = 0; i < V.length; i += 3) lines.push(`v ${fmt(V[i])} ${fmt(V[i + 1])} ${fmt(V[i + 2])}`);
    for (let i = 0; i < T.length; i += 3) lines.push(`f ${T[i] + offsetV} ${T[i + 1] + offsetV} ${T[i + 2] + offsetV}`);
    obj += lines.join('\n') + '\n';
    offsetV += V.length / 3;
   });
  });
  return { obj, mtl };
}

// ---------- 3MF ----------
const esc = (s) => String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));

export function to3MF(parts, { title = 'Modelo', objectName = 'Modelo' } = {}) {
  const colors = [];
  const colorIndex = (hex) => { let i = colors.indexOf(hex.toUpperCase()); if (i < 0) { colors.push(hex.toUpperCase()); i = colors.length - 1; } return i; };
  let objects = '';
  const ids = [];
  let nextId = 2;
  parts.forEach((p) => p.volumes.forEach((geo, vi) => {
    const id = nextId++;
    ids.push(id);
    const { vertices: V, tris: T } = weld(geo);
    const vs = [], ts = [];
    for (let k = 0; k < V.length; k += 3) vs.push(`<vertex x="${fmt(V[k])}" y="${fmt(V[k + 1])}" z="${fmt(V[k + 2])}"/>`);
    for (let k = 0; k < T.length; k += 3) ts.push(`<triangle v1="${T[k]}" v2="${T[k + 1]}" v3="${T[k + 2]}"/>`);
    const label = p.volumes.length > 1 ? `${p.name} ${vi + 1}` : p.name;
    objects += `<object id="${id}" type="model" name="${esc(label)}" pid="1" pindex="${colorIndex(p.color)}"><mesh><vertices>${vs.join('')}</vertices><triangles>${ts.join('')}</triangles></mesh></object>\n`;
  }));
  const assemblyId = nextId;
  const components = ids.map((id) => `<component objectid="${id}"/>`).join('');
  const names = parts.map((p) => p.name);
  const mats = colors.map((c, i) => `<base name="${esc(names[parts.findIndex((p) => p.color.toUpperCase() === c)] || 'Color ' + (i + 1))}" displaycolor="${c}FF"/>`).join('');
  const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="es-AR" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
<metadata name="Title">${esc(title)}</metadata>
<metadata name="Application">Estratos 3D</metadata>
<metadata name="CreationDate">${new Date().toISOString().slice(0, 10)}</metadata>
<resources>
<basematerials id="1">${mats}</basematerials>
${objects}<object id="${assemblyId}" type="model" name="${esc(objectName)}"><components>${components}</components></object>
</resources>
<build><item objectid="${assemblyId}" transform="1 0 0 0 1 0 0 0 1 ${BED_CENTER} ${BED_CENTER} 0"/></build>
</model>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`;
  return zipSync({
    '[Content_Types].xml': strToU8(contentTypes),
    '_rels/.rels': strToU8(rels),
    '3D/3dmodel.model': strToU8(model),
  }, { level: 6 });
}

export const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'modelo';

/**
 * Genera los archivos para un formato. Devuelve [{ name, bytes }].
 * stlMode: 'merged' (un STL) | 'parts' (un STL por pieza/color).
 */
export function exportModel(model, format, { stlMode = 'merged' } = {}) {
  const base = slug(`${model.def.id}-${model.params.text || model.params.line1 || model.params.label || ''}`);
  const parts = model.parts;
  if (format === '3mf') return [{ name: `${base}.3mf`, bytes: to3MF(parts, { title: `${model.def.name}`, objectName: model.def.name }) }];
  if (format === 'stl') {
    if (stlMode === 'parts' && parts.length > 1) return parts.map((p) => ({ name: `${base}-${slug(p.name)}.stl`, bytes: toSTL([p], p.name) }));
    return [{ name: `${base}.stl`, bytes: toSTL(parts, model.def.name) }];
  }
  if (format === 'obj') {
    const { obj, mtl } = toOBJ(parts, base);
    return [{ name: `${base}.obj`, bytes: strToU8(obj) }, { name: `${base}.mtl`, bytes: strToU8(mtl) }];
  }
  throw new Error('Formato desconocido: ' + format);
}
