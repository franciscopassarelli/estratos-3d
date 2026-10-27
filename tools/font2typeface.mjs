// Convierte una fuente .woff a formato typeface JSON (el que usa THREE.FontLoader)
import opentype from 'opentype.js';
import fs from 'fs';
const [,, input, output, name] = process.argv;
const buf = fs.readFileSync(input);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const chars = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~¡¿ÁÉÍÓÚÜÑáéíóúüñÀÈÌÒÙàèìòùÇçÂÊÔâêôÃÕãõ°€♥";
const scale = 1; const glyphs = {};
for (const ch of chars) {
  const g = font.charToGlyph(ch);
  if (!g || g.index === 0) continue;
  const p = g.getPath(0, 0, font.unitsPerEm);
  let o = '';
  for (const c of p.commands) {
    const f = v => Math.round(v);
    if (c.type === 'M') o += `m ${f(c.x)} ${f(-c.y)} `;
    else if (c.type === 'L') o += `l ${f(c.x)} ${f(-c.y)} `;
    else if (c.type === 'Q') o += `q ${f(c.x)} ${f(-c.y)} ${f(c.x1)} ${f(-c.y1)} `;
    else if (c.type === 'C') o += `b ${f(c.x)} ${f(-c.y)} ${f(c.x1)} ${f(-c.y1)} ${f(c.x2)} ${f(-c.y2)} `;
  }
  glyphs[ch] = { ha: Math.round(g.advanceWidth * scale), x_min: 0, x_max: 0, o: o.trim() };
}
const json = { glyphs, familyName: name, ascender: font.ascender, descender: font.descender,
  underlinePosition: font.tables.post.underlinePosition, underlineThickness: font.tables.post.underlineThickness,
  boundingBox: { yMin: font.tables.head.yMin, xMin: font.tables.head.xMin, yMax: font.tables.head.yMax, xMax: font.tables.head.xMax },
  resolution: font.unitsPerEm, original_font_information: { license: 'SIL Open Font License 1.1' } };
fs.writeFileSync(output, 'export default ' + JSON.stringify(json) + ';\n');
console.log(name, Object.keys(glyphs).length, 'glyphs', (fs.statSync(output).size/1024|0)+'KB');
