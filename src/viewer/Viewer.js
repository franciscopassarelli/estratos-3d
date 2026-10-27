// Visor 3D (Three.js). Eje Z hacia arriba, unidades en mm, cama de impresión de referencia.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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

export class Viewer {
  constructor(container, { autoRotate = false, bed = true, bedSize = 220 } = {}) {
    this.container = container;
    this.failed = false;
    this.group = new THREE.Group();
    this.box = new THREE.Box3();
    this.focusBox = null;
    this.lastSize = 0;
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      this.failed = true;
      return;
    }
    const r = this.renderer;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.domElement.className = 'viewer-canvas';
    r.domElement.setAttribute('aria-label', 'Vista previa 3D. Arrastrá para girar, pellizcá o usá la rueda para acercar.');
    r.domElement.setAttribute('role', 'img');
    container.appendChild(r.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 1, 5000);
    this.camera.up.set(0, 0, 1);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(120, -200, 260);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.6);
    rim.position.set(-200, 160, 120);
    this.scene.add(rim);
    this.scene.add(this.group);

    if (bed) {
      this.bed = new THREE.Group();
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(bedSize, bedSize), new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0.1 }));
      plate.position.z = -0.05;
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

  resize() {
    if (this.failed) return;
    const w = this.container.clientWidth || 300, h = this.container.clientHeight || 300;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** Reemplaza el modelo mostrado. parts: [{ id, color, volumes, focus }] */
  setModel(parts, { reframe = 'auto' } = {}) {
    if (this.failed) return;
    for (const m of this.group.children) m.material.dispose();
    this.group.clear();
    this.box.makeEmpty();
    let focus = null;
    for (const p of parts) {
      const mat = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.55, metalness: 0.02, flatShading: true });
      for (const g of p.volumes) {
        const mesh = new THREE.Mesh(g, mat);
        this.group.add(mesh);
        g.computeBoundingBox();
        this.box.union(g.boundingBox);
        if (p.focus) (focus ||= new THREE.Box3()).union(g.boundingBox);
      }
    }
    this.focusBox = focus;
    const size = this.box.isEmpty() ? 0 : this.box.getSize(new THREE.Vector3()).length();
    const changed = !this.lastSize || Math.abs(size - this.lastSize) / this.lastSize > 0.35;
    if (reframe === true || (reframe === 'auto' && changed)) this.frame('full', false);
    this.lastSize = size;
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

  dispose() {
    if (this.failed) return;
    this.renderer.setAnimationLoop(null);
    this.ro.disconnect(); this.io.disconnect(); this._mo?.disconnect();
    this._mq?.removeEventListener?.('change', this._onTheme);
    for (const m of this.group.children) m.material.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
