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
import { helpPage, pedidosPage, aboutPage, contactPage, termsPage, privacyPage, guidesIndexPage, guidePage, galleryPage, eventPage, mountEvent, notFoundPage, mountContent } from './ui/pages.js';
import { EVENTS } from './content/events.js';
import { bindLightbox } from './ui/lightbox.js';

const noop = () => () => {};
const catalogState = { category: 'all', sub: 'all', query: '' };

/** Título de una página de diseño: el más completo que entre en ~60 caracteres (lo que muestra Google). */
function objectTitle(o) {
  const tail = ` | ${SITE.name}`;
  const base = /personaliz/i.test(o.name) ? o.name : `${o.name} personalizable`;
  for (const t of [`${base} para imprimir en 3D`, `${o.name} para imprimir en 3D`, `${o.name} en 3D`, o.name]) if (t.length + tail.length <= 60) return t + tail;
  return o.name + tail;
}

/** Descripción de una página de diseño: la idea principal en ~155 caracteres, sin cortar frases a la mitad. */
function objectDescription(o, max = 155) {
  const tail = ' Vista previa 3D y descarga en 3MF, STL u OBJ.';
  if ((o.description + tail).length <= max) return o.description + tail;
  const room = max - tail.length;
  const sentences = o.description.match(/[^.]+\.?/g) || [o.description];
  let out = '';
  for (const sent of sentences) { if ((out + sent).trim().length > room) break; out += sent; }
  out = out.trim();
  if (!out) { out = o.description.slice(0, room - 1).replace(/[\s,;:]+\S*$/, '') + '…'; }
  return out + tail;
}

export const ROUTES = [
  {
    pattern: /^\/$/, section: 'inicio',
    meta: () => ({ title: `${SITE.name}: objetos personalizados para imprimir en 3D`, description: 'Diseñá llaveros, placas, macetas, soportes y organizadores a medida, con vista previa 3D, y descargá archivos 3MF, STL u OBJ gratis.' }),
    render: () => homePage(), mount: (root) => mountHome(root),
  },
  {
    pattern: /^\/catalogo$/, section: 'catalogo',
    meta: () => ({ title: `Catálogo de diseños | ${SITE.name}`, description: 'Objetos paramétricos para imprimir en 3D: hogar, accesorios, organización, negocios y tecnología. Elegí uno y personalizalo.' }),
    render: (_, q) => {
      const c = q?.get('categoria'), t = q?.get('tipo');
      if (c && CATEGORIES.some((x) => x.id === c)) { catalogState.category = c; catalogState.sub = 'all'; }
      if (t && CATEGORIES.find((x) => x.id === catalogState.category)?.subs?.some((s) => s.id === t)) catalogState.sub = t;
      return catalogPage(catalogState);
    },
    mount: (root) => mountCatalog(root, catalogState),
  },
  {
    pattern: /^\/crear\/([a-z0-9-]+)$/, section: 'catalogo',
    exists: ([id]) => !!getObject(id),
    meta: ([id]) => { const o = getObject(id); return { title: objectTitle(o), description: objectDescription(o) }; },
    render: ([id]) => editorPage(id), mount: (root, [id], query) => mountEditor(root, id, query),
  },
  {
    pattern: /^\/guias$/, section: 'guias',
    meta: () => ({ title: `Guías de diseño e impresión 3D | ${SITE.name}`, description: 'Medidas recomendadas, materiales, formatos de archivo y trucos para imprimir a varios colores.' }),
    render: () => guidesIndexPage(), mount: (root) => mountContent(root),
  },
  {
    pattern: /^\/guias\/([a-z0-9-]+)$/, section: 'guias',
    exists: ([slug]) => !!getGuide(slug),
    meta: ([slug]) => { const g = getGuide(slug); const full = `${g.title} | ${SITE.name}`; return { title: full.length <= 62 ? full : g.title, description: g.description, type: 'article' }; },
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
    render: () => galleryPage(), mount: (root) => { const off = bindLightbox(root); mountContent(root); return off; },
  },
  ...EVENTS.map((ev) => ({
    pattern: new RegExp(`^${ev.path}$`), section: `evento-${ev.id}`,
    meta: () => ({ title: `${ev.title} | ${SITE.name}`, description: ev.description }),
    render: () => eventPage(ev.id), mount: (root) => mountEvent(root, ev.id),
  })),
  { pattern: /^\/pedidos$/, section: 'pedidos', meta: () => ({ title: `Pedí tu pieza impresa en 3D | ${SITE.name}`, description: 'Pedí tu diseño ya impreso en 3D: llaveros con nombre, carteles con QR, organizadores y adornos. Entrega en unos 2 días. Pedilo por WhatsApp.' }), render: pedidosPage, mount: mountContent },
  { pattern: /^\/ayuda$/, section: 'ayuda', meta: () => ({ title: `Preguntas frecuentes | ${SITE.name}`, description: 'Respuestas sobre formatos de archivo, impresión a dos colores, comprobaciones y uso del editor.' }), render: helpPage, mount: mountContent },
  { pattern: /^\/acerca$/, section: 'ayuda', meta: () => ({ title: `Acerca de | ${SITE.name}`, description: `Qué es ${SITE.name}, quién lo hace y cómo se usa: un catálogo gratuito de objetos personalizables para imprimir en 3D, con guías y piezas por encargo.` }), render: aboutPage, mount: mountContent },
  { pattern: /^\/contacto$/, section: 'ayuda', meta: () => ({ title: `Contacto | ${SITE.name}`, description: `Escribinos por consultas, errores en un diseño, ideas de objetos nuevos o para pedir una pieza impresa en 3D. Te contamos cómo hacerlo.` }), render: contactPage, mount: mountContent },
  { pattern: /^\/condiciones$/, section: 'ayuda', meta: () => ({ title: `Condiciones de uso | ${SITE.name}`, description: `Condiciones de uso de ${SITE.name}: uso gratuito del editor, propiedad de los objetos, piezas por encargo y recomendaciones de seguridad.` }), render: termsPage, mount: mountContent },
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
    '/guias', ...GUIDES.map((g) => `/guias/${g.slug}`), '/galeria', ...EVENTS.map((e) => e.path),
    '/pedidos', '/ayuda', '/acerca', '/contacto', '/condiciones', '/privacidad',
  ];
}
