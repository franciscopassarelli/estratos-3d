// Sorteos y promociones de Estratos 3D.
//
// Para crear una promoción nueva: copiá un bloque, cambiá el `slug` (queda en la
// dirección /sorteos/<slug>) y completá los textos. Para quitarla de la web,
// poné `visible: false` (los datos de los participantes quedan en la base hasta
// que los borres desde el panel).
//
// Fechas: formato ISO con la zona horaria de Argentina, por ejemplo
// '2026-11-15T18:00:00-03:00'. Dejá null lo que todavía no está definido.
//
// Este archivo lo usan la página pública, el panel /admin y el servidor
// (functions/), así que no importes nada del navegador acá.

export const PROMOS = [
  {
    slug: 'torneo-tenis',
    visible: true,
    // Muestra un aviso con enlace al sorteo en la página de inicio.
    featured: true,
    eyebrow: 'Sorteo Estratos 3D',
    title: 'Sorteo del Torneo de Tenis',
    intro: 'Anotate gratis en un minuto y participá por premios impresos en 3D. Solo necesitamos tu nombre y una forma de contactarte si ganás.',
    event: {
      name: 'Torneo de Tenis',
      place: '', // Ej.: 'Club Atlético …, Paso del Rey'
    },
    opensAt: null, // null = abierto desde que se publica
    closesAt: null, // null = abierto hasta que lo cierres desde el panel
    drawAt: null, // fecha del sorteo, se muestra en la página
    // Premios. Si la lista está vacía se muestra "Premios a confirmar".
    // image: ruta de una foto en public/ (ej. '/sorteos/torneo-tenis/premio1.jpg').
    // objectId: si no hay foto, se muestra la vista 3D de ese diseño del catálogo.
    prizes: [],
    showCount: true, // muestra "N personas ya participan"
    contactTypes: ['whatsapp', 'email', 'instagram'],
    // Reglas extra, además de las generales que se arman solas con las fechas.
    extraRules: [
      'Los premios no se pueden cambiar por dinero.',
    ],
    // Mensaje que se prepara al contactar a un participante desde el panel.
    contactMessage: (name) => `¡Hola ${name}! Te escribo de Estratos 3D por el sorteo del torneo de tenis.`,
    shareText: 'Me anoté en el sorteo de Estratos 3D del torneo de tenis. Anotate gratis acá:',
  },
];

export const getPromo = (slug) => PROMOS.find((p) => p.slug === slug && p.visible);
export const featuredPromo = () => PROMOS.find((p) => p.visible && p.featured);

/**
 * Estado efectivo de una promoción.
 * state: fila de promo_state en la base ({ status: 'abierto'|'cerrado'|null, winner_published }).
 */
export function promoStatus(promo, state, now = new Date()) {
  if (state && state.winner_published) return 'finalizado';
  if (state && state.status === 'cerrado') return 'cerrado';
  if (state && state.status === 'abierto') return 'abierto';
  if (promo.opensAt && now < new Date(promo.opensAt)) return 'proximamente';
  if (promo.closesAt && now > new Date(promo.closesAt)) return 'cerrado';
  return 'abierto';
}

export const STATUS_LABEL = {
  proximamente: 'Próximamente',
  abierto: 'Inscripción abierta',
  cerrado: 'Inscripción cerrada',
  finalizado: 'Sorteo realizado',
};

const fmtDate = (iso) => new Date(iso).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) + ' h';
export const formatPromoDate = (iso) => (iso ? fmtDate(iso) : null);

/** Bases y condiciones: generales + las propias de la promoción. */
export function promoRules(promo, siteName) {
  const r = [
    'La participación es gratuita y no requiere ninguna compra.',
    'Cada persona puede anotarse una sola vez. Las inscripciones repetidas o con datos falsos se eliminan.',
    promo.closesAt ? `Podés anotarte hasta el ${fmtDate(promo.closesAt)}.` : 'Podés anotarte mientras la inscripción figure como abierta en esta página.',
    promo.drawAt ? `El sorteo se realiza el ${fmtDate(promo.drawAt)}, por selección al azar entre todas las personas anotadas.` : 'El sorteo se realiza por selección al azar entre todas las personas anotadas. La fecha se publica en esta página.',
    'Contactamos a quien gane por el medio que dejó al anotarse. Si no responde en 7 días, se sortea un suplente.',
    `Tus datos se usan solo para este sorteo y se eliminan dentro de los 90 días de finalizado. No los compartimos con nadie. Más detalles en la política de privacidad de ${siteName}.`,
    ...(promo.extraRules || []),
  ];
  return r;
}
