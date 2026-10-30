// Tabla de rutas. La usan la app (navegación) y tools/prerender.mjs (HTML estático + sitemap).
// Para sumar una página: agregá una entrada acá; si es una guía, alcanza con agregarla en content/guides.js.
import { SITE } from './config.js';
import { OBJECTS, getObject, CATEGORIES } from './objects/index.js';
import { GUIDES, getGuide } from './content/guides.js';
import { homePage, mountHome } from './ui/home.js';
import { catalogPage, mountCatalog } from './ui/catalog.js';
import { editorPage, mountEditor } from './ui/editor.js';
import { promoPage, mountPromo } from './ui/promo.js';
import { adminPage, mountAdmin } from './ui/admin.js';
import { PROMOS, getPromo } from './content/promos.js';
import { helpPage, aboutPage, contactPage, termsPage, privacyPage, guidesIndexPage, guidePage, galleryPage, notFoundPage, mountContent } from './ui/pages.js';

const noop = () => () => {};
const catalogState = { category: 'all', query: '' };

export const ROUTES = [
  {
    pattern: /^\/$/, section: 'inicio',
    meta: () => ({ title: `${SITE.name}: objetos personalizados para imprimir en 3D`, description: 'Diseñá llaveros, placas, macetas, soportes y organizadores a medida, con vista previa 3D, y descargá archivos 3MF, STL u OBJ gratis.' }),
    render: () => homePage(), mount: (root) => mountHome(root),
  },
  {
    pattern: /^\/catalogo$/, section: 'catalogo',
    meta: () => ({ title: `Catálogo de diseños | ${SITE.name}`, description: 'Objetos paramétricos para imprimir en 3D: hogar, accesorios, organización, negocios y tecnología. Elegí uno y personalizalo.' }),
    render: (_, q) => { const c = q?.get('categoria'); if (c && CATEGORIES.some((x) => x.id === c)) catalogState.category = c; return catalogPage(catalogState); },
    mount: (root) => mountCatalog(root, catalogState),
  },
  {
    pattern: /^\/crear\/([a-z0-9-]+)$/, section: 'catalogo',
    exists: ([id]) => !!getObject(id),
    meta: ([id]) => { const o = getObject(id); return { title: `${o.name}${/personaliz/i.test(o.name) ? '' : ' personalizable'} para imprimir en 3D | ${SITE.name}`, description: `${o.description} Vista previa 3D y descarga en 3MF, STL u OBJ.` }; },
    render: ([id]) => editorPage(id), mount: (root, [id]) => mountEditor(root, id),
  },
  {
    pattern: /^\/guias$/, section: 'guias',
    meta: () => ({ title: `Guías de diseño e impresión 3D | ${SITE.name}`, description: 'Medidas recomendadas, materiales, formatos de archivo y trucos para imprimir a varios colores.' }),
    render: () => guidesIndexPage(), mount: (root) => mountContent(root),
  },
  {
    pattern: /^\/guias\/([a-z0-9-]+)$/, section: 'guias',
    exists: ([slug]) => !!getGuide(slug),
    meta: ([slug]) => { const g = getGuide(slug); return { title: `${g.title} | ${SITE.name}`, description: g.description, type: 'article' }; },
    render: ([slug]) => guidePage(slug), mount: (root) => mountContent(root),
  },
  {
    // Sorteos: fuera de Google y sin publicidad.
    pattern: /^\/sorteos\/([a-z0-9-]+)$/, section: '', noAds: true,
    meta: ([slug]) => { const p = getPromo(slug); return { title: p ? `${p.title} | ${SITE.name}` : `Sorteo | ${SITE.name}`, description: p ? p.intro : '', noindex: true }; },
    render: ([slug]) => promoPage(slug), mount: (root, [slug], query) => mountPromo(root, slug, query),
  },
  {
    pattern: /^\/admin$/, section: '', noAds: true,
    meta: () => ({ title: `Panel | ${SITE.name}`, description: '', noindex: true }),
    render: () => adminPage(), mount: (root) => mountAdmin(root),
  },
  {
    pattern: /^\/galeria$/, section: 'galeria',
    meta: () => ({ title: `Galería: piezas impresas con ${SITE.name}`, description: 'Fotos reales de llaveros, placas y objetos impresos en 3D a partir de diseños personalizados de Estratos 3D. Mandá la tuya.' }),
    render: () => galleryPage(), mount: (root) => mountContent(root),
  },
  { pattern: /^\/ayuda$/, section: 'ayuda', meta: () => ({ title: `Preguntas frecuentes | ${SITE.name}`, description: 'Respuestas sobre formatos de archivo, impresión a dos colores, comprobaciones y uso del editor.' }), render: helpPage, mount: mountContent },
  { pattern: /^\/acerca$/, section: 'ayuda', meta: () => ({ title: `Acerca de | ${SITE.name}`, description: `Qué es ${SITE.name} y cómo genera los objetos para impresión 3D.` }), render: aboutPage, mount: mountContent },
  { pattern: /^\/contacto$/, section: 'ayuda', meta: () => ({ title: `Contacto | ${SITE.name}`, description: `Cómo comunicarte con ${SITE.name}.` }), render: contactPage, mount: mountContent },
  { pattern: /^\/condiciones$/, section: 'ayuda', meta: () => ({ title: `Condiciones de uso | ${SITE.name}`, description: `Condiciones de uso de ${SITE.name}.` }), render: termsPage, mount: mountContent },
  { pattern: /^\/privacidad$/, section: 'ayuda', meta: () => ({ title: `Política de privacidad | ${SITE.name}`, description: `Cómo trata ${SITE.name} tus datos, cookies y publicidad.` }), render: privacyPage, mount: mountContent },
];

export const NOT_FOUND = {
  section: '', notFound: true,
  meta: () => ({ title: `Página no encontrada | ${SITE.name}`, description: '', noindex: true }),
  render: notFoundPage, mount: noop,
};

export function resolve(path) {
  for (const r of ROUTES) {
    const m = path.match(r.pattern);
    if (m) {
      const params = m.slice(1);
      if (r.exists && !r.exists(params)) return { route: NOT_FOUND, params: [] };
      return { route: r, params };
    }
  }
  return { route: NOT_FOUND, params: [] };
}

/** Páginas que se generan como HTML pero no van al sitemap. */
export function hiddenPaths() {
  return ['/admin', ...PROMOS.filter((p) => p.visible).map((p) => `/sorteos/${p.slug}`)];
}

/** Todas las rutas públicas (para el HTML estático y el sitemap). */
export function staticPaths() {
  return [
    '/', '/catalogo',
    ...OBJECTS.map((o) => `/crear/${o.id}`),
    '/guias', ...GUIDES.map((g) => `/guias/${g.slug}`), '/galeria',
    '/ayuda', '/acerca', '/contacto', '/condiciones', '/privacidad',
  ];
}
