// Visor 3D (Three.js). Eje Z hacia arriba, unidades en mm, cama de impresión de referencia.
// La vista intenta parecerse a una pieza de PLA real: material satinado, reflejos suaves,
// sombra de contacto y líneas de capa que aparecen al acercarse.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const CREASE = (35 * Math.PI) / 180; // superficies curvas suaves, aristas vivas
const SMOOTH_MAX_TRIS = 160000; // por encima de esto se muestra facetado para no trabar celulares
const LAYER = 0.2; // mm, altura de capa de referencia

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** Material de PLA con líneas de capa que se desvanecen cuando son más finas que un píxel. */
function plaMaterial(color, layers) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.52, metalness: 0, envMapIntensity: 0.35 });
  if (!layers) return mat;
  mat.extensions = { derivatives: true };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uLayer = { value: LAYER };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vLayerZ;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvLayerZ = (modelMatrix * vec4(transformed, 1.0)).z;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vLayerZ;\nuniform float uLayer;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float lz = vLayerZ / uLayer;
        float fw = fwidth(lz);
        float fade = 1.0 - smoothstep(0.18, 0.5, fw);
        float seam = pow(0.5 + 0.5 * cos(6.2831853 * lz), 3.0);
        diffuseColor.rgb *= 1.0 - 0.2 * fade * seam;`);
  };
  mat.customProgramCacheKey = () => 'pla-layers';
  return mat;
}

export class Viewer {
  constructor(container, { autoRotate = false, bed = true, bedSize = 220 } = {}) {
    this.container = container;
    this.failed = false;
    this.group = new THREE.Group();
    this.box = new THREE.Box3();
    this.focusBox = null;
    this.lastSize = 0;
    this.sceneMode = bed ? 'bed' : 'studio';
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      this.failed = true;
      return;
    }
    const r = this.renderer;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    // Sin mapeo de tonos: los colores tienen que coincidir con los del filamento elegido.
    r.toneMapping = THREE.NoToneMapping;
    r.domElement.className = 'viewer-canvas';
    r.domElement.setAttribute('aria-label', 'Vista previa 3D. Arrastrá para girar, pellizcá o usá la rueda para acercar.');
    r.domElement.setAttribute('role', 'img');
    container.appendChild(r.domElement);

    this.scene = new THREE.Scene();
    // Luz ambiente "de estudio": da reflejos suaves y realistas al plástico.
    try {
      const pmrem = new THREE.PMREMGenerator(r);
      this.envTex = pmrem.fromScene(new RoomEnvironment(r), 0.04).texture;
      this.scene.environment = this.envTex;
      pmrem.dispose();
    } catch { /* sin mapa de entorno: alcanza con las luces */ }

    this.camera = new THREE.PerspectiveCamera(35, 1, 1, 5000);
    this.camera.up.set(0, 0, 1);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8f8a80, 1.15));
    const key = new THREE.DirectionalLight(0xfffaf2, 1.7);
    key.position.set(120, -200, 260);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xeef3ff, 0.55);
    rim.position.set(-200, 160, 120);
    this.scene.add(rim);
    this.scene.add(this.group);

    // Sombra de contacto: la silueta del objeto vista desde arriba, desenfocada y apoyada en el piso.
    // No usa mapas de sombras, así que funciona igual en cualquier celular y casi no consume.
    this.shadowTex = null;
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false }));
    this.shadow.renderOrder = 1;
    this.shadow.visible = false;
    this.scene.add(this.shadow);

    if (bed) {
      this.bed = new THREE.Group();
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(bedSize, bedSize), new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0.05, envMapIntensity: 0.3 }));
      plate.position.z = -0.05;
      plate.receiveShadow = true;
      this.bedPlate = plate;
      const grid = new THREE.GridHelper(bedSize, bedSize / 10);
      grid.rotation.x = Math.PI / 2;
      grid.material.transparent = true;
      grid.material.opacity = 0.35;
      this.bedGrid = grid;
      this.bed.add(plate, grid);
      this.scene.add(this.bed);
      this.applyTheme();
      this._mq = window.matchMedia('(prefers-color-scheme: dark)');
      this._onTheme = () => this.applyTheme();
      this._mq.addEventListener?.('change', this._onTheme);
      this._mo = new MutationObserver(this._onTheme);
      this._mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
    this.setScene(this.sceneMode);

    this.controls = new OrbitControls(this.camera, r.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.09;
    this.controls.autoRotate = autoRotate;
    this.controls.autoRotateSpeed = 1.4;
    this.controls.maxPolarAngle = Math.PI * 0.62;
    this.controls.screenSpacePanning = true;

    this.resize = this.resize.bind(this);
    this.ro = new ResizeObserver(this.resize);
    this.ro.observe(container);
    this.visible = true;
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; });
    this.io.observe(container);
    this.resize();
    r.setAnimationLoop(() => {
      if (!this.visible || document.hidden) return;
      this.controls.update();
      r.render(this.scene, this.camera);
    });
  }

  applyTheme() {
    if (!this.bedPlate) return;
    this.bedPlate.material.color.set(cssVar('--bed', '#c79a4f'));
    this.bedGrid.material.color?.set?.(cssVar('--bed-line', '#8a6a33'));
    const lines = this.bedGrid.geometry.attributes.color;
    if (lines) {
      const c = new THREE.Color(cssVar('--bed-line', '#8a6a33'));
      for (let i = 0; i < lines.count; i++) lines.setXYZ(i, c.r, c.g, c.b);
      lines.needsUpdate = true;
    }
  }

  /** 'bed': sobre la cama de impresión (muestra la escala). 'studio': fondo liso de producto. */
  setScene(mode) {
    if (this.failed) return;
    this.sceneMode = mode === 'studio' || !this.bed ? 'studio' : 'bed';
    if (this.bed) this.bed.visible = this.sceneMode === 'bed';
    this.container.classList?.toggle('studio', this.sceneMode === 'studio' && !!this.bed);
  }

  resize() {
    if (this.failed) return;
    const w = this.container.clientWidth || 300, h = this.container.clientHeight || 300;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _clear() {
    for (const m of this.group.children) { m.material.dispose(); if (m.userData.ownGeometry) m.geometry.dispose(); }
    this.group.clear();
  }

  /**
   * Reemplaza el modelo mostrado. parts: [{ id, color, volumes, focus }]
   * layers: dibujar líneas de capa (solo tiene sentido en la orientación de impresión).
   */
  setModel(parts, { reframe = 'auto', layers = true } = {}) {
    if (this.failed) return;
    this._clear();
    this.box.makeEmpty();
    let focus = null;
    const tris = parts.reduce((s, p) => s + p.volumes.reduce((t, g) => t + g.attributes.position.count / 3, 0), 0);
    const smooth = tris <= SMOOTH_MAX_TRIS;
    for (const p of parts) {
      const mat = plaMaterial(p.color, layers);
      if (!smooth) mat.flatShading = true;
      for (const g of p.volumes) {
        let shown = g, own = false;
        if (smooth) { try { shown = toCreasedNormals(g, CREASE); own = true; } catch { shown = g; } }
        const mesh = new THREE.Mesh(shown, mat);
        mesh.userData.ownGeometry = own;
        this.group.add(mesh);
        g.computeBoundingBox();
        this.box.union(g.boundingBox);
        if (p.focus) (focus ||= new THREE.Box3()).union(g.boundingBox);
      }
    }
    this.focusBox = focus;
    this._contactShadow();
    const size = this.box.isEmpty() ? 0 : this.box.getSize(new THREE.Vector3()).length();
    const changed = !this.lastSize || Math.abs(size - this.lastSize) / this.lastSize > 0.35;
    if (reframe === true || (reframe === 'auto' && changed)) this.frame('full', false);
    this.lastSize = size;
  }

  /** Dibuja la silueta del modelo desde arriba en una textura chica, la desenfoca y la usa como sombra. */
  _contactShadow() {
    const sh = this.shadow;
    sh.visible = false;
    if (this.box.isEmpty()) return;
    const b = this.box, w = b.max.x - b.min.x, h = b.max.y - b.min.y;
    const pad = Math.max(w, h) * 0.18 + 3;
    const W = 192, H = Math.max(16, Math.min(384, Math.round((W * (h + 2 * pad)) / (w + 2 * pad))));
    const r = this.renderer;
    const rt = new THREE.WebGLRenderTarget(W, H);
    const cam = new THREE.OrthographicCamera(b.min.x - pad, b.max.x + pad, b.max.y + pad, b.min.y - pad, 0.1, (b.max.z - b.min.z) + 20);
    cam.position.set(0, 0, b.max.z + 10);
    cam.lookAt(0, 0, b.min.z - 1);
    cam.position.set(0, 0, b.max.z + 10);
    cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    const black = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
    const hidden = [];
    for (const o of this.scene.children) if (o !== this.group && o.visible) { hidden.push(o); o.visible = false; }
    const prevTarget = r.getRenderTarget(), prevClear = r.getClearAlpha(), prevColor = r.getClearColor(new THREE.Color());
    this.scene.overrideMaterial = black;
    r.setRenderTarget(rt);
    r.setClearColor(0x000000, 0);
    r.clear();
    r.render(this.scene, cam);
    this.scene.overrideMaterial = null;
    r.setRenderTarget(prevTarget);
    r.setClearColor(prevColor, prevClear);
    hidden.forEach((o) => { o.visible = true; });
    const px = new Uint8Array(W * H * 4);
    r.readRenderTargetPixels(rt, 0, 0, W, H, px);
    rt.dispose(); black.dispose();

    // Alfa de la silueta -> desenfoque (tres pasadas de caja ≈ gaussiano)
    let a = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) a[i] = px[i * 4 + 3] / 255;
    const blur = (src, rad) => {
      const tmp = new Float32Array(W * H), out = new Float32Array(W * H), n = rad * 2 + 1;
      for (let y = 0; y < H; y++) { let acc = 0; for (let x = -rad; x <= rad; x++) acc += src[y * W + Math.min(W - 1, Math.max(0, x))];
        for (let x = 0; x < W; x++) { tmp[y * W + x] = acc / n; acc += src[y * W + Math.min(W - 1, x + rad + 1)] - src[y * W + Math.max(0, x - rad)]; } }
      for (let x = 0; x < W; x++) { let acc = 0; for (let y = -rad; y <= rad; y++) acc += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
        for (let y = 0; y < H; y++) { out[y * W + x] = acc / n; acc += tmp[Math.min(H - 1, y + rad + 1) * W + x] - tmp[Math.max(0, y - rad) * W + x]; } }
      return out;
    };
    const near = blur(blur(a, 1), 2), far = blur(blur(blur(a, 4), 5), 6);
    const img = new Uint8Array(W * H * 4);
    for (let i = 0; i < W * H; i++) img[i * 4 + 3] = Math.min(255, (near[i] * 0.55 + far[i] * 0.42) * 255);
    this.shadowTex?.dispose();
    this.shadowTex = new THREE.DataTexture(img, W, H, THREE.RGBAFormat);
    this.shadowTex.needsUpdate = true;
    this.shadowTex.magFilter = THREE.LinearFilter; this.shadowTex.minFilter = THREE.LinearFilter;
    sh.material.alphaMap = null;
    sh.material.map = this.shadowTex;
    sh.material.needsUpdate = true;
    sh.scale.set(w + 2 * pad, h + 2 * pad, 1);
    sh.position.set((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, b.min.z + 0.02);
    sh.visible = true;
  }

  /** mode: 'full' (todo el objeto) | 'detail' (acercamiento al texto o al detalle principal) */
  frame(mode = 'full', animate = true) {
    if (this.failed || this.box.isEmpty()) return;
    const target = mode === 'detail' && this.focusBox ? this.focusBox : this.box;
    const sphere = target.getBoundingSphere(new THREE.Sphere());
    const fov = (this.camera.fov * Math.PI) / 180;
    const fit = Math.max(sphere.radius, 4) / Math.sin(fov / 2) / Math.min(1, this.camera.aspect * 0.9);
    const dist = mode === 'detail' ? fit * (this.focusBox ? 0.75 : 0.5) : fit * 1.25;
    const dir = mode === 'detail' ? new THREE.Vector3(0.15, -0.75, 1).normalize() : new THREE.Vector3(0.75, -1.15, 0.85).normalize();
    const to = sphere.center.clone();
    const from = to.clone().add(dir.multiplyScalar(dist));
    this.controls.minDistance = Math.max(sphere.radius * 0.3, 8);
    this.controls.maxDistance = fit * 4;
    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.camera.position.copy(from); this.controls.target.copy(to); this.controls.update();
      return;
    }
    const p0 = this.camera.position.clone(), t0 = this.controls.target.clone(), start = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - start) / 450), e = 1 - (1 - k) ** 3;
      this.camera.position.lerpVectors(p0, from, e);
      this.controls.target.lerpVectors(t0, to, e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /** Imagen estática del modelo actual (para tarjetas del catálogo). */
  snapshot(width = 480, height = 360) {
    if (this.failed) return null;
    const r = this.renderer;
    const prev = new THREE.Vector2();
    r.getSize(prev);
    r.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.frame('full', false);
    r.render(this.scene, this.camera);
    const url = r.domElement.toDataURL('image/png');
    r.setSize(prev.x, prev.y, false);
    this.resize();
    return url;
  }

  /**
   * Foto lista para redes (4:5, 1080 × 1350): fondo de estudio, sombra suave y la marca abajo.
   * Respeta el ángulo que el usuario eligió girando el modelo. Devuelve un Blob PNG.
   */
  async photo({ width = 1080, height = 1350, title = '', brand = 'estratos3d.com' } = {}) {
    if (this.failed || this.box.isEmpty()) return null;
    const r = this.renderer, prevMode = this.sceneMode;
    const prevSize = new THREE.Vector2(); r.getSize(prevSize);
    const prevRatio = r.getPixelRatio();
    const pos = this.camera.position.clone(), tgt = this.controls.target.clone();
    this.setScene('studio');
    r.setPixelRatio(1);
    r.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    // Mantiene la dirección de la vista actual, pero encuadra el objeto completo con aire.
    const sphere = this.box.getBoundingSphere(new THREE.Sphere());
    const fov = (this.camera.fov * Math.PI) / 180;
    const fit = Math.max(sphere.radius, 4) / Math.sin(fov / 2) / Math.min(1, this.camera.aspect * 0.9);
    const dir = pos.clone().sub(tgt).normalize();
    if (dir.z < 0.25) { dir.z = 0.25; dir.normalize(); }
    this.camera.position.copy(sphere.center).add(dir.multiplyScalar(fit * 1.15));
    this.camera.lookAt(sphere.center);
    r.render(this.scene, this.camera);

    const c = document.createElement('canvas');
    c.width = width; c.height = height;
    const g = c.getContext('2d');
    const bg = g.createRadialGradient(width / 2, height * 0.38, height * 0.05, width / 2, height * 0.5, height * 0.8);
    bg.addColorStop(0, '#FBF8F2'); bg.addColorStop(1, '#E6DFD3');
    g.fillStyle = bg; g.fillRect(0, 0, width, height);
    g.drawImage(r.domElement, 0, 0, width, height);
    // Marca: tres capas + nombre, abajo al centro
    const y = height - 70;
    g.font = '600 34px "IBM Plex Sans", system-ui, sans-serif';
    g.textBaseline = 'middle';
    const tw = g.measureText(brand).width, mark = 34, gap = 14, total = mark + gap + tw, x0 = (width - total) / 2;
    g.fillStyle = '#1B6E63';
    [[0.2, 0.6, 0.55], [0.1, 0.8, 0.8], [0, 1, 1]].forEach(([ox, w, a], i) => { g.globalAlpha = a; g.beginPath(); if (g.roundRect) g.roundRect(x0 + ox * mark, y - 13 + i * 10, mark * w, 7, 3); else g.rect(x0 + ox * mark, y - 13 + i * 10, mark * w, 7); g.fill(); });
    g.globalAlpha = 1;
    g.fillStyle = '#2B2E33'; g.fillText(brand, x0 + mark + gap, y + 1);
    if (title) { g.font = '700 46px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#2B2E33'; g.fillText(title, width / 2, 90); }

    // Restaura la vista del usuario
    r.setPixelRatio(prevRatio);
    r.setSize(prevSize.x, prevSize.y, false);
    this.resize();
    this.camera.position.copy(pos); this.controls.target.copy(tgt); this.controls.update();
    this.setScene(prevMode);
    return new Promise((res) => c.toBlob(res, 'image/png'));
  }

  dispose() {
    if (this.failed) return;
    this.renderer.setAnimationLoop(null);
    this.ro.disconnect(); this.io.disconnect(); this._mo?.disconnect();
    this._mq?.removeEventListener?.('change', this._onTheme);
    this._clear();
    this.envTex?.dispose();
    this.shadowTex?.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
