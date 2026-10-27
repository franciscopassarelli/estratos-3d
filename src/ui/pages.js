// Páginas de contenido: guías, ayuda, acerca, contacto, condiciones y privacidad.
import { SITE } from '../config.js';
import { GUIDES, getGuide } from '../content/guides.js';
import { getObject } from '../objects/index.js';
import { adSlot } from './ads.js';
import { esc, icon } from './dom.js';

const INFO = [
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
      <details><summary>¿Tiene costo?</summary><p>No. El sitio se mantiene con publicidad.</p></details>
    </section>`);
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

export function mountContent(root) {
  root.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copiada'; } catch { b.textContent = 'Seleccioná y copiá la dirección'; }
  }));
  return () => {};
}
