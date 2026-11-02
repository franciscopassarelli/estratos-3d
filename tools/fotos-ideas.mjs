// npm run fotos-ideas
// Saca la «foto de producto» de cada idea de los eventos (Navidad, etc.) con el visor de la web y la guarda en
// public/miniaturas/ideas/<evento>--<id>.webp. La página del evento las usa en lugar de generarlas en cada visita.
//
// Requisitos: los mismos que  npm run miniaturas  (Playwright). Correr después de  npm run build.
// Para rehacer solo algunas:  npm run fotos-ideas -- navidad--galleta navidad--baston
import fs from 'fs';
import { spawn } from 'child_process';

let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  console.error('Falta Playwright. Instalalo una vez con:\n  npm i -D playwright\n  npx playwright install chromium');
  process.exit(1);
}
const { EVENTS, presetHref } = await import('../src/content/events.js');
const { getObject } = await import('../src/objects/index.js');
const only = process.argv.slice(2);
const OUT = 'public/miniaturas/ideas';
const PORT = 4180;
fs.mkdirSync(OUT, { recursive: true });

const server = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', shell: process.platform === 'win32' });
await new Promise((r) => setTimeout(r, 3000));
const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, colorScheme: 'dark' });
await page.route(/googletagmanager|googlesyndication|google-analytics|doubleclick/, (r) => r.abort());
let n = 0;
try {
  for (const ev of EVENTS) for (const idea of ev.ideas) {
    const def = getObject(idea.objeto);
    const key = `${ev.id}--${idea.id}`;
    if (!def || !idea.id || (only.length && !only.includes(key))) continue;
    const href = presetHref(idea);
    for (let intento = 0; ; intento++) { // a veces el primer intento tarda de más: se reintenta una vez
      try {
        await page.goto(`http://localhost:${PORT}${href}${href.includes('?') ? '&' : '?'}captura`, { waitUntil: 'networkidle' });
        await page.waitForFunction(() => window.__estratosViewer && !window.__estratosViewer.box.isEmpty(), null, { timeout: 45000 });
        break;
      } catch (e) { if (intento) throw e; }
    }
    await page.waitForTimeout(800);
    const data = await page.evaluate(async (extra) => {
      const blob = await window.__estratosViewer.photo({ width: 960, height: 720, brand: '', zoom: 1.28, type: 'image/webp', quality: 0.86, angle: 'product', ...extra });
      const buf = new Uint8Array(await blob.arrayBuffer());
      let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return btoa(s);
    }, { ...(def.photo || {}), ...(idea.photo || {}) });
    fs.writeFileSync(`${OUT}/${key}.webp`, Buffer.from(data, 'base64'));
    n++; console.log(`✓ ${key}`);
  }
} finally {
  await browser.close();
  server.kill();
}
const ids = fs.readdirSync(OUT).filter((f) => f.endsWith('.webp')).map((f) => f.replace('.webp', '')).sort();
fs.writeFileSync('src/content/ideaThumbs.js', `// Generado por \`npm run fotos-ideas\`. No lo edites a mano.\nexport const IDEA_THUMB_VERSION = '${Date.now().toString(36)}';\nexport const IDEA_THUMBS = new Set(${JSON.stringify(ids)});\n`);
console.log(`\n${n} fotos nuevas · ${ids.length} en total.`);
