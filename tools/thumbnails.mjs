// npm run miniaturas
// Saca una «foto de producto» de cada diseño con el mismo visor de la web y la guarda en
// public/miniaturas/<id>.webp. El catálogo las usa en lugar de generarlas en el celular de cada visitante.
//
// Requisitos (una sola vez):  npm i -D playwright  y  npx playwright install chromium
// Correr después de  npm run build  (usa la versión compilada).
import fs from 'fs';
import { spawn } from 'child_process';

let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  console.error('Falta Playwright. Instalalo una vez con:\n  npm i -D playwright\n  npx playwright install chromium');
  process.exit(1);
}
const { OBJECTS } = await import('../src/objects/index.js');
const only = process.argv.slice(2);
// Fotos reales (o renders fotorrealistas) que no hay que pisar con la captura del visor.
// Para reemplazar una a propósito, pasá su id:  npm run miniaturas -- botellero
const FOTOS = new Set(JSON.parse(fs.readFileSync('public/miniaturas/fotos.json', 'utf8')));
const OUT = 'public/miniaturas';
const PORT = 4179;
fs.mkdirSync(OUT, { recursive: true });

const server = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', shell: process.platform === 'win32' });
await new Promise((r) => setTimeout(r, 3000));

const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, colorScheme: 'dark' });
await page.route(/googletagmanager|googlesyndication|google-analytics|doubleclick/, (r) => r.abort());
const done = [];
try {
  for (const def of OBJECTS) {
    if (only.length ? !only.includes(def.id) : FOTOS.has(def.id)) continue;
    await page.goto(`http://localhost:${PORT}/crear/${def.id}?captura`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__estratosViewer && !window.__estratosViewer.box.isEmpty(), null, { timeout: 30000 });
    await page.waitForTimeout(800);
    const data = await page.evaluate(async () => {
      const blob = await window.__estratosViewer.photo({ width: 960, height: 720, brand: '', zoom: 1.28, type: 'image/webp', quality: 0.86, angle: 'product' });
      const buf = new Uint8Array(await blob.arrayBuffer());
      let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return btoa(s);
    });
    fs.writeFileSync(`${OUT}/${def.id}.webp`, Buffer.from(data, 'base64'));
    done.push(def.id);
    console.log(`✓ ${def.id}`);
  }
} finally {
  await browser.close();
  server.kill();
}
// Lista de miniaturas disponibles (con versión para que el navegador no muestre una vieja)
const ids = fs.readdirSync(OUT).filter((f) => f.endsWith('.webp')).map((f) => f.replace('.webp', '')).sort();
const v = Date.now().toString(36);
fs.writeFileSync('src/content/thumbs.js', `// Generado por \`npm run miniaturas\`. No lo edites a mano.\nexport const THUMB_VERSION = '${v}';\nexport const THUMBS = new Set(${JSON.stringify(ids)});\n`);
console.log(`\n${done.length} miniaturas nuevas · ${ids.length} en total.`);
