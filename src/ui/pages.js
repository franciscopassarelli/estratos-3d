// Páginas de contenido: guías, ayuda, acerca, contacto, condiciones y privacidad.
import { SITE, analyticsEnabled } from '../config.js';
import { GUIDES, getGuide } from '../content/guides.js';
import { galleryItems } from '../content/gallery.js';
import { getEvent, presetHref, EVENTS } from '../content/events.js';
import { renderPresetThumbs } from './thumbnails.js';
import { IDEA_THUMBS, IDEA_THUMB_VERSION } from '../content/ideaThumbs.js';
import { THUMB_VERSION, THUMBS } from '../content/thumbs.js';
import { getObject } from '../objects/index.js';
import { adSlot } from './ads.js';
import { esc, icon } from './dom.js';
import { PEDIDOS } from '../content/pedidos.js';
import { generalOrderLink } from '../content/contact.js';

const INFO = [
  { path: '/pedidos', label: 'Pedí tu pieza impresa' },
  { path: '/ayuda', label: 'Preguntas frecuentes' },
  { path: '/acerca', label: 'Acerca de' },
  { path: '/contacto', label: 'Contacto' },
  { path: '/condiciones', label: 'Condiciones de uso' },
  { path: '/privacidad', label: 'Política de privacidad' },
];

const fmtDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

function infoLayout(active, inner) {
  return `
  <main class="wrap info">
    <nav aria-label="Información">${INFO.map((s) => `<a href="${s.path}" aria-current="${s.path === active}">${s.label}</a>`).join('')}</nav>
    <article>${inner}</article>
  </main>`;
}

export function helpPage() {
  return infoLayout('/ayuda', `
    <section>
      <span class="eyebrow">Ayuda</span>
      <h1>Preguntas frecuentes</h1>
      <details open><summary>¿Necesito saber modelado 3D?</summary><p>No. Cada objeto tiene controles pensados para él: medidas, texto, tipografía y colores. La geometría se recalcula sola y la ves en 3D mientras cambiás los valores.</p></details>
      <details><summary>¿Qué formato descargo?</summary><p>3MF si tu laminador es Bambu Studio, PrusaSlicer, OrcaSlicer o Cura, porque guarda cada color como una pieza aparte. STL si tu programa no lee 3MF. OBJ si vas a editar el modelo en otro programa. Lo explicamos en detalle en <a href="/guias/3mf-stl-obj-diferencias">esta guía</a>.</p></details>
      <details><summary>¿Cómo imprimo a dos colores sin una impresora multicolor?</summary><p>Con un cambio de filamento en la primera capa del texto. Seguí <a href="/guias/imprimir-dos-colores-sin-multicolor">el paso a paso</a>.</p></details>
      <details><summary>¿El archivo está garantizado para imprimir bien?</summary><p>Cada archivo se genera con mallas cerradas, y la herramienta revisa paredes finas, trazos de texto delgados, piezas sueltas, voladizos de más de 45° y el tamaño de la cama. Son comprobaciones básicas: revisá siempre la vista previa de capas de tu laminador antes de imprimir.</p></details>
      <details><summary>¿Por qué algunas letras o símbolos no aparecen?</summary><p>Las tipografías incluyen letras latinas con tildes y ñ, pero no emojis. Para decorar, usá los símbolos del editor: están dibujados como geometría imprimible.</p></details>
      <details><summary>¿Se guardan mis diseños?</summary><p>Tus últimos valores de cada objeto quedan guardados solo en este navegador, para que no los pierdas al recargar. No se envían a ningún servidor.</p></details>
      <details><summary>¿Puedo pedirlo ya impreso?</summary><p>Sí. En cada objeto hay un botón “Pedilo impreso” que abre WhatsApp con tu diseño. Mirá <a href="/pedidos">cómo funciona</a>.</p></details>
      <details><summary>¿Tiene costo?</summary><p>No. El sitio se mantiene con publicidad.</p></details>
    </section>`);
}

