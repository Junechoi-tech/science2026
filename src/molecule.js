import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { gametes } from './genetics.js';

export function createMolecule(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
  camera.position.set(0, 0, 9);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.enablePan = false;
  controls.minDistance = 5; controls.maxDistance = 14;
  controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.autoRotateSpeed = 1.5;
  scene.add(new THREE.AmbientLight(0xffffff, 2));
  const light = new THREE.DirectionalLight(0xffffff, 4); light.position.set(-4, 6, 7); scene.add(light);
  const rim = new THREE.DirectionalLight(0xe2c7ff, 2); rim.position.set(4, -3, -2); scene.add(rim);
  const group = new THREE.Group(); scene.add(group);
  const materials = Object.fromEntries(Object.entries({ green: 0x7ebfa7, purple: 0xb6a0d5, cream: 0xf5d798, pink: 0xe4adba, stem: 0xcac4d7 }).map(([k, color]) => [k, new THREE.MeshStandardMaterial({ color, roughness: .38, metalness: .03 })]));
  const sphere = new THREE.SphereGeometry(1, 20, 14);
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
  function ball(position, radius, material) { const mesh = new THREE.Mesh(sphere, material); mesh.position.copy(position); mesh.scale.setScalar(radius); group.add(mesh); return mesh; }
  function bond(a, b, radius, material) {
    const delta = b.clone().sub(a); const mesh = new THREE.Mesh(cylinder, material);
    mesh.position.copy(a).add(b).multiplyScalar(.5); mesh.scale.set(radius, delta.length(), radius);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); group.add(mesh);
  }
  const labels = [];
  function label(text, x, y) {
    const surface = document.createElement('canvas'); surface.width = 256; surface.height = 128;
    const ctx = surface.getContext('2d'); ctx.fillStyle = '#4e4464'; ctx.font = '600 58px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(text, 128, 82);
    const texture = new THREE.CanvasTexture(surface); const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(material); sprite.position.set(x, y, .5); sprite.scale.set(1.2, .6, 1); group.add(sprite); labels.push(sprite);
  }
  let model = 'dna', genotype = 'Aa', mode = 'recessive';
  function build() {
    for (const sprite of labels) { sprite.material.map.dispose(); sprite.material.dispose(); }
    labels.length = 0; group.clear();
    if (model === 'dna') {
      let previous;
      for (let i = 0; i < 21; i++) {
        const angle = i * .48; const y = (i - 10) * .215;
        const a = new THREE.Vector3(Math.cos(angle) * .78, y, Math.sin(angle) * .78);
        const b = new THREE.Vector3(-a.x, y, -a.z);
        ball(a, .135, materials.green); ball(b, .135, materials.purple);
        if (previous) { bond(previous[0], a, .075, materials.green); bond(previous[1], b, .075, materials.purple); }
        const center = a.clone().add(b).multiplyScalar(.5);
        bond(a, center, .065, i % 2 ? materials.pink : materials.cream); bond(center, b, .065, i % 2 ? materials.cream : materials.pink);
        previous = [a, b];
      }
      group.rotation.z = -.32;
    } else {
      const alleles = gametes(genotype, mode);
      alleles.forEach((allele, index) => {
        const x = index === 0 ? -.88 : .88;
        const material = allele.includes('a') || allele.includes('ʰ') ? materials.purple : materials.green;
        const size = allele === 'Y' ? .68 : 1;
        const ends = [new THREE.Vector3(x - .34 * size, 1.2 * size, 0), new THREE.Vector3(x + .34 * size, -1.2 * size, 0), new THREE.Vector3(x + .34 * size, 1.2 * size, .1), new THREE.Vector3(x - .34 * size, -1.2 * size, .1)];
        bond(ends[0], ends[1], .19, material); bond(ends[2], ends[3], .19, material);
        ends.forEach(p => ball(p, .19, material)); ball(new THREE.Vector3(x, 0, .13), .22, materials.cream);
        label(allele, x, -1.8);
      });
      group.rotation.z = -.1;
    }
  }
  build();
  const observer = new ResizeObserver(() => { const { width, height } = canvas.parentElement.getBoundingClientRect(); if (!width || !height) return; renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); });
  observer.observe(canvas.parentElement);
  const zoomSlider = document.querySelector('#model-zoom');
  controls.addEventListener('change', () => { if (zoomSlider) zoomSlider.value = camera.position.distanceTo(controls.target); });
  const frameClock = new THREE.Clock();
  renderer.setAnimationLoop(() => { const delta = Math.min(frameClock.getDelta(), .1); if (canvas.getBoundingClientRect().width === 0 || document.hidden) return; controls.update(delta); renderer.render(scene, camera); });
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); document.querySelector('.model-fallback').hidden = false; });
  return {
    setModel(value) { model = value; build(); },
    setAlleles(value, nextMode) { genotype = value; mode = nextMode; if (model === 'chromosome') build(); },
    setRotating(value) { controls.autoRotate = value; },
    zoom(value) { camera.position.sub(controls.target).setLength(value).add(controls.target); controls.update(); },
    reset() { camera.position.set(0, 0, 9); controls.target.set(0, 0, 0); controls.update(); },
  };
}
