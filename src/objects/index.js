// Registro de objetos. Para sumar un objeto nuevo: crear un módulo con
// { id, name, category, description, defaults, sections, orientations, build(params) }
// y agregarlo a OBJECTS.
import keychain from './keychain.js';
import phoneStand from './phoneStand.js';
import deskOrganizer from './deskOrganizer.js';
import namePlate from './namePlate.js';
import planter from './planter.js';
import qrDisplay from './qrDisplay.js';
import wifiSign from './wifiSign.js';
import qrKeychain from './qrKeychain.js';
import coasters from './coasters.js';
import flexiName from './flexiName.js';
import badgeKeychain from './badgeKeychain.js';
import letteringKeychain from './letteringKeychain.js';
import initialKeychain from './initialKeychain.js';
import capsuleTower from './capsuleTower.js';
import tissueBox from './tissueBox.js';
import glassWineRack from './glassWineRack.js';
import drawerTray from './drawerTray.js';
import headphoneStand from './headphoneStand.js';
import controllerStand from './controllerStand.js';
import laptopStand from './laptopStand.js';
import slideSign from './slideSign.js';
import ornament from './ornament.js';
import treeTopper from './treeTopper.js';
import snowflake from './snowflake.js';
import napkinRing from './napkinRing.js';
import coneTree from './coneTree.js';
import remoteCaddy from './remoteCaddy.js';
import honeycombKeyRack from './honeycombKeyRack.js';
import honeycombPenHolder from './honeycombPenHolder.js';
import lowPolyVase from './lowPolyVase.js';
import ledLamp from './ledLamp.js';
import swingBin from './swingBin.js';
import wineRack from './wineRack.js';
import makeupHolder from './makeupHolder.js';
import lipstickHolder from './lipstickHolder.js';
import monsteraCoaster from './monsteraCoaster.js';
import gingerbread from './gingerbread.js';
import candyCane from './candyCane.js';
import zigzagTree from './zigzagTree.js';

// Categorías y subcategorías del catálogo. Cada diseño está en UNA sola subcategoría:
// para sumar un diseño nuevo, agregá su id en la lista que corresponda.
// «Con tu nombre» es un filtro aparte: muestra los diseños donde se escribe un texto propio.
export const CATEGORIES = [
  { id: 'hogar', label: 'Hogar y decoración', blurb: 'Macetas, lámparas, cocina y la mesa', subs: [
    { id: 'plantas', label: 'Macetas y floreros', ids: ['maceta', 'florero-low-poly'] },
    { id: 'lamparas', label: 'Lámparas', ids: ['lampara-led'] },
    { id: 'mesa', label: 'Mesa y cocina', ids: ['posavasos', 'posavasos-monstera', 'botellero', 'botellero-copas', 'porta-capsulas'] },
  ] },
  { id: 'accesorios', label: 'Accesorios', blurb: 'Llaveros con nombre, inicial, frase, articulados o con QR', subs: [
    { id: 'llaveros', label: 'Llaveros', ids: ['llavero', 'llavero-articulado', 'llavero-lettering', 'llavero-placa', 'llavero-inicial', 'llavero-qr'] },
  ] },
  { id: 'organizacion', label: 'Organización', blurb: 'Escritorio, cajones, living, baño y maquillaje', subs: [
    { id: 'escritorio', label: 'Escritorio', ids: ['organizador', 'portalapices-panal', 'tachito-tapa'] },
    { id: 'cajones', label: 'Cajones', ids: ['bandeja-cajon'] },
    { id: 'casa', label: 'Living y entrada', ids: ['organizador-controles', 'llavero-pared-panal', 'caja-panuelos'] },
    { id: 'tocador', label: 'Baño y maquillaje', ids: ['organizador-maquillaje', 'organizador-labiales'] },
  ] },
  { id: 'negocios', label: 'Negocios', blurb: 'Carteles con QR, placas y señalética', subs: [
    { id: 'qr', label: 'Carteles con QR', ids: ['display-qr', 'cartel-wifi'] },
    { id: 'senales', label: 'Placas y señalética', ids: ['placa', 'cartel-deslizante'] },
  ] },
  { id: 'tecnologia', label: 'Gaming y tecnología', blurb: 'Soportes para celular, notebook, joysticks y auriculares', subs: [
    { id: 'soportes', label: 'Celular y notebook', ids: ['soporte-celular', 'soporte-notebook'] },
    { id: 'gaming', label: 'Gaming', ids: ['soporte-auriculares', 'soporte-mandos'] },
  ] },
  { id: 'personalizados', label: 'Con tu nombre', blurb: 'Diseños donde escribís tu nombre o un texto', personal: true },
  // De temporada: solo aparecen con su propio filtro (no en «Todos» ni en las demás categorías)
  { id: 'navidad', label: 'Adornos navideños', blurb: 'Adornos con nombre, galletita de jengibre, bastón de caramelo, arbolitos, estrella y copos', seasonal: true, subs: [
    { id: 'adornos', label: 'Adornos navideños', ids: ['adorno-navidad', 'estrella-arbol', 'copo-nieve', 'arbol-conico', 'arbol-zigzag', 'galleta-jengibre', 'baston-caramelo', 'servilletero'] },
  ] },
];

