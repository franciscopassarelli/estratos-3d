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
import lampShade from './lampShade.js';
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

// Categorías y subcategorías del catálogo. Cada diseño está en UNA sola subcategoría:
// para sumar un diseño nuevo, agregá su id en la lista que corresponda.
// «Con tu nombre» es un filtro aparte: muestra los diseños donde se escribe un texto propio.
export const CATEGORIES = [
  { id: 'hogar', label: 'Hogar y decoración', blurb: 'Macetas, lámparas, adornos y la mesa', subs: [
    { id: 'navidad', label: 'Navidad', ids: ['adorno-navidad', 'estrella-arbol', 'copo-nieve', 'arbol-conico', 'servilletero'] },
    { id: 'plantas', label: 'Macetas y floreros', ids: ['maceta', 'florero-low-poly'] },
    { id: 'lamparas', label: 'Lámparas', ids: ['lampara-led', 'pantalla-lampara'] },
    { id: 'mesa', label: 'Mesa y cocina', ids: ['posavasos', 'posavasos-monstera', 'botellero'] },
  ] },
  { id: 'accesorios', label: 'Accesorios', blurb: 'Llaveros con nombre o con QR', subs: [
    { id: 'llaveros', label: 'Llaveros', ids: ['llavero', 'llavero-qr'] },
  ] },
  { id: 'organizacion', label: 'Organización', blurb: 'Escritorio, cajones, living, baño y maquillaje', subs: [
    { id: 'escritorio', label: 'Escritorio', ids: ['organizador', 'portalapices-panal', 'tachito-tapa'] },
    { id: 'cajones', label: 'Cajones', ids: ['bandeja-cajon'] },
    { id: 'casa', label: 'Living y entrada', ids: ['organizador-controles', 'llavero-pared-panal'] },
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
];

export const OBJECTS = [
  keychain, namePlate, phoneStand, deskOrganizer, planter,
  qrDisplay, wifiSign, qrKeychain, coasters, lampShade,
  drawerTray, headphoneStand, controllerStand, laptopStand, slideSign,
  ornament, treeTopper, snowflake, napkinRing, coneTree,
  remoteCaddy, honeycombKeyRack, honeycombPenHolder, lowPolyVase, ledLamp, swingBin,
  wineRack, makeupHolder, lipstickHolder, monsteraCoaster,
];

const SUB_OF = new Map();
for (const c of CATEGORIES) for (const sub of c.subs || []) for (const id of sub.ids) SUB_OF.set(id, { category: c, sub });
// La categoría de cada diseño sale de la tabla de arriba (así la etiqueta de la tarjeta coincide con el filtro).
for (const o of OBJECTS) { const t = SUB_OF.get(o.id); if (t) o.category = t.category.id; }

/** Diseños donde el usuario escribe un texto propio (nombre, frase, etiqueta). */
const PERSONAL = new Set(['llavero', 'llavero-qr', 'placa', 'adorno-navidad', 'posavasos', 'soporte-auriculares', 'soporte-mandos', 'organizador', 'cartel-deslizante']);

export const subOf = (obj) => SUB_OF.get(obj.id)?.sub || null;
export const categoriesOf = (obj) => [obj.category, ...(PERSONAL.has(obj.id) ? ['personalizados'] : [])];
/** Diseños de una categoría (y subcategoría opcional). */
export function objectsIn(catId, subId) {
  if (!catId || catId === 'all') return OBJECTS;
  const cat = CATEGORIES.find((c) => c.id === catId);
  if (!cat) return OBJECTS;
  if (cat.personal) return OBJECTS.filter((o) => PERSONAL.has(o.id));
  const sub = subId && cat.subs.find((s) => s.id === subId);
  const ids = new Set(sub ? sub.ids : cat.subs.flatMap((s) => s.ids));
  return OBJECTS.filter((o) => ids.has(o.id));
}
export const getObject = (id) => OBJECTS.find((o) => o.id === id);
