// public/assets/js/dice3d.js
// Uses local Three.js vendor files (no CDN).
import * as THREE from '../vendor/three/three.module.js';
import { GLTFLoader } from '../vendor/three/GLTFLoader.js';

export async function initDice({
  container,
  glbUrl = './assets/models/Dice.glb', // HTML is at /public/ → this path is correct
  scale = 1
} = {}) {
  if (!container) throw new Error('initDice: container is required');

  // Scene
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.set(2.2, 1.9, 2.2);
  camera.lookAt(0, 0, 0);

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x223355, 0.9);
  const dir  = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(3,5,3);
  scene.add(hemi, dir);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Resize
  function resize(){
    const w = Math.max(1, container.clientWidth || 120);
    const h = Math.max(1, container.clientHeight || 120);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();

  // Load GLB (with fallback cube)
  let diceObj;
  async function loadGLB() {
    const gltf = await new GLTFLoader().loadAsync(glbUrl);
    const root = gltf.scene;
    root.scale.setScalar(scale);
    root.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = false; }});
    scene.add(root);
    return root;
  }
  function fallbackCube(){
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1,1,1),
      [
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
        new THREE.MeshStandardMaterial({ color: 0xffe082 }),
        new THREE.MeshStandardMaterial({ color: 0x80deea }),
        new THREE.MeshStandardMaterial({ color: 0xffab91 }),
        new THREE.MeshStandardMaterial({ color: 0xa5d6a7 }),
        new THREE.MeshStandardMaterial({ color: 0xce93d8 })
      ]
    );
    scene.add(mesh);
    return mesh;
  }

  try { diceObj = await loadGLB(); }
  catch(e){ console.warn('[Dice3D] GLB failed:', glbUrl, e); diceObj = fallbackCube(); }

  // Render loop
  let raf = 0;
  (function loop(){ raf = requestAnimationFrame(loop); renderer.render(scene, camera); })();

  // Face orientations (edit if your GLB’s “1 up” differs)
  const deg = a => a*Math.PI/180;
  const q = (x,y,z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(deg(x),deg(y),deg(z),'XYZ'));
  const faceUp = {
    1: q(   0,   0,   0),
    2: q(   0,   0,  90),
    3: q( -90,   0,   0),
    4: q(  90,   0,   0),
    5: q(   0,   0, -90),
    6: q( 180,   0,   0),
  };

  function slerpTo(target, ms = 1100){
    return new Promise(resolve => {
      const start = performance.now();
      const q0 = diceObj.quaternion.clone();

      // add a bit of pre-spin for juice
      const spin = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(deg(720+Math.random()*360), deg(720+Math.random()*360), deg(720+Math.random()*360))
      );
      const qMid = q0.clone().multiply(spin);

      const step = (now) => {
        const t = Math.min(1, (now - start)/ms);
        const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
        const tmp = q0.clone().slerp(qMid, Math.min(1, e*0.7));
        diceObj.quaternion.copy(tmp.slerp(target, Math.max(0, e-0.7)/0.3));
        t < 1 ? requestAnimationFrame(step) : resolve();
      };
      requestAnimationFrame(step);
    });
  }

  async function roll(forcedValue){
    const value = forcedValue ?? (1 + Math.floor(Math.random()*6));
    await slerpTo(faceUp[value] || faceUp[1], 1000 + Math.random()*300);
    return value;
  }

  function setFaceMap(map){ Object.assign(faceUp, map); }
  function dispose(){ cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); scene.clear(); }

  return { roll, setFaceMap, dispose, scene, camera, renderer, dice: diceObj };
}
