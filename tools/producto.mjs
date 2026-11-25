// npm run producto
// Sumar o actualizar productos de la tienda a partir de fotos.
//   1. Copiá las fotos a la carpeta  tienda-originales/  con el nombre del producto:
//        lampara-luna.jpg        (foto principal)
//        lampara-luna-2.jpg      (fotos extra: -2, -3, …)
//   2. Corré  npm run producto
//      · achica las fotos y las pasa a WebP en public/tienda/
//      · anota sus medidas en src/content/tienda-fotos.js
//      · si el producto es nuevo, agrega una ficha base en src/content/tienda.js
//   3. Abrí src/content/tienda.js, completá nombre, precio y descripción de la ficha nueva, y hacé push.
import fs from 'fs';
import path from 'path';

let sharp;
try { sharp = (await import('sharp')).default; } catch {
  console.error('Falta la librería sharp. Corré primero:  npm install');
  process.exit(1);
}

const SRC = 'tienda-originales';
const OUT = 'public/tienda';
const FOTOS = 'src/content/tienda-fotos.js';
const DATA = 'src/content/tienda.js';
const MARK = '// ⬇ PRODUCTOS NUEVOS: la herramienta agrega las fichas acá abajo';
const MAX = 1400, THUMB = 640;
const EXT = ['.jpg', '.jpeg', '.jfif', '.png', '.webp', '.heic', '.heif', '.avif', '.tif', '.tiff'];

fs.mkdirSync(SRC, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'producto';
const kb = (n) => `${Math.round(n / 1024)} KB`;

// producto -> [{ n, file }]
const grupos = new Map();
for (const file of fs.readdirSync(SRC).sort()) {
  const ext = path.extname(file).toLowerCase();
  if (!EXT.includes(ext)) continue;
  const base = slug(path.basename(file, ext));
  const m = base.match(/^(.*?)-(\d+)$/);
  const id = m ? m[1] : base, n = m ? Number(m[2]) : 1;
  if (!grupos.has(id)) grupos.set(id, []);
  grupos.get(id).push({ n, file, base });
}

// 1) Convierte las fotos nuevas o cambiadas de tienda-originales/ a public/tienda/
for (const list of grupos.values()) {
  for (const { file, base } of list) {
    const src = path.join(SRC, file);
    const dst = path.join(OUT, `${base}.webp`);
    try {
      if (fs.existsSync(dst) && fs.statSync(dst).mtimeMs >= fs.statSync(src).mtimeMs) continue;
      await sharp(src).rotate().resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(dst);
      await sharp(src).rotate().resize({ width: THUMB, height: THUMB * 2, fit: 'inside', withoutEnlargement: true }).webp({ quality: 66 }).toFile(dst.replace(/\.webp$/, '-chica.webp'));
      console.log(`✓ ${file} → public/tienda/${base}.webp (${kb(fs.statSync(src).size)} → ${kb(fs.statSync(dst).size)})`);
    } catch (err) {
      console.warn(`✗ ${file}: no se pudo convertir (${err.message}).${/heic|heif/i.test(file) ? ' Pasala a JPG y volvé a probar.' : ''}`);
    }
  }
}

// 2) El listado de fotos sale de lo que hay en public/tienda/ (así no depende de tener los originales)
const fotos = {};
const hechas = fs.readdirSync(OUT).filter((f) => f.endsWith('.webp') && !f.endsWith('-chica.webp')).sort();
for (const f of hechas) {
  const base = f.replace(/\.webp$/, '');
  const m = base.match(/^(.*?)-(\d+)$/);
  const id = m ? m[1] : base, n = m ? Number(m[2]) : 1;
  const meta = await sharp(path.join(OUT, f)).metadata();
  (fotos[id] ||= []).push({ n, f, w: meta.width, h: meta.height });
}
for (const id of Object.keys(fotos)) {
  fotos[id] = fotos[id].sort((a, b) => a.n - b.n || a.f.localeCompare(b.f)).map(({ f, w, h }) => [f, w, h]);
}

fs.writeFileSync(FOTOS, `// Generado por \`npm run producto\`. No lo edites a mano.\n// producto -> [[archivo, ancho, alto], …] (la primera es la foto principal)\nexport default ${JSON.stringify(fotos, null, 2)};\n`);

// Fichas base para los productos que todavía no existen en tienda.js
let data = fs.readFileSync(DATA, 'utf8');
const nuevos = [];
for (const id of Object.keys(fotos)) {
  if (new RegExp(`id:\\s*'${id}'`).test(data)) continue;
  const nombre = id.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
  const ficha = `  { id: '${id}', nombre: '${nombre}', categoria: 'otros', precio: null, descripcion: 'Completá la descripción.' },\n`;
  data = data.replace(MARK, `${MARK}\n${ficha.trimEnd()}`);
  nuevos.push(id);
}
if (nuevos.length) fs.writeFileSync(DATA, data);

console.log(`\nListo: ${Object.keys(fotos).length} productos con foto.`);
if (nuevos.length) {
  console.log('Fichas nuevas en src/content/tienda.js (completá nombre, precio y descripción):');
  for (const id of nuevos) console.log('  · ' + id);
}
