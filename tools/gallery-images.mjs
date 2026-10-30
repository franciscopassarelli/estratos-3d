// npm run galeria
// Convierte las fotos de galeria-originales/ en WebP livianos en public/galeria/
// y anota sus medidas en src/content/gallery-sizes.js (las usa la página de la galería).
import fs from 'fs';
import path from 'path';

let sharp;
try { sharp = (await import('sharp')).default; } catch {
  console.error('Falta la librería sharp. Corré primero:  npm install');
  process.exit(1);
}

const SRC = 'galeria-originales';
const OUT = 'public/galeria';
const SIZES = 'src/content/gallery-sizes.js';
const MAX = 1200; // px del lado mayor de la foto grande
const THUMB = 640; // versión chica para la grilla (celulares)

fs.mkdirSync(SRC, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'foto';
const kb = (n) => `${Math.round(n / 1024)} KB`;

const nuevas = [];
for (const file of fs.readdirSync(SRC).sort()) {
  const ext = path.extname(file).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif', '.tif', '.tiff'].includes(ext)) continue;
  const src = path.join(SRC, file);
  const name = slug(path.basename(file, ext)) + '.webp';
  const dst = path.join(OUT, name);
  if (fs.existsSync(dst) && fs.statSync(dst).mtimeMs >= fs.statSync(src).mtimeMs) continue;
  try {
    await sharp(src).rotate().resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true }).webp({ quality: 76 }).toFile(dst);
    await sharp(src).rotate().resize({ width: THUMB, height: THUMB * 2, fit: 'inside', withoutEnlargement: true }).webp({ quality: 62 }).toFile(dst.replace(/\.webp$/, '-chica.webp'));
    nuevas.push(name);
    console.log(`✓ ${file}  →  public/galeria/${name}  (${kb(fs.statSync(src).size)} → ${kb(fs.statSync(dst).size)})`);
  } catch (err) {
    console.warn(`✗ ${file}: no se pudo convertir (${err.message}).${/heic|heif/.test(ext) ? ' Pasala a JPG desde el celular o la compu y volvé a probar.' : ''}`);
  }
}

// Medidas de todas las fotos publicadas
const sizes = {};
for (const file of fs.readdirSync(OUT).sort()) {
  if (!file.endsWith('.webp') || file.endsWith('-chica.webp')) continue;
  const m = await sharp(path.join(OUT, file)).metadata();
  sizes[file] = [m.width, m.height];
}
fs.writeFileSync(SIZES, `// Generado por \`npm run galeria\`. No lo edites a mano.\nexport default ${JSON.stringify(sizes, null, 2)};\n`);

if (!nuevas.length) console.log('No hay fotos nuevas en galeria-originales/.');
else {
  console.log('\nAgregá cada foto nueva en src/content/gallery.js, por ejemplo:\n');
  for (const n of nuevas) console.log(`  { foto: '${n}', titulo: '', alt: '', autor: '', imprimio: '', enlace: '', diseno: '', fecha: '${new Date().toISOString().slice(0, 10)}' },`);
}
console.log(`\n${Object.keys(sizes).length} foto(s) en la galería.`);
