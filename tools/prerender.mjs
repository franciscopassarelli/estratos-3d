// Genera un HTML estático por ruta (para buscadores y para la revisión de AdSense),
// además de sitemap.xml, robots.txt, ads.txt y 404.html. Se ejecuta después de `vite build`.
import fs from 'fs';
import path from 'path';
import { SITE, adsEnabled } from '../src/config.js';
import { resolve, staticPaths, NOT_FOUND } from '../src/routes.js';
import { header, footer } from '../src/ui/layout.js';

const DIST = 'dist';
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const url = (p) => SITE.url + (p === '/' ? '/' : p);
const warnings = [];
if (SITE.url.includes('tudominio')) warnings.push('src/config.js: completá SITE.url con tu dominio.');
if (!SITE.email) warnings.push('src/config.js: completá SITE.email (AdSense pide un contacto real).');
if (!SITE.owner) warnings.push('src/config.js: completá SITE.owner (responsable en la política de privacidad).');
if (!adsEnabled()) warnings.push('src/config.js: sin adsenseClient se publican espacios de prueba en lugar de anuncios.');

function page(route, params, p) {
  const meta = route.meta(params);
  const body = header(route.section) + route.render(params, new URLSearchParams()) + footer();
  const head = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description || '')}">`,
    meta.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(url(p))}">`,
    `<meta property="og:type" content="${meta.type || 'website'}">`,
    `<meta property="og:site_name" content="${esc(SITE.name)}">`,
    `<meta property="og:title" content="${esc(meta.title)}">`,
    `<meta property="og:description" content="${esc(meta.description || '')}">`,
    meta.noindex ? '' : `<meta property="og:url" content="${esc(url(p))}">`,
    `<meta property="og:locale" content="${SITE.lang.replace('-', '_')}">`,
    adsEnabled() ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE.adsenseClient}" crossorigin="anonymous"></script>` : '',
  ].filter(Boolean).join('\n    ');
  return template
    .replace(/<html lang="[^"]*">/, `<html lang="${SITE.lang}">`)
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace(/<link rel="canonical"[^>]*>/, '')
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="app"></div>', `<div id="app">${body}</div>`);
}

const paths = staticPaths();
for (const p of paths) {
  const { route, params } = resolve(p);
  if (route === NOT_FOUND) throw new Error('Ruta sin página: ' + p);
  const file = p === '/' ? path.join(DIST, 'index.html') : path.join(DIST, p, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, page(route, params, p));
}
fs.writeFileSync(path.join(DIST, '404.html'), page(NOT_FOUND, [], '/404'));

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${url(p)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
if (adsEnabled()) fs.writeFileSync(path.join(DIST, 'ads.txt'), `google.com, ${SITE.adsenseClient.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`);

console.log(`Prerender: ${paths.length} páginas + 404, sitemap.xml, robots.txt${adsEnabled() ? ', ads.txt' : ''}`);
for (const w of warnings) console.warn('  ⚠ ' + w);
