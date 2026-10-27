# Publicar Estratos 3D y monetizarlo con AdSense

Seguí los pasos en orden. Cada uno depende del anterior.

## 1. Comprar el dominio

- Para público argentino, un `.com.ar` en NIC Argentina (nic.ar) es barato y genera confianza.
- Para público de toda Latinoamérica, un `.com` en cualquier registrador.
- Elegí un nombre corto, sin guiones, fácil de dictar.

## 2. Completar `src/config.js`

| Campo | Qué poner |
|---|---|
| `url` | `https://www.tudominio.com.ar` (sin barra final) |
| `email` | Un correo real que revises. AdSense revisa que el sitio tenga contacto. |
| `owner` | Tu nombre o el de tu emprendimiento (aparece en la política de privacidad). |
| `legalUpdated` | La fecha en que revisaste los textos legales. |

Dejá `adsenseClient` vacío por ahora.

`npm run build` muestra avisos si falta algún dato.

## 3. Publicar el sitio (gratis)

Opción recomendada: **Cloudflare Pages** o **Netlify**.

1. Subí el proyecto a un repositorio de GitHub (sin `node_modules` ni `dist`).
2. En Cloudflare Pages o Netlify, creá un sitio nuevo desde ese repositorio.
   - Comando de build: `npm run build`
   - Carpeta de publicación: `dist`
3. Conectá tu dominio desde el panel del hosting y seguí sus instrucciones de DNS. El certificado HTTPS se genera solo.
4. Comprobá que estas direcciones abran: `/`, `/catalogo`, `/guias`, `/privacidad`, `/sitemap.xml`, `/robots.txt`.

Cada vez que hagas `git push`, el sitio se vuelve a publicar solo.

## 4. Google Search Console

1. Entrá a search.google.com/search-console y agregá tu dominio.
2. Verificalo con el registro DNS que te indique.
3. En "Sitemaps", enviá `sitemap.xml`.
4. Esperá a que empiecen a aparecer páginas indexadas (de días a algunas semanas).

## 5. Sumar contenido y visitas antes de aplicar

AdSense rechaza sitios con poco contenido propio. El proyecto ya trae 8 guías. Antes de aplicar conviene:

- Publicar algunos artículos más en `src/content/guides.js` (ideas: calibrar la primera capa, cómo pegar piezas, regalos para imprimir, cómo elegir una impresora).
- Compartir la herramienta en grupos y foros de impresión 3D para tener visitas reales.
- Revisar que no haya enlaces rotos ni páginas vacías.

## 6. Solicitar AdSense

1. Entrá a adsense.google.com con tu cuenta de Google (tenés que ser mayor de 18 años).
2. Agregá tu sitio. Google te va a mostrar tu ID de editor (`ca-pub-…`).
3. Pegalo en `src/config.js` → `adsenseClient` y publicá (`git push`). El build agrega solo:
   - el código de AdSense en el `<head>` de todas las páginas (lo usa Google para verificar el sitio),
   - el archivo `ads.txt` en la raíz.
4. En AdSense, pedí la revisión del sitio. Puede tardar varios días o algunas semanas.

## 7. Configurar el consentimiento de cookies

En AdSense → **Privacidad y mensajes** → **Mensaje de cookies europeo**, creá y publicá el mensaje. Google lo exige para mostrar anuncios personalizados a visitantes de Europa, el Reino Unido y Suiza. No hace falta instalar nada en el código.

## 8. Cuando te aprueben

1. **Anuncios automáticos:** en AdSense → Anuncios → tu sitio, activalos. Ahí se configuran los formatos de **viñeta** (pantalla completa entre páginas) y **anclado** (fijo en un borde). Elegí el anclado arriba o desactivalo en celulares, porque el editor tiene una barra de descarga abajo.
2. **Bloques fijos (opcional):** en Anuncios → Por bloque de anuncios, creá dos bloques "display" adaptables y pegá sus IDs en `adSlots.banner` y `adSlots.inline`. Se ubican debajo del contenido, en el catálogo y en medio de las guías.

## 9. Cobrar

1. En AdSense → Pagos, completá tus datos fiscales y elegí la forma de pago disponible para Argentina.
2. Google verifica tu dirección con un PIN que llega por correo postal.
3. Google paga una vez por mes, cuando el saldo supera el umbral mínimo de pago.

## Reglas para no perder la cuenta

- **Nunca hagas clic en tus propios anuncios** ni pidas a otros que lo hagan.
- **No pongas anuncios pegados a botones** de descarga o de acción.
- **No ubiques anuncios dentro de ventanas emergentes propias.** Para eso están los formatos automáticos de Google.
- **Mantené actualizada la política de privacidad** si agregás analítica u otros servicios.

## Varios sitios

Se usa una sola cuenta de AdSense por persona. Para un sitio nuevo:

1. Agregalo en la sección **Sitios**.
2. Esperá su aprobación.
3. Publicá el mismo `ads.txt` (con tu mismo ID de editor) en su raíz.

Lo que ganan todos los sitios se suma y se cobra junto.
