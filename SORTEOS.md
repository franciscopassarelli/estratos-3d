# Sorteos de Estratos 3D

Sección independiente del resto de la web:

- **Página pública:** `https://estratos3d.com/sorteos/<slug>` (no aparece en Google ni muestra anuncios).
- **Panel privado:** `https://estratos3d.com/admin`, con contraseña.
- **Base de datos:** Cloudflare D1 (`estratos-sorteos`).
- **Servidor:** Cloudflare Pages Functions (carpeta `functions/`).

## Configuración inicial (una sola vez)

Todo se hace en dash.cloudflare.com, en tu cuenta.

### 1. Crear la base de datos

1. Menú izquierdo: **Storage & databases → D1 SQL database → Create**.
2. Nombre: `estratos-sorteos`. Crear.
3. Entrá a la base, pestaña **Console**.
4. Abrí `migrations/0001_sorteos.sql` en VS Code, copiá todo el contenido, pegalo en la consola y ejecutalo.
5. En **Tables** deberían aparecer: `participants`, `promo_state`, `draws`, `login_attempts`.

### 2. Conectar la base al sitio

1. **Workers & Pages → estratos-3d → Settings → Bindings → Add**.
2. Tipo **D1 database**.
3. Variable name: `DB` (en mayúsculas, exactamente así).
4. D1 database: `estratos-sorteos`.
5. Guardar.

### 3. Contraseña del panel

En **Settings → Variables and Secrets → Add**, agregá dos variables de tipo **Secret**:

| Nombre | Valor |
|---|---|
| `ADMIN_PASSWORD` | Tu contraseña del panel: 12 caracteres o más, que no uses en otro lado. |
| `SESSION_SECRET` | Un texto aleatorio largo. Generalo con el comando de abajo. |

Para generar `SESSION_SECRET`, en la terminal de VS Code:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Copiá el resultado y pegalo como valor. No lo guardes en ningún archivo del proyecto.

### 4. Publicar

Los cambios de configuración se aplican en el próximo despliegue:

```powershell
git add .
git commit -m "Sorteos"
git push
```

### 5. Probar

1. Abrí `https://estratos3d.com/sorteos/torneo-tenis` y anotate con tus datos.
2. Abrí `https://estratos3d.com/admin`, ingresá la contraseña y verificá que aparezcas.
3. Eliminá tu inscripción de prueba con la ✕ (dos clics).

## Uso diario

- **Ver inscriptos:** `/admin`. La lista se actualiza sola cada minuto, o con **Actualizar**.
- **Contactar:** el botón **Contactar** abre WhatsApp, tu correo o Instagram con un mensaje preparado. Después marcá **Contactado**.
- **Exportar:** **Exportar a Excel (CSV)** descarga la lista completa.
- **Cerrar la inscripción:** **Inscripción → Cerrada**. "Según fechas" usa `opensAt` / `closesAt` de `src/content/promos.js`.
- **Sortear:** **Sortear ganador** elige al azar entre todos los inscriptos y guarda fecha, hora y cantidad de participantes. **Sortear suplente** elige otro entre los que no salieron. **Deshacer último** corrige un error.
- **Anunciar:** **Publicar ganador en la página** cierra la inscripción y muestra en la página pública el nombre y la inicial del apellido.
- **Al terminar:** exportá la lista si la necesitás y usá **Borrar datos** (las bases prometen borrar todo dentro de los 90 días).

## Editar la promoción

Todo está en `src/content/promos.js`:

- **Premios:** completá `prizes`. Las fotos van en `public/sorteos/torneo-tenis/`.
  ```js
  prizes: [
    { title: 'Llavero personalizado', description: 'Con tu nombre, a dos colores.', image: '/sorteos/torneo-tenis/llavero.jpg' },
    { title: 'Placa para tu puerta', description: 'Diseño a elección.', objectId: 'placa' }, // sin foto: muestra la vista 3D
  ],
  ```
