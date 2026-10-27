// Entrega de archivos al usuario.
// - En un navegador normal: descarga directa con un enlace temporal (Blob).
// - Dentro de un artifact de claude.ai: el visor solo admite ciertas extensiones,
//   así que los archivos 3D se entregan dentro de un .zip mediante la capacidad "downloads".
import { zipSync } from 'fflate';

let hostDownloads; // undefined = sin comprobar, null = no disponible
async function getHostDownloads() {
  if (hostDownloads !== undefined) return hostDownloads;
  if (typeof window === 'undefined' || !window.claude || typeof window.claude.use !== 'function') return (hostDownloads = null);
  try { hostDownloads = (await window.claude.use('downloads')) || null; } catch { hostDownloads = null; }
  return hostDownloads;
}

/** Comprueba en segundo plano cómo se entregarán los archivos (para avisarlo en la interfaz). */
export async function deliveryMode() {
  return (await getHostDownloads()) ? 'zip' : 'direct';
}

function anchorDownload(name, bytes) {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * files: [{ name, bytes }]. bundleName: nombre del zip si hay varios archivos.
 * Devuelve { delivered: [nombres], container: nombre real descargado }.
 */
export async function saveFiles(files, bundleName) {
  const host = await getHostDownloads();
  const total = files.reduce((s, f) => s + f.bytes.length, 0);
  if (host) {
    const zipName = `${bundleName}.zip`;
    const zip = zipSync(Object.fromEntries(files.map((f) => [f.name, f.bytes])), { level: 0 });
    await host.save({ filename: zipName, data: new Blob([zip]) });
    return { container: zipName, files: files.map((f) => f.name), bytes: zip.length, zipped: true };
  }
  if (files.length === 1) {
    anchorDownload(files[0].name, files[0].bytes);
    return { container: files[0].name, files: [files[0].name], bytes: total, zipped: false };
  }
  const zipName = `${bundleName}.zip`;
  const zip = zipSync(Object.fromEntries(files.map((f) => [f.name, f.bytes])));
  anchorDownload(zipName, zip);
  return { container: zipName, files: files.map((f) => f.name), bytes: zip.length, zipped: true };
}