export const OBJECTS = [
  keychain, namePlate, phoneStand, deskOrganizer, planter,
  qrDisplay, wifiSign, qrKeychain, coasters,
  drawerTray, headphoneStand, controllerStand, laptopStand, slideSign,
  ornament, treeTopper, snowflake, napkinRing, coneTree,
  remoteCaddy, honeycombKeyRack, honeycombPenHolder, lowPolyVase, ledLamp, swingBin,
  wineRack, makeupHolder, lipstickHolder, monsteraCoaster,
  flexiName, badgeKeychain, letteringKeychain, initialKeychain,
  capsuleTower, tissueBox, glassWineRack,
  gingerbread, candyCane, zigzagTree,
];

// Acabado de la vista previa (mate, seda o metal) para los diseños navideños: solo cambia cómo se ve en pantalla,
// el color de filamento lo elige cada uno. Se agrega acá para no repetirlo en cada diseño.
const FINISH_DEFAULT = { 'adorno-navidad': 'seda', 'estrella-arbol': 'metal', 'copo-nieve': 'seda', servilletero: 'seda', 'arbol-conico': 'seda', 'galleta-jengibre': 'mate', 'baston-caramelo': 'seda', 'arbol-zigzag': 'seda' };
const FINISH_SECTION = { title: 'Acabado de la vista', items: [{ key: 'finish', type: 'cards', label: 'Brillo', help: 'Solo cambia cómo se ve acá. En la impresora el brillo lo da el filamento: elegí uno «seda» o metalizado.', options: [
  { value: 'mate', label: 'Mate', hint: 'PLA común' },
  { value: 'seda', label: 'Seda', hint: 'Brillo satinado' },
  { value: 'metal', label: 'Metal', hint: 'Metalizado' },
] }] };
for (const o of OBJECTS) {
  const d = FINISH_DEFAULT[o.id];
  if (!d) continue;
  o.defaults.finish = d;
  o.sections.push(FINISH_SECTION);
  const build = o.build;
  o.build = function (p, orientation) { const r = build.call(this, p, orientation); for (const pt of r.parts) if (pt) pt.finish = p.finish; return r; };
}

const SUB_OF = new Map();
for (const c of CATEGORIES) for (const sub of c.subs || []) for (const id of sub.ids) SUB_OF.set(id, { category: c, sub });
// La categoría de cada diseño sale de la tabla de arriba (así la etiqueta de la tarjeta coincide con el filtro).
for (const o of OBJECTS) { const t = SUB_OF.get(o.id); if (t) o.category = t.category.id; }

/** Diseños donde el usuario escribe un texto propio (nombre, frase, etiqueta). */
const PERSONAL = new Set(['llavero', 'llavero-articulado', 'llavero-lettering', 'llavero-placa', 'llavero-inicial', 'llavero-qr', 'placa', 'posavasos', 'soporte-auriculares', 'soporte-mandos', 'organizador', 'cartel-deslizante']);

export const subOf = (obj) => SUB_OF.get(obj.id)?.sub || null;
export const categoriesOf = (obj) => [obj.category, ...(PERSONAL.has(obj.id) ? ['personalizados'] : [])];
/** Diseños de una categoría (y subcategoría opcional). */
const SEASONAL = new Set(CATEGORIES.filter((c) => c.seasonal).flatMap((c) => c.subs.flatMap((s) => s.ids)));
export const isSeasonal = (obj) => SEASONAL.has(obj.id);
/** Diseños de todo el año (lo que muestra «Todos»). */
export const MAIN_OBJECTS = OBJECTS.filter((o) => !SEASONAL.has(o.id));
export function objectsIn(catId, subId) {
  if (!catId || catId === 'all') return MAIN_OBJECTS;
  const cat = CATEGORIES.find((c) => c.id === catId);
  if (!cat) return MAIN_OBJECTS;
  if (cat.personal) return MAIN_OBJECTS.filter((o) => PERSONAL.has(o.id));
  const sub = subId && cat.subs.find((s) => s.id === subId);
  const ids = new Set(sub ? sub.ids : cat.subs.flatMap((s) => s.ids));
  return OBJECTS.filter((o) => ids.has(o.id));
}
export const getObject = (id) => OBJECTS.find((o) => o.id === id);
