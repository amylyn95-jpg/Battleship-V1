import * as THREE from "three";
import { createOcean } from "./ocean.js";
import { createSky } from "./sky.js";
import { theatreConfig, type Theatre } from "./theatres.js";

function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (material.map) material.map.dispose();
      material.dispose();
    }
  });
}

export interface SceneRig {
  readonly scene: THREE.Scene;
  readonly renderer: THREE.WebGLRenderer;
  readonly overview: THREE.PerspectiveCamera;
  readonly player: THREE.PerspectiveCamera;
  readonly own: THREE.PerspectiveCamera;
  readonly ocean: THREE.Mesh;
  setTheatre(theatre: Theatre): void;
  setStatic(on: boolean): void;
  dispose(): void;
}

export function createScene(container: HTMLElement, theatreId: Theatre["id"]): SceneRig {
  const theatre = theatreConfig(theatreId);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(theatre.fog, 60, 270);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.className = "three-canvas";
  container.append(renderer.domElement);

  const overview = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
  overview.position.set(0, 110, 145);
  overview.lookAt(0, 0, 0);
  const player = overview.clone();
  player.position.set(0, 70, 128);
  player.lookAt(0, 0, -30);
  const own = overview.clone();
  own.position.set(0, 42, 105);
  own.lookAt(0, 2, 48);
  const ocean = createOcean(theatre, window.matchMedia?.("(max-width: 700px)").matches ?? false);
  let sky = createSky(theatre);
  scene.add(ocean, sky);
  scene.add(new THREE.HemisphereLight(theatre.sky, theatre.deep, 1.8));
  const sun = new THREE.DirectionalLight("#fff0cf", 2.3);
  sun.position.set(...theatre.sun).multiplyScalar(100);
  scene.add(sun);

  let staticMode = false;
  let renderedStatic = false;
  let rafId = 0;
  let last = performance.now();
  const resize = (): void => {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height);
    for (const camera of [overview, player, own]) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  };
  const loop = (now: number): void => {
    const delta = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!staticMode) {
      (ocean.material as THREE.ShaderMaterial).uniforms.uTime.value += delta;
      renderer.render(scene, overview);
    } else if (!renderedStatic) {
      renderer.render(scene, overview);
      renderedStatic = true;
    }
    rafId = requestAnimationFrame(loop);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();
  rafId = requestAnimationFrame(loop);

  return {
    scene,
    renderer,
    overview,
    player,
    own,
    ocean,
    setTheatre(next): void {
      const nextConfig = theatreConfig(next.id);
      scene.fog = new THREE.Fog(nextConfig.fog, 60, 270);
      (ocean.material as THREE.ShaderMaterial).uniforms.uSeaColor.value.set(nextConfig.sea);
      (ocean.material as THREE.ShaderMaterial).uniforms.uSkyColor.value.set(nextConfig.deep);
      (ocean.material as THREE.ShaderMaterial).uniforms.uChoppy.value = nextConfig.choppy;
      disposeObject(sky);
      scene.remove(sky);
      sky = createSky(nextConfig);
      scene.add(sky);
    },
    setStatic(on): void {
      staticMode = on;
    },
    dispose(): void {
      resizeObserver.disconnect();
      cancelAnimationFrame(rafId);
      renderer.dispose();
      disposeObject(scene);
      renderer.domElement.remove();
    },
  };
}