export function pedidosPage() {
  const ev = EVENTS[0];
  const ver = (src) => `${src}?v=${src.includes('/ideas/') ? IDEA_THUMB_VERSION : THUMB_VERSION}`;
  const fotoDe = (p) => p.foto || (THUMBS.has(p.objeto) ? `/miniaturas/${p.objeto}.webp` : '');
  const card = (p) => {
    const href = p.objeto && getObject(p.objeto) ? presetHref({ objeto: p.objeto, params: p.params }) : '';
    const src = fotoDe(p);
    const img = src ? `<img src="${esc(ver(src))}" alt="${esc(p.nombre)}" width="960" height="720" loading="lazy" decoding="async">` : '';
    return `<div class="pc-card">
      ${href ? `<a class="pc-foto" href="${esc(href)}" tabindex="-1" aria-hidden="true">${img}</a>` : `<span class="pc-foto">${img}</span>`}
      <h4>${esc(p.nombre)}</h4>
      <p>${esc(p.nota || '')}</p>
      <div class="pc-pie"><span class="pc-monto"><small>desde</small> ${esc(p.desde)}</span><a class="pedir-fila" data-order="precios" data-objeto="${esc(p.nombre)}" href="${esc(generalOrderLink(`¡Hola! Quiero pedir: ${p.nombre}.`))}" target="_blank" rel="noopener" aria-label="Pedir ${esc(p.nombre)} por WhatsApp">Pedir</a></div>
      ${href ? `<a class="pc-ver" href="${esc(href)}">Ver y personalizar</a>` : ''}
    </div>`;
  };
  const total = PEDIDOS.grupos.reduce((n, g) => n + g.items.length, 0);
  const precios = PEDIDOS.grupos.length
    ? `<div class="pp-tabs" role="group" aria-label="Categorías"><button type="button" data-cat="" aria-pressed="true">Todos <small>${total}</small></button>${PEDIDOS.grupos.map((g) => `<button type="button" data-cat="${esc(g.id)}" aria-pressed="false">${esc(g.titulo)} <small>${g.items.length}</small></button>`).join('')}</div>
      ${PEDIDOS.grupos.map((g) => `<section class="pp-group" data-cat="${esc(g.id)}" aria-label="${esc(g.titulo)}">
        <h3>${esc(g.titulo)}</h3>
        <div class="pp-grid">${g.items.map(card).join('')}</div>
      </section>`).join('')}
      <p class="note">Precios de referencia por unidad, actualizados en ${esc(PEDIDOS.actualizado)}. Las fotos son vistas 3D del diseño. El valor final depende del tamaño, los colores y la cantidad, y te lo confirmamos por WhatsApp antes de imprimir. ¿No ves lo que buscás? Pedinos la cotización de cualquier otro diseño del <a href="/catalogo">catálogo</a>.</p>`
    : '<p>El precio depende del diseño, el tamaño, los colores y la cantidad. Te lo pasamos por WhatsApp antes de imprimir, sin compromiso.</p>';
  return `
  <main class="wrap pedidos-page">
    <header class="pp-head">
      <span class="eyebrow">Pedidos</span>
      <h1>Pedí tu pieza impresa en 3D</h1>
      <p>¿Diseñaste algo y no tenés impresora? Te lo imprimimos. Elegí el objeto, ajustalo en la web y mandanos el pedido por WhatsApp: llega con el link a tu diseño y todos tus ajustes.</p>
      <div class="row-actions">
        <a class="btn btn-order btn-lg" data-order="pedidos" href="${esc(generalOrderLink())}" target="_blank" rel="noopener">Pedir por WhatsApp</a>
        <a class="btn btn-lg btn-soft" href="/catalogo">Elegir un diseño</a>
      </div>
    </header>
    <ol class="pp-steps">
      <li><b>1 · Elegí y personalizá</b><span>Abrí un diseño y cambiá nombre, medidas y colores.</span></li>
      <li><b>2 · Pedilo por WhatsApp</b><span>Se abre con el link de tu diseño y los ajustes ya cargados.</span></li>
      <li><b>3 · Confirmamos</b><span>Te pasamos precio, colores disponibles y forma de entrega.</span></li>
      <li><b>4 · Lo imprimimos</b><span>Lo recibís en ${esc(PEDIDOS.plazo)} desde que confirmás. También tandas: por ejemplo, 30 llaveros para un evento.</span></li>
    </ol>
    <section class="pp-precios" id="precios">
      <h2>Precios y productos</h2>
      ${precios}
    </section>
    <div class="pp-more">
      <section>
        <h2>Ideas para pedir</h2>
        <ul>
          <li><a href="/catalogo?categoria=accesorios">Llaveros con nombre</a> para souvenirs de cumpleaños, eventos y regalos.</li>
          <li><a href="/catalogo?categoria=negocios">Carteles con QR y placas</a> para tu local o emprendimiento.</li>
          <li><a href="/catalogo?categoria=organizacion">Organizadores</a> de escritorio, cajones y baño.</li>
          ${ev ? `<li><a href="${ev.path}">Adornos de ${esc(ev.label)}</a> con el nombre de cada uno.</li>` : ''}
        </ul>
      </section>
      <section>
        <h2>Preguntas</h2>
        <details><summary>¿Puedo pedir varias unidades?</summary><p>Sí. Para souvenirs, eventos o negocios armamos tandas. Contanos la cantidad y te pasamos el precio.</p></details>
        <details><summary>¿Cómo pago y cómo lo recibo?</summary><p>Lo acordamos por WhatsApp antes de imprimir, según lo que te quede mejor.</p></details>
        <details><summary>¿Hace falta que descargue el archivo?</summary><p>No. Con tocar “Pedilo impreso” alcanza: nosotros abrimos tu diseño con los mismos ajustes.</p></details>
      </section>
    </div>
  </main>`;
}

