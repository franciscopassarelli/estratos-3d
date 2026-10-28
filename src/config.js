// Configuración del sitio. Completá estos datos antes de publicar.
export const SITE = {
  name: 'Estratos 3D',
  // Dominio final, con https y sin barra al final. Se usa en canonical, sitemap y redes sociales.
  url: 'https://estratos3d.com',
  // Correo público de contacto (obligatorio para AdSense: la web debe tener un contacto real).
  email: 'contacto@estratos3d.com',
  // Responsable del sitio, para la política de privacidad (nombre o razón social).
  owner: 'Francisco Passarelli',
  country: 'Argentina',
  lang: 'es-AR',
  // Fecha de la última revisión de los textos legales (AAAA-MM-DD).
  legalUpdated: '2026-10-26',

  // ---- AdSense ----
  // ID de editor tal como lo muestra AdSense: 'ca-pub-0000000000000000'.
  // Vacío = se muestran los espacios de prueba con la palabra ANUNCIO.
  adsenseClient: '',
  // IDs de los bloques de anuncios creados en AdSense > Anuncios > Por bloque de anuncios.
  adSlots: {
    banner: '', // horizontal, debajo del contenido de cada página
    inline: '', // intermedio, entre secciones y dentro de las guías
  },
};

// ---- Sorteos ----
// Clave pública (site key) de Cloudflare Turnstile para el formulario de sorteos.
// Vacío = sin verificación anti-robots visible (igual hay otras protecciones). Ver SORTEOS.md.
SITE.turnstileSiteKey = '';

// ---- Google Analytics 4 ----
// ID de medición tal como lo muestra Analytics: 'G-XXXXXXXXXX'. Vacío = sin Analytics.
SITE.gaId = 'G-G98H26X4CD';

export const adsEnabled = () => /^ca-pub-\d{10,}$/.test(SITE.adsenseClient);
export const analyticsEnabled = () => /^G-[A-Z0-9]{6,}$/.test(SITE.gaId);
