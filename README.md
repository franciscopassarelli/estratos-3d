# Estratos 3D

Generador web de objetos paramétricos para impresión 3D. El usuario elige un objeto, ajusta medidas, textos y colores con vista previa 3D en tiempo real, y descarga archivos **3MF**, **STL** u **OBJ** generados en el navegador a partir de su diseño.

## Uso

```bash
npm install
npm run dev            # servidor de desarrollo (Vite)
npm run build          # build de producción en dist/ con una página HTML estática por ruta
npm run preview        # sirve dist/ para probar el build
npm test               # genera todos los objetos y variantes y verifica mallas cerradas
npm run build:artifact # un único HTML (Three.js por CDN) en dist-artifact/
```

## Publicar y monetizar

Seguí **PUBLICAR.md**: dominio, hosting, datos de `src/config.js`, Search Console y AdSense, paso a paso.

## Sorteos

Página pública, base de datos y panel privado: ver **SORTEOS.md**.

## Arquitectura

```
src/
  config.js         Dominio, contacto, responsable e IDs de AdSense (completar antes de publicar)
  routes.js         Tabla de rutas: título, descripción, render y montaje de cada página
  router.js         Navegación con History API (y modo hash para el artifact)
  content/guides.js Guías y artículos (agregar uno = una página nueva + sitemap)
  core/
    geometry2d.js   Kernel 2D: booleanas, offset y trazos con Clipper (µm enteros)
    text.js         Texto -> región 2D con tipografías OFL (src/fonts, formato typeface)
    symbols.js      Símbolos decorativos como geometría cerrada
    mesh.js         Extrusión de regiones, piezas/volúmenes, reparación de uniones en T
    pipeline.js     Parámetros -> validación -> geometría -> orientación -> análisis
    analysis.js     Malla cerrada y orientada, cáscaras, apoyo, voladizos > 45°, volumen
    palette.js      Colores de filamento y constantes de impresión
  objects/          Un módulo por objeto + registro y categorías
  export/
    formats.js      STL binario, OBJ+MTL, 3MF (basematerials + componentes)
    save.js         Descarga directa o .zip vía capacidad "downloads" del artifact
  viewer/Viewer.js  Visor Three.js (Z arriba, mm, cama de referencia, OrbitControls)
  ui/               Inicio, catálogo, editor, ayuda, anuncios (marcadores), miniaturas
  content/promos.js Sorteos y promociones (textos, fechas, premios)
  promo/validate.js Validación de inscripciones (compartida con el servidor)
  ui/promo.js       Página pública del sorteo
  ui/admin.js       Panel privado /admin
functions/          API en Cloudflare Pages Functions (/api/sorteos, /api/admin)
server/             Utilidades del servidor: sesión, D1, respuestas
migrations/         Esquema de la base D1
tools/
  prerender.mjs     HTML estático por ruta, sitemap.xml, robots.txt, ads.txt y 404.html
  font2typeface.mjs Convierte .woff a typeface JSON (opentype.js)
  build-artifact.mjs
tests/geometry.test.js
```

### Modelo de datos

Cada objeto exporta `{ id, name, category, description, tags, defaults, sections, orientations, build(params) }`.

- `sections[].items[]` describe los controles (`range`, `stepper`, `text`, `font`, `symbol`, `color`, `segmented`, `cards`, `toggle`) con límites y `visibleIf(params)` para mostrar solo lo que corresponde.
- `build(params)` devuelve `{ parts, issues }`. Cada pieza (`part`) tiene un color y uno o más **volúmenes cerrados**; las piezas de distinto color se exportan como componentes separados en el 3MF.
- `issues` son mensajes `error | warning | info` específicos del objeto (texto que no entra, agujero que toca el texto, base dividida, paredes finas…). `analysis.js` agrega los genéricos sobre la malla final.

La vista previa y los archivos descargados salen del mismo resultado de `buildModel`, así que no pueden desincronizarse.

### Agregar un objeto

1. Crear `src/objects/miObjeto.js` siguiendo el contrato anterior (usar `geometry2d` + `extrudeRegion`, o `geometryFromMesh` para mallas a medida).
2. Registrarlo en `src/objects/index.js`.
3. Agregar variantes a `tests/geometry.test.js` y correr `npm test`.

### Preparado para crecer

- **Backend / diseños guardados**: los parámetros son JSON plano (`sanitize` los valida); hoy se guardan en `localStorage` con la clave `estratos:params:<id>`.
- **Galería**: las miniaturas se generan desde la geometría real (`ui/thumbnails.js`).
- **Publicidad**: `ui/ads.js` dibuja bloques de AdSense cuando `config.js` tiene tu ID, y espacios de prueba cuando no.
- **Páginas nuevas**: una guía se agrega en `content/guides.js`; cualquier otra página, con una entrada en `routes.js` y su ruta en `staticPaths()`.

## Limitaciones conocidas

- Las comprobaciones son básicas (aristas abiertas, orientación de caras, apoyo por cajas envolventes, voladizos > 45°, trazos < 0,8 mm por apertura morfológica). No sustituyen la vista previa del laminador.
- Las piezas multivolumen (por ejemplo, base + capa grabada) son mallas cerradas que se tocan; los laminadores las unen al importar.
- Los colores del 3MF usan `basematerials` del núcleo 3MF. Algunos laminadores piden asignar el filamento a cada pieza manualmente.

Tipografías: Archivo Black, Titan One, Pacifico y Bungee (SIL Open Font License 1.1).
