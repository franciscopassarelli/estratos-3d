// Empaqueta la app en un único HTML para publicarla como artifact de claude.ai.
// Three.js se carga desde un CDN fijado por versión; el resto (incluidas las fuentes 3D) va embebido.
import * as esbuild from 'esbuild';
import fs from 'fs';

const THREE_VERSION = '0.160.0';
const threeGlobal = {
  name: 'three-global',
  setup(b) {
    b.onResolve({ filter: /^three$/ }, () => ({ path: 'three', namespace: 'three-global' }));
    b.onLoad({ filter: /.*/, namespace: 'three-global' }, () => ({ contents: 'module.exports = window.THREE;', loader: 'js' }));
  },
};
const res = await esbuild.build({
  entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', target: 'es2020',
  outdir: 'dist-artifact', write: false, plugins: [threeGlobal], legalComments: 'none',
  define: { __HASH_ROUTER__: 'true' },
});
const js = res.outputFiles.find((f) => f.path.endsWith('.js')).text.replace(/<\/script/gi, '<\\/script');
const css = res.outputFiles.find((f) => f.path.endsWith('.css')).text;
const html = `<title>Estratos 3D</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Diseñá objetos personalizados para impresión 3D y descargá archivos 3MF, STL u OBJ.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Bungee&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Pacifico&family=Titan+One&family=Unbounded:wght@600;700&display=swap">
<style>${css}</style>
<div id="app"></div>
<script src="https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/build/three.min.js"></script>
<script>${js}</script>
`;
fs.mkdirSync('dist-artifact', { recursive: true });
fs.writeFileSync('dist-artifact/estratos-3d.html', html);
console.log('dist-artifact/estratos-3d.html', (html.length / 1024).toFixed(0) + ' KB');
