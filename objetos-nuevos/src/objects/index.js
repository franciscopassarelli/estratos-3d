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

export const CATEGORIES = [
  { id: 'hogar', label: 'Hogar y decoración', blurb: 'Macetas, soportes y adornos' },
  { id: 'accesorios', label: 'Accesorios', blurb: 'Llaveros, colgantes e identificadores' },
  { id: 'organizacion', label: 'Organización', blurb: 'Cajas, bandejas y separadores' },
  { id: 'negocios', label: 'Negocios', blurb: 'Carteles, placas y exhibidores' },
  { id: 'tecnologia', label: 'Gaming y tecnología', blurb: 'Soportes para celulares, mandos y auriculares' },
  { id: 'personalizados', label: 'Objetos personalizados', blurb: 'Nombres, iniciales y símbolos propios' },
];

export const OBJECTS = [
  keychain, namePlate, phoneStand, deskOrganizer, planter,
  qrDisplay, wifiSign, qrKeychain, coasters, lampShade,
  drawerTray, headphoneStand, controllerStand, laptopStand, slideSign,
];

// Objetos que también encajan en otras categorías
const EXTRA = {
  llavero: ['personalizados'], placa: ['personalizados', 'hogar'], organizador: ['hogar'], 'soporte-celular': ['accesorios'],
  'display-qr': ['personalizados'], 'cartel-wifi': ['hogar'], 'llavero-qr': ['personalizados'], posavasos: ['personalizados'],
  'bandeja-cajon': ['hogar'], 'soporte-auriculares': ['personalizados'], 'soporte-notebook': ['organizacion'], 'cartel-deslizante': ['organizacion'],
};

export const categoriesOf = (obj) => [obj.category, ...(EXTRA[obj.id] || [])];
export const getObject = (id) => OBJECTS.find((o) => o.id === id);
