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

/**
 * Material de PLA con líneas de capa que se desvanecen cuando son más finas que un píxel.
 * glow: pieza que deja pasar la luz (pantallas de lámpara). Brilla más de frente que en los bordes,
 * como un plástico fino iluminado desde adentro.
 */
function plaMaterial(color, layers, glow = false) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0, envMapIntensity: 0.35 });
  if (glow) { mat.emissive = new THREE.Color(color).lerp(new THREE.Color('#FFC77A'), 0.55); mat.emissiveIntensity = 0; }
  if (!layers && !glow) return mat;
  mat.extensions = { derivatives: true };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uLayer = { value: LAYER };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vLayerZ;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvLayerZ = (modelMatrix * vec4(transformed, 1.0)).z;');
    let frag = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vLayerZ;\nuniform float uLayer;');
    if (layers) frag = frag.replace('#include <color_fragment>', `#include <color_fragment>
        float lz = vLayerZ / uLayer;
        float fw = fwidth(lz);
        float fade = 1.0 - smoothstep(0.18, 0.5, fw);
        float seam = pow(0.5 + 0.5 * cos(6.2831853 * lz), 3.0);
        diffuseColor.rgb *= 1.0 - 0.2 * fade * seam;`);
    if (glow) frag = frag.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float facing = abs(dot(normalize(normal), normalize(vViewPosition)));
        totalEmissiveRadiance *= mix(0.12, 1.0, pow(facing, 1.6));`);
    sh.fragmentShader = frag;
  };
  mat.customProgramCacheKey = () => `pla-${layers ? 'l' : ''}${glow ? 'g' : ''}`;
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
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x8f8a80, 1.15);
    this.scene.add(this.hemi);
    const key = new THREE.DirectionalLight(0xfffaf2, 1.7);
    key.position.set(120, -200, 260);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xeef3ff, 0.55);
    rim.position.set(-200, 160, 120);
    this.scene.add(rim);
    this.key = key; this.rim = rim;
    // Luz interior para las lámparas (se prende con setLights)
    this.lamp = new THREE.PointLight(0xffc27a, 0, 0, 2);
    this.scene.add(this.lamp);
    this.lightsOn = false;
    this.hasGlow = false;
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

  /** Prende o apaga las lámparas: la pantalla brilla, la luz interior ilumina la base y el ambiente se oscurece. */
  setLights(on) {
    if (this.failed) return;
    this.lightsOn = !!on;
    const lit = this.lightsOn && this.hasGlow;
    for (const m of this.group.children) if (m.material.emissive) m.material.emissiveIntensity = lit ? 0.75 : 0;
    this.lamp.intensity = lit ? this._lampPower : 0;
    this.hemi.intensity = lit ? 0.35 : 1.15;
    this.key.intensity = lit ? 0.45 : 1.7;
    this.rim.intensity = lit ? 0.2 : 0.55;
    this.container.classList?.toggle('night', lit);
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
    let focus = null, glowBox = null;
    const tris = parts.reduce((s, p) => s + p.volumes.reduce((t, g) => t + g.attributes.position.count / 3, 0), 0);
    const smooth = tris <= SMOOTH_MAX_TRIS;
    for (const p of parts) {
      const mat = plaMaterial(p.color, layers || !!p.glow, !!p.glow);
      // `flat`: diseños facetados a propósito (low poly): se muestran con caras planas.
      const soft = smooth && !p.flat;
      if (!soft) mat.flatShading = true;
      for (const g of p.volumes) {
        let shown = g, own = false;
        if (soft) { try { shown = toCreasedNormals(g, CREASE); own = true; } catch { shown = g; } }
        const mesh = new THREE.Mesh(shown, mat);
        mesh.userData.ownGeometry = own;
        this.group.add(mesh);
        g.computeBoundingBox();
        this.box.union(g.boundingBox);
        if (p.focus) (focus ||= new THREE.Box3()).union(g.boundingBox);
        if (p.glow) (glowBox ||= new THREE.Box3()).union(g.boundingBox);
      }
    }
    this.focusBox = focus;
    this.hasGlow = !!glowBox;
    if (glowBox) {
      const c = glowBox.getCenter(new THREE.Vector3()), sz = glowBox.getSize(new THREE.Vector3());
      this.lamp.position.set(c.x, c.y, glowBox.min.z + sz.z * 0.35);
      this._lampPower = 2.2 * Math.max(sz.x, sz.y) ** 2;
    }
    this.setLights(this.lightsOn);
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
   * Foto de producto ambientada: el objeto apoyado en una mesa de madera, con una pared cálida desenfocada
   * y luz de ventana (o de noche, si hay una lámpara encendida). Se renderiza al doble de tamaño y se achica,
   * para que los bordes salgan suaves. Devuelve un Blob.
   * - angle 'product': ángulo de catálogo (bajo para objetos altos, desde arriba para piezas planas).
   *   Si no, respeta el ángulo que el usuario eligió girando el modelo.
   */
    async photo({ width = 1080, height = 1350, title = '', brand = 'estratos3d.com', zoom = 1.15, type = 'image/png', quality, angle = 'user', dir: dirOpt } = {}) {
    if (this.failed || this.box.isEmpty()) return null;
    const r = this.renderer, prevMode = this.sceneMode, SS = 2;
    const prevSize = new THREE.Vector2(); r.getSize(prevSize);
    const prevRatio = r.getPixelRatio();
    const pos = this.camera.position.clone(), tgt = this.controls.target.clone();
    this.setScene('studio');
    r.setPixelRatio(1);
    r.setSize(width * SS, height * SS, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    const sphere = this.box.getBoundingSphere(new THREE.Sphere());
    const fov = (this.camera.fov * Math.PI) / 180;
    const fit = Math.max(sphere.radius, 4) / Math.sin(fov / 2) / Math.min(1, this.camera.aspect * 0.9);
    const sz = this.box.getSize(new THREE.Vector3());
    const flat = sz.z < 0.3 * Math.max(sz.x, sz.y);
    let dir;
        if (dirOpt) dir = new THREE.Vector3(...dirOpt);
    else if (angle === 'product') dir = flat ? new THREE.Vector3(0.32, -0.62, 1) : new THREE.Vector3(0.62, -1.05, sz.z > Math.max(sz.x, sz.y) ? 0.42 : 0.62);
    else {
      dir = pos.clone().sub(tgt);
      if (dir.z < 0.25 * dir.length()) dir.z = 0.25 * dir.length();
      if (flat && dir.z < 1.4 * Math.hypot(dir.x, dir.y)) { const hz = Math.hypot(dir.x, dir.y) || 1; dir.set((dir.x / hz) * 0.55, (dir.y / hz) * 0.55, 0.84); }
    }
    dir.normalize();
    // Objetos altos: se encuadra un poco más abajo del centro para que se vea la mesa
    const aim = sphere.center.clone(); if (!flat) aim.z -= sphere.radius * 0.04;
    this.camera.position.copy(aim).add(dir.clone().multiplyScalar(fit * zoom));
    this.camera.lookAt(aim);
    this.camera.updateMatrixWorld();
    const prevOp = this.shadow.material.opacity;
    this.shadow.material.opacity = 0.6; // sobre madera, la sombra de apoyo tiene que notarse
    r.render(this.scene, this.camera);
    this.shadow.material.opacity = prevOp;

    // Línea del fondo de la mesa: un punto del piso detrás del objeto, proyectado a la pantalla
    const back = new THREE.Vector3(-dir.x, -dir.y, 0).normalize().multiplyScalar(sphere.radius * 2.6).add(new THREE.Vector3(sphere.center.x, sphere.center.y, this.box.min.z));
    const pb = back.clone().project(this.camera);
    const horizon = Math.min(0.72, Math.max(0, (1 - pb.y) / 2)) * height;
    const base = new THREE.Vector3(sphere.center.x, sphere.center.y, this.box.min.z).project(this.camera);
    const foot = { x: ((base.x + 1) / 2) * width, y: ((1 - base.y) / 2) * height };

    const c = document.createElement('canvas');
    c.width = width; c.height = height;
    const g = c.getContext('2d');
    const night = this.lightsOn && this.hasGlow;
    paintRoom(g, width, height, horizon, night, foot);
    g.imageSmoothingQuality = 'high';
    g.drawImage(r.domElement, 0, 0, width, height);
    if (night) {
      // Resplandor sobre la mesa alrededor de la lámpara
      const glow = g.createRadialGradient(foot.x, foot.y, 0, foot.x, foot.y, width * 0.45);
      glow.addColorStop(0, 'rgba(255,190,110,0.22)'); glow.addColorStop(1, 'rgba(255,190,110,0)');
      g.globalCompositeOperation = 'screen'; g.fillStyle = glow; g.fillRect(0, horizon, width, height - horizon); g.globalCompositeOperation = 'source-over';
    }
    if (brand) {
      const y = height - 70;
      g.font = '600 34px "IBM Plex Sans", system-ui, sans-serif';
      g.textBaseline = 'middle';
      const tw = g.measureText(brand).width, mark = 34, gap = 14, total = mark + gap + tw, x0 = (width - total) / 2;
      g.fillStyle = 'rgba(20,16,12,0.45)';
      if (g.roundRect) { g.beginPath(); g.roundRect(x0 - 22, y - 30, total + 44, 60, 30); g.fill(); }
      g.fillStyle = '#7FE3D3';
      [[0.2, 0.6, 0.55], [0.1, 0.8, 0.8], [0, 1, 1]].forEach(([ox, w, a], i) => { g.globalAlpha = a; g.beginPath(); if (g.roundRect) g.roundRect(x0 + ox * mark, y - 13 + i * 10, mark * w, 7, 3); else g.rect(x0 + ox * mark, y - 13 + i * 10, mark * w, 7); g.fill(); });
      g.globalAlpha = 1;
      g.fillStyle = '#FFFFFF'; g.fillText(brand, x0 + mark + gap, y + 1);
    }
    if (title) { g.font = '700 46px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.fillStyle = night ? '#F1E6D8' : '#2B2E33'; g.fillText(title, width / 2, 90); }

    r.setPixelRatio(prevRatio);
    r.setSize(prevSize.x, prevSize.y, false);
    this.resize();
    this.camera.position.copy(pos); this.controls.target.copy(tgt); this.controls.update();
    this.setScene(prevMode);
    return new Promise((res) => c.toBlob(res, type, quality));
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

/** Pseudoaleatorio reproducible para la veta de la madera. */
function seeded(seed) { let a = seed >>> 0; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; }

/**
 * Pinta el ambiente de la foto: pared cálida con luz de ventana desenfocada y una mesa de madera
 * en perspectiva desde `horizon` hacia abajo. De noche, todo más oscuro y con la luz cálida de la lámpara.
 */
function paintRoom(g, W, H, horizon, night, foot) {
  // Pared
  const wall = g.createLinearGradient(0, 0, 0, Math.max(1, horizon));
  if (night) { wall.addColorStop(0, '#2A211B'); wall.addColorStop(1, '#3B2E24'); }
  else { wall.addColorStop(0, '#E9DFD2'); wall.addColorStop(1, '#DDD0BF'); }
  g.fillStyle = wall; g.fillRect(0, 0, W, Math.max(1, horizon) + 2);
  // Luz de ventana (o de la lámpara sobre la pared)
  const lx = night ? foot.x : W * 0.18, ly = night ? Math.min(horizon, foot.y) - H * 0.2 : H * 0.1;
  const light = g.createRadialGradient(lx, ly, 0, lx, ly, W * (night ? 0.7 : 0.85));
  if (night) { light.addColorStop(0, 'rgba(255,186,110,0.5)'); light.addColorStop(1, 'rgba(255,186,110,0)'); }
  else { light.addColorStop(0, 'rgba(255,250,240,0.85)'); light.addColorStop(1, 'rgba(255,250,240,0)'); }
  g.fillStyle = light; g.fillRect(0, 0, W, Math.max(1, horizon) + 2);
  // Sombras suaves de una ventana con parteluz (día)
  if (!night && horizon > H * 0.15) {
    g.save(); g.filter = `blur(${Math.round(W * 0.025)}px)`; g.globalAlpha = 0.07; g.fillStyle = '#5A4632';
    g.fillRect(W * 0.55, horizon * 0.08, W * 0.03, horizon * 0.8); g.fillRect(W * 0.38, horizon * 0.42, W * 0.5, W * 0.025);
    g.restore();
  }

  // Mesa de madera
  const top = Math.max(0, horizon);
  const wood = g.createLinearGradient(0, top, 0, H);
  if (night) { wood.addColorStop(0, '#3A2618'); wood.addColorStop(1, '#22160E'); }
  else { wood.addColorStop(0, '#C9A57E'); wood.addColorStop(1, '#AE8659'); }
  g.fillStyle = wood; g.fillRect(0, top, W, H - top);
  // Veta: líneas que se juntan hacia el fondo (perspectiva)
  const rnd = seeded(7), vx = W * 0.5, vy = top - H * 1.2;
  g.save(); g.beginPath(); g.rect(0, top, W, H - top); g.clip();
  for (let i = 0; i < 90; i++) {
    const x = (rnd() * 1.6 - 0.3) * W, w = 0.6 + rnd() * 2.2;
    g.strokeStyle = night ? `rgba(0,0,0,${0.08 + rnd() * 0.12})` : (rnd() > 0.5 ? `rgba(90,58,30,${0.05 + rnd() * 0.08})` : `rgba(255,236,210,${0.05 + rnd() * 0.07})`);
    g.lineWidth = w; g.beginPath();
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const yy = top + (H - top) * t, k = (yy - vy) / (H - vy);
      const xx = vx + (x - vx) * k + Math.sin(t * 9 + i) * 2.5 * k;
      t === 0 ? g.moveTo(xx, yy) : g.lineTo(xx, yy);
    }
    g.stroke();
  }
  // Borde trasero de la mesa y reflejo suave de la luz
  if (top > 0) {
    g.fillStyle = night ? 'rgba(0,0,0,0.35)' : 'rgba(80,52,28,0.18)'; g.fillRect(0, top, W, Math.max(2, H * 0.004));
  }
  const sheen = g.createRadialGradient(night ? foot.x : W * 0.3, top + (H - top) * 0.25, 0, night ? foot.x : W * 0.3, top + (H - top) * 0.25, W * 0.7);
  sheen.addColorStop(0, night ? 'rgba(255,170,90,0.18)' : 'rgba(255,248,235,0.28)'); sheen.addColorStop(1, 'rgba(255,248,235,0)');
  g.fillStyle = sheen; g.fillRect(0, top, W, H - top);
  // Profundidad de campo: el fondo de la mesa, apenas desenfocado
  if (top > 0 && g.filter !== undefined) {
    const band = Math.min(H - top, H * 0.12);
    g.save(); g.filter = 'blur(3px)'; g.drawImage(g.canvas, 0, top, W, band, 0, top, W, band); g.restore();
  }
  g.restore();
  // Viñeta
  const vg = g.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.85);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, night ? 'rgba(0,0,0,0.55)' : 'rgba(60,40,20,0.22)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
}