export function aboutPage() {
  return infoLayout('/acerca', `
    <section>
      <span class="eyebrow">Acerca de</span>
      <h1>${esc(SITE.name)}</h1>
      <p>${esc(SITE.name)} es un generador gratuito de objetos para impresión 3D. Cada diseño del catálogo es un pequeño programa que construye la pieza a partir de tus medidas: dibuja los contornos, los combina con operaciones geométricas, los extruye en capas y verifica el resultado antes de exportarlo.</p>
      <p>La idea es que cualquier persona con una impresora 3D pueda hacer un llavero, una placa o un organizador a medida sin aprender un programa de modelado.</p>
      <h2>Cómo funciona por dentro</h2>
      <ul>
        <li>Todo se calcula en tu navegador: tus diseños no salen de tu computadora.</li>
        <li>Las medidas están en milímetros, con el eje Z hacia arriba, igual que en los laminadores.</li>
        <li>Las tipografías son libres (SIL Open Font License): Archivo Black, Titan One, Pacifico y Bungee.</li>
        <li>El visor 3D usa Three.js.</li>
      </ul>
      <p>También publicamos <a href="/guias">guías</a> sobre diseño, materiales e impresión.</p>
    </section>`);
}

export function contactPage() {
  const mail = SITE.email ? `<p class="contact-mail mono">${esc(SITE.email)}</p>
    <div class="row-actions"><button class="btn btn-sm" type="button" data-copy="${esc(SITE.email)}">Copiar dirección</button><a class="btn btn-sm btn-ghost" href="mailto:${esc(SITE.email)}">Abrir correo</a></div>`
    : '<p class="note">La dirección de contacto todavía no está configurada.</p>';
  return infoLayout('/contacto', `
    <section>
      <span class="eyebrow">Contacto</span>
      <h1>Escribinos</h1>
      <p>Para consultas, errores en algún diseño o ideas de nuevos objetos, escribinos a:</p>
      ${mail}
      <p>Si reportás un problema con un archivo, contanos qué objeto usaste, los valores principales y en qué laminador lo abriste. Así podemos reproducirlo.</p>
    </section>`);
}