- **Fechas:** `closesAt` (cierre de inscripción) y `drawAt` (sorteo), en formato `'2026-11-15T18:00:00-03:00'`.
- **Lugar:** `event.place`.
- **Reglas extra:** `extraRules`.

Después de editar: `git add .`, `git commit -m "..."` y `git push`.

## Nueva promoción

1. Copiá el bloque completo de `torneo-tenis` dentro de `PROMOS`.
2. Cambiá `slug` (por ejemplo `dia-del-padre`) y los textos.
3. Poné `featured: false` en la anterior y `featured: true` en la nueva, si querés que aparezca en el inicio.
4. Publicá. El panel muestra un selector para elegir la promoción.

## Quitar un sorteo de la web

1. En `src/content/promos.js`, poné `visible: false`.
2. Publicá. La página deja de existir y el aviso del inicio desaparece.

Los datos siguen en la base hasta que los borres desde el panel. El panel sigue mostrando la promoción oculta.

## QR para el flyer

Apuntalo a `https://estratos3d.com/sorteos/torneo-tenis?origen=flyer`. El `origen` aparece junto a cada inscripto en el panel. Podés usar otros valores (`origen=instagram`, `origen=grupo`) para distinguir de dónde llega cada persona.

## Seguridad

- **Inscripción:**
  - El servidor valida todos los datos.
  - Un mismo contacto no puede anotarse dos veces en la misma promoción.
  - Hay un campo trampa para bots.
  - Se aceptan hasta 6 inscripciones por hora desde una misma conexión.
  - Se guarda una huella cifrada de la conexión, no la IP.
- **Panel:**
  - La sesión dura 12 horas, en una cookie `HttpOnly`, `Secure` y `SameSite=Strict` firmada con `SESSION_SECRET`.
  - Después de 5 contraseñas incorrectas, esa conexión queda bloqueada 15 minutos.
  - Toda la API `/api/admin/*` exige sesión y rechaza pedidos de otros sitios.
  - Si faltan `ADMIN_PASSWORD` o `SESSION_SECRET`, el panel no funciona: no queda abierto.
- **Exportación:** el CSV neutraliza contenido que Excel podría interpretar como fórmula.

### Opcional: verificación anti-robots (Turnstile)

1. En Cloudflare: **Turnstile → Add widget**, con dominio `estratos3d.com` y modo **Managed**.
2. Copiá la **Site key** en `src/config.js` → `SITE.turnstileSiteKey`.
3. Agregá la **Secret key** como secret `TURNSTILE_SECRET` en el proyecto de Pages.
4. Publicá.

### Opcional: segunda capa con Cloudflare Access

Para exigir además un código enviado a tu correo antes de ver `/admin`:

1. En **Zero Trust → Access → Applications**, creá una aplicación *Self-hosted*.
2. Agregá dos dominios: `estratos3d.com/admin` y `estratos3d.com/api/admin`.
3. Creá una política que permita solo tu email.

No requiere cambios en el código.

### Opcional: aviso por correo de cada inscripto

El código ya intenta mandar un correo si existen el binding `EMAIL` (Email Service de Cloudflare) y la variable `NOTIFY_TO` (tu Gmail). Cloudflare no documenta ese binding para proyectos de Pages, así que puede no estar disponible. Si no está, no pasa nada: la inscripción funciona igual y todo queda en el panel.

## Probar en tu computadora (opcional)

```powershell
npm run build
npx wrangler pages dev dist --d1 DB=estratos-sorteos
```

Necesitás un archivo `.dev.vars` (ya está en `.gitignore`, nunca lo subas) con:

```
ADMIN_PASSWORD=una-contraseña-de-prueba
SESSION_SECRET=un-texto-largo-de-al-menos-32-caracteres
```

Y la base local creada con:

```powershell
npx wrangler d1 execute estratos-sorteos --local --file migrations/0001_sorteos.sql
```