export function termsPage() {
  return infoLayout('/condiciones', `
    <section>
      <span class="eyebrow">Legal</span>
      <h1>Condiciones de uso</h1>
      <p class="note">Última actualización: ${fmtDate(SITE.legalUpdated)}</p>
      <ul>
        <li>Podés usar el sitio de forma gratuita para crear y descargar objetos.</li>
        <li>Los objetos que generes son tuyos: podés imprimirlos, regalarlos y venderlos.</li>
        <li>Los archivos se entregan tal como están. Verificalos en tu laminador y usá materiales adecuados para cada uso.</li>
        <li>Las comprobaciones automáticas no reemplazan tu criterio: el tamaño, la resistencia y la seguridad de cada objeto son responsabilidad de quien lo imprime y lo usa.</li>
        <li>No uses el sitio para generar contenido ilegal, ofensivo o que infrinja derechos de terceros, como marcas registradas en los textos.</li>
        <li>El sitio muestra publicidad de terceros. Ver la <a href="/privacidad">política de privacidad</a>.</li>
        <li>Podemos modificar estas condiciones. La fecha de arriba indica la última versión.</li>
      </ul>
    </section>`);
}

export function privacyPage() {
  const who = SITE.owner ? `${esc(SITE.owner)}, responsable de ${esc(SITE.name)}` : `El responsable de ${esc(SITE.name)}`;
  return infoLayout('/privacidad', `
    <section>
      <span class="eyebrow">Legal</span>
      <h1>Política de privacidad</h1>
      <p class="note">Última actualización: ${fmtDate(SITE.legalUpdated)}</p>
      <p>${who} explica en esta página qué datos se tratan cuando usás el sitio${SITE.url ? ` (${esc(SITE.url.replace(/^https?:\/\//, ''))})` : ''}.</p>

      <h2>Tus diseños</h2>
      <p>Los objetos se generan en tu navegador. Los textos, medidas y colores que elegís no se envían a nuestros servidores. Para no perder tu trabajo, el sitio guarda tus últimos valores en el almacenamiento local de tu navegador (localStorage). Podés borrarlos en cualquier momento desde la configuración del navegador.</p>

      <h2>Publicidad y cookies</h2>
      <p>Este sitio muestra anuncios de Google AdSense.</p>
      <ul>
        <li>Proveedores externos, incluido Google, usan cookies para mostrar anuncios según tus visitas anteriores a este y a otros sitios web.</li>
        <li>Las cookies de publicidad de Google permiten que Google y sus socios muestren anuncios basados en tus visitas a este sitio y a otros sitios de Internet.</li>
        <li>Podés desactivar la publicidad personalizada en la <a href="https://adssettings.google.com" target="_blank" rel="noopener">configuración de anuncios de Google</a>. También podés desactivar las cookies de otros proveedores en <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener">aboutads.info</a>.</li>
        <li>Para saber cómo usa Google los datos de los sitios que muestran sus anuncios, consultá <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">esta página de Google</a>.</li>
      </ul>
      <p>Si visitás el sitio desde el Espacio Económico Europeo, el Reino Unido o Suiza, antes de mostrar anuncios personalizados te vamos a pedir tu consentimiento mediante un mensaje de cookies certificado por Google.</p>

      <h2>Estadísticas de visitas</h2>
      <p>Para saber cuánta gente usa el sitio y qué páginas sirven más, usamos Cloudflare Web Analytics, que no usa cookies ni guarda datos que te identifiquen${analyticsEnabled() ? ', y Google Analytics, que usa cookies para contar visitas y ver cómo se navega el sitio (páginas vistas, país aproximado, tipo de dispositivo). Google Analytics no recibe tu nombre ni tus datos de contacto. Si visitás el sitio desde el Espacio Económico Europeo, el Reino Unido o Suiza, no se usan cookies de medición sin tu consentimiento. Podés bloquear Google Analytics con el <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">complemento oficial de inhabilitación</a>' : ''}.</p>

      <h2>Sorteos y promociones</h2>
      <p>Si te anotás en un sorteo, guardamos tu nombre, el medio de contacto que elegiste (WhatsApp, email o Instagram), la fecha de inscripción y, si viniste desde un enlace de difusión, de dónde llegaste. Para evitar inscripciones automáticas también guardamos una huella cifrada de tu conexión, que no permite conocer tu dirección IP.</p>
      <p>Usamos esos datos solo para organizar el sorteo y contactar a quien gane. No los compartimos con nadie y los eliminamos dentro de los 90 días de finalizado el sorteo. Del ganador publicamos únicamente el nombre y la inicial del apellido. Podés pedir que borremos tu inscripción en cualquier momento escribiendo a la dirección de contacto.</p>

      <h2>Datos técnicos</h2>
      <p>Como cualquier sitio web, el servidor de alojamiento puede registrar datos técnicos de cada visita, como la dirección IP, el navegador y la página visitada, con fines de seguridad y funcionamiento.</p>

      <h2>Contacto por correo</h2>
      <p>Si nos escribís, usamos tu dirección y tu mensaje solo para responderte.</p>

      <h2>Tus derechos</h2>
      <p>Podés pedir acceso, rectificación o supresión de tus datos personales escribiendo a ${SITE.email ? `<span class="mono">${esc(SITE.email)}</span>` : 'la dirección de la página de <a href="/contacto">contacto</a>'}. En Argentina, la Ley 25.326 de Protección de Datos Personales te garantiza esos derechos. La Agencia de Acceso a la Información Pública es el organismo de control y recibe denuncias por incumplimientos.</p>

      <h2>Cambios</h2>
      <p>Si cambiamos esta política, actualizamos la fecha de arriba.</p>
    </section>`);
}

export function guidesIndexPage() {
  const objectGuides = GUIDES.filter((g) => g.objectId);
  const articles = GUIDES.filter((g) => !g.objectId);
  const item = (g) => `
    <a class="guide-item" href="/guias/${g.slug}">
      <span class="eyebrow">${esc(g.kind)} · ${g.minutes} min</span>
      <h3>${esc(g.title)}</h3>
      <p>${esc(g.description)}</p>
    </a>`;
  return `
  <main class="wrap">
    <div class="page-head">
      <span class="eyebrow">Guías</span>
      <h1>Aprendé a diseñar e imprimir mejor</h1>
      <p class="lead">Medidas que funcionan, materiales, formatos de archivo y trucos para imprimir a varios colores.</p>
    </div>
    <h2 class="list-title">Guías de cada diseño</h2>
    <div class="guide-list">${objectGuides.map(item).join('')}</div>
    ${adSlot('inline')}
    <h2 class="list-title">Artículos</h2>
    <div class="guide-list">${articles.map(item).join('')}</div>
  </main>`;
}

export function guidePage(slug) {
  const g = getGuide(slug);
  if (!g) return notFoundPage();
  const obj = g.objectId ? getObject(g.objectId) : null;
  const related = GUIDES.filter((x) => x.slug !== g.slug).slice(0, 3);
  const body = g.sections.map((s, i) => `<section><h2>${esc(s.h)}</h2>${s.html}</section>${i === 1 && g.sections.length > 3 ? adSlot('inline') : ''}`).join('');
  return `
  <main class="wrap guide">
    <article>
      <nav class="crumbs" aria-label="Ubicación"><a href="/guias">Guías</a><span>/</span><span>${esc(g.kind)}</span></nav>
      <h1>${esc(g.title)}</h1>
      <p class="lead">${esc(g.description)}</p>
      <p class="note">Lectura de ${g.minutes} minutos</p>
      ${obj ? `<a class="guide-cta" href="/crear/${obj.id}"><span><b>Abrí el editor de ${esc(obj.name.toLowerCase())}</b><span>Probá estos valores en 3D y descargá el archivo.</span></span>${icon.arrow}</a>` : ''}
      ${body}
    </article>
    <aside class="related">
      <h2 class="list-title">Seguí leyendo</h2>
      <div class="guide-list">${related.map((x) => `<a class="guide-item" href="/guias/${x.slug}"><span class="eyebrow">${esc(x.kind)}</span><h3>${esc(x.title)}</h3></a>`).join('')}</div>
    </aside>
  </main>`;
}

export function notFoundPage() {
  return `
  <main class="wrap">
    <div class="page-head">
      <span class="eyebrow">Error 404</span>
      <h1>No encontramos esta página</h1>
      <p class="lead">Puede que el enlace esté mal escrito o que la página ya no exista.</p>
      <div class="hero-actions"><a class="btn btn-primary" href="/catalogo">Ir al catálogo</a><a class="btn" href="/">Volver al inicio</a></div>
    </div>
  </main>`;
}

/** Tarjeta de una foto de la galería (también se usa en la portada). */
export function galleryCard(g, eager = false) {
  const obj = g.diseno ? getObject(g.diseno) : null;
  const small = `/galeria/${g.foto.replace(/\.webp$/, '-chica.webp')}`;
  const who = g.imprimio
    ? `Impreso por ${g.enlace ? `<a href="${esc(g.enlace)}" target="_blank" rel="noopener nofollow">${esc(g.imprimio)}</a>` : esc(g.imprimio)}`
    : g.autor ? `De ${g.enlace ? `<a href="${esc(g.enlace)}" target="_blank" rel="noopener nofollow">${esc(g.autor)}</a>` : esc(g.autor)}` : '';
  return `
    <figure class="gal-item">
      <a class="gal-photo" href="/galeria/${esc(g.foto)}" aria-label="Ver la foto en grande: ${esc(g.titulo)}">
        <img src="${small}" srcset="${small} 640w, /galeria/${esc(g.foto)} ${g.w}w" sizes="(max-width: 560px) 92vw, 380px"
          width="${g.w}" height="${g.h}" alt="${esc(g.alt || g.titulo)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">
      </a>
      <figcaption>
        <b>${esc(g.titulo)}</b>
        ${who ? `<span class="gal-who">${who}</span>` : ''}
        ${obj ? `<a class="gal-cta" href="/crear/${obj.id}" title="${esc(obj.name)}">Hacé el tuyo ${icon.arrow}</a>` : ''}
      </figcaption>
    </figure>`;
}

export function galleryPage() {
  const items = galleryItems();
  const ig = SITE.instagram ? `https://instagram.com/${SITE.instagram}` : '';
  return `
  <main class="wrap">
    <div class="page-head">
      <span class="eyebrow">Galería</span>
      <h1>Hecho con ${esc(SITE.name)}</h1>
      <p class="lead">Piezas reales, impresas a partir de diseños de la web. Así quedan los archivos fuera de la pantalla.</p>
    </div>
    ${items.length ? `<div class="gallery">${items.map((g, i) => galleryCard(g, i < 2)).join('')}</div>`
      : `<p class="empty">Todavía no hay fotos. ¡La tuya puede ser la primera!</p>`}
    <section class="gal-send">
      <div>
        <h2>¿Imprimiste algo con ${esc(SITE.name)}?</h2>
        <p>Mandanos una foto de tu pieza y la sumamos a la galería con tu nombre o tu @. Revisamos cada foto antes de publicarla.</p>
      </div>
      <div class="gal-send-actions">
        ${ig ? `<a class="btn btn-primary" href="${ig}" target="_blank" rel="noopener">Mandala por Instagram</a>` : ''}
        ${SITE.email ? `<a class="btn" href="mailto:${esc(SITE.email)}?subject=${encodeURIComponent('Foto para la galería')}">Por correo</a>` : ''}
      </div>
    </section>
    ${adSlot('banner')}
  </main>`;
}

/** Guirnalda de luces (SVG) y nieve para la cabecera de un evento. */
function garland() {
  const colors = ['#E5483F', '#F2C230', '#3DBE6E', '#F1F1EC'];
  const W = 100, N = 16, bulbs = [];
  let wire = '';
  for (let j = 0; j < N; j++) {
    const x0 = j * W, x1 = x0 + W, c = [x0 + W / 2, 52], p0 = [x0, 4], p1 = [x1, 4];
    wire += `${j ? '' : `M${x0} 4 `}Q${c[0]} ${c[1]} ${x1} 4 `;
    [0.22, 0.5, 0.78].forEach((t, k) => {
      const x = (1 - t) ** 2 * p0[0] + 2 * t * (1 - t) * c[0] + t * t * p1[0];
      const y = (1 - t) ** 2 * p0[1] + 2 * t * (1 - t) * c[1] + t * t * p1[1];
      bulbs.push(`<g class="bulb" style="color:${colors[(j * 3 + k) % 4]};animation-delay:${((j * 3 + k) % 7) * 0.35}s" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><rect x="-1.6" y="-1" width="3.2" height="5" rx="1" fill="#2b2f33"/><path d="M-4.6 3.5h9.2c0 6-2 10-4.6 10s-4.6-4-4.6-10z" fill="currentColor"/></g>`);
    });
  }
  return `<svg class="xmas-lights" viewBox="0 0 ${W * N} 70" preserveAspectRatio="xMidYMin slice" aria-hidden="true"><path d="${wire}" fill="none" stroke="#1d2a22" stroke-width="1.6"/>${bulbs.join('')}</svg>`;
}
function snow(n = 26) {
  return `<div class="snow" aria-hidden="true">${Array.from({ length: n }, (_, i) => {
    const r = (k) => ((i * 9301 + k * 49297) % 233280) / 233280;
    return `<i style="--x:${(r(1) * 100).toFixed(1)}%;--s:${(3 + r(2) * 5).toFixed(1)}px;--d:${(7 + r(3) * 9).toFixed(1)}s;--w:${(-r(4) * 14).toFixed(1)}s;--o:${(0.35 + r(5) * 0.5).toFixed(2)}"></i>`;
  }).join('')}</div>`;
}

const ideaPhoto = (ev, x) => (IDEA_THUMBS.has(`${ev.id}--${x.id}`) ? `/miniaturas/ideas/${ev.id}--${x.id}.webp?v=${IDEA_THUMB_VERSION}` : '');

/** Página de un evento (Navidad, etc.): ideas con ajustes precargados y consejos. */
export function eventPage(id) {
  const ev = getEvent(id);
  if (!ev) return notFoundPage();
  const ig = SITE.instagram ? `https://instagram.com/${SITE.instagram}` : '';
  const ideas = ev.ideas.filter((x) => getObject(x.objeto));
  const card = (x) => {
    const def = getObject(x.objeto), src = ideaPhoto(ev, x);
    return `
        <a class="card" href="${esc(presetHref(x))}" data-idea="${ideas.indexOf(x)}" data-live="${src ? 0 : 1}">
          <div class="card-media">${src ? `<img src="${src}" alt="${esc(x.titulo)}: ${esc(def.name)} para imprimir en 3D" width="960" height="720" loading="lazy" decoding="async">` : '<span class="placeholder">Generando vista…</span>'}<span class="tag">${esc(def.name)}</span>${x.nuevo ? '<span class="badge-new">Nuevo</span>' : ''}</div>
          <div class="card-body">
            <h3>${esc(x.titulo)}</h3>
            <p>${esc(x.texto)}</p>
            <span class="card-cta">Personalizar ${icon.arrow}</span>
          </div>
        </a>`;
  };
  const groups = (ev.grupos || [{ id: '', titulo: 'Elegí una y cambiale el nombre', texto: '' }]).map((g) => ({ g, list: ideas.filter((x) => (x.grupo || '') === g.id) })).filter((x) => x.list.length);
  const heroPics = ev.hero ? ev.hero.map((k) => ideas.find((x) => x.id === k)).filter((x) => x && ideaPhoto(ev, x)) : [];
  const nuevos = ideas.filter((x) => x.nuevo).length;
  return `
  <main class="event-page event-${esc(ev.id)}">
    <section class="event-hero">
      ${garland()}${snow()}
      <div class="wrap event-hero-grid">
        <div class="event-hero-copy">
          <span class="eyebrow">${icon.tree} Especial ${esc(ev.label)}</span>
          <h1>${esc(ev.title)}</h1>
          <p class="lead">${esc(ev.lead)}</p>
          <div class="event-hero-cta">
            <a class="btn btn-primary btn-lg" href="#ideas">Ver las ${ideas.length} ideas</a>
            <a class="btn btn-order btn-lg" data-order="${esc(ev.id)}" href="${generalOrderLink(`¡Hola! Quiero pedir adornos de ${ev.label} impresos en 3D.`)}" target="_blank" rel="noopener">Pedilos impresos</a>
          </div>
          <ul class="event-facts"><li>${ideas.length} diseños</li><li>A dos colores</li><li>Descarga 3MF · STL</li>${nuevos ? `<li class="is-new">${nuevos} nuevos</li>` : ''}</ul>
        </div>
        ${heroPics.length ? `<div class="event-hero-pics" aria-hidden="true">${heroPics.map((x, i) => `<a class="hero-pic hp-${i}" href="${esc(presetHref(x))}" tabindex="-1"><img src="${ideaPhoto(ev, x)}" alt="" width="960" height="720" decoding="async"><span>${esc(x.titulo)}</span></a>`).join('')}</div>` : ''}
      </div>
    </section>
    <div class="candy-bar" aria-hidden="true"></div>
    <div class="wrap">
      <div id="ideas" class="ideas-anchor"></div>
      ${groups.map(({ g, list }) => `
      <section class="event-group" aria-label="${esc(g.titulo)}">
        <div class="section-head"><div><span class="eyebrow">Ideas para imprimir</span><h2>${esc(g.titulo)}</h2>${g.texto ? `<p class="event-group-lead">${esc(g.texto)}</p>` : ''}</div></div>
        <div class="cards event-ideas">${list.map(card).join('')}</div>
      </section>`).join('')}
      ${adSlot('inline')}
      <section class="order-band event-order" aria-labelledby="ev-order">
        <div>
          <h2 id="ev-order">¿Preferís recibirlos ya impresos?</h2>
          <p>Elegís el diseño y el nombre, y te los imprimimos a dos colores. Adornos chicos <b>desde $2.000</b>; mirá la <a href="/pedidos#precios">lista de precios</a>. Te confirmamos precio y plazo antes de imprimir.</p>
        </div>
        <div class="order-band-actions"><a class="btn btn-order btn-lg" data-order="${esc(ev.id)}" href="${generalOrderLink(`¡Hola! Quiero pedir adornos de ${ev.label} impresos en 3D.`)}" target="_blank" rel="noopener">Pedir por WhatsApp</a><a class="order-band-more" href="/pedidos">Cómo pedir</a></div>
      </section>
      <section class="event-tips">
        ${ev.consejos.map((c) => `<article><h2>${esc(c.h)}</h2>${c.html}</article>`).join('')}
      </section>
      <section class="gal-send">
        <div>
          <h2>¿Imprimiste tus adornos?</h2>
          <p>Mandanos una foto y la sumamos a la <a href="/galeria">galería</a> con tu nombre o tu @.</p>
        </div>
        <div class="gal-send-actions">
          ${ig ? `<a class="btn btn-primary" href="${ig}" target="_blank" rel="noopener">Mandala por Instagram</a>` : ''}
        </div>
      </section>
    </div>
  </main>`;
}

export function mountEvent(root, id) {
  const ev = getEvent(id);
  if (!ev) return () => {};
  const ideas = ev.ideas.filter((x) => getObject(x.objeto));
  // Solo se generan en vivo las ideas que todavía no tienen foto de producto
  const live = ideas.map((x, i) => ({ x, i })).filter(({ x }) => !ideaPhoto(ev, x));
  return renderPresetThumbs(live.map(({ x }) => ({ def: getObject(x.objeto), params: x.params })), (k, url) => {
    const i = live[k].i, ph = root.querySelector(`[data-idea="${i}"] .placeholder`);
    if (ph) ph.outerHTML = `<img src="${url}" alt="Vista 3D: ${esc(ideas[i].titulo)}">`;
  });
}

export function mountContent(root) {
  const tabs = root.querySelectorAll('.pp-tabs button');
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
    root.querySelectorAll('.pp-group').forEach((g) => { g.hidden = !!t.dataset.cat && g.dataset.cat !== t.dataset.cat; });
  }));
  root.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copiada'; } catch { b.textContent = 'Seleccioná y copiá la dirección'; }
  }));
  return () => {};
}
