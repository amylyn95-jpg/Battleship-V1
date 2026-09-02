import * as THREE from "three";
import type { Coord, TheatreId } from "../types.js";
import { gridToWorld, type BoardSide } from "./grid.js";
import { createOcean } from "./ocean.js";
import { createSky } from "./sky.js";
import { theatreConfig, type Theatre } from "./theatres.js";

export const CAMERA_RIGS = {
  overview: { position: [0, 34, 190], target: [0, 4, -30] },
  player: { position: [0, 26, 150], target: [0, 4, -66] },
  own: { position: [0, 24, 172], target: [0, 4, 30] },
} as const satisfies Record<string, { position: readonly [number, number, number]; target: readonly [number, number, number] }>;

export type CameraRigId = keyof typeof CAMERA_RIGS;
export type FrameUpdater = (now: number, delta: number) => void;

export function disposeObject(root: THREE.Object3D): void {
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
  readonly camera: THREE.PerspectiveCamera;
  readonly ocean: THREE.Mesh;
  readonly trailCapable: boolean;
  render(force?: boolean): void;
  setTheatre(theatre: Theatre): void;
  setRig(rig: CameraRigId): void;
  focusImpact(coord: Coord, side: BoardSide): void;
  addFrameUpdater(updater: FrameUpdater): () => void;
  setStatic(on: boolean): void;
  dispose(): void;
}

export function createScene(container: HTMLElement, theatreId: TheatreId): SceneRig {
  let theatre = theatreConfig(theatreId);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(theatre.fog, 320, 620);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  const context = renderer.getContext();
  const debugInfo = context.getExtension("WEBGL_debug_renderer_info");
  const rendererName = debugInfo
    ? String(context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
    : "";
  const softwareRenderer = /swiftshader|software renderer|llvmpipe/i.test(rendererName);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, softwareRenderer ? 0.25 : 1.5));
  renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.className = "three-canvas";
  container.append(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 800);
  const ocean = createOcean(
    theatre,
    (window.matchMedia?.("(max-width: 700px)").matches ?? false) || softwareRenderer,
    softwareRenderer,
  );
  let sky = createSky(theatre);
  const hemisphere = new THREE.HemisphereLight(theatre.sky, theatre.deep, 1.8);
  const sun = new THREE.DirectionalLight("#fff0cf", 2.3);
  sun.position.set(...theatre.sun).multiplyScalar(100);
  scene.add(ocean, sky, hemisphere, sun);

  let currentRig: CameraRigId = "overview";
  let impact: { position: THREE.Vector3; target: THREE.Vector3; until: number } | null = null;
  let staticMode = false;
  let renderedStatic = false;
  let rafId = 0;
  let last = performance.now();
  const updaters = new Set<FrameUpdater>();
  const rigPosition = new THREE.Vector3();
  const rigTarget = new THREE.Vector3();

  const resize = (): void => {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const desiredCamera = (now: number): { position: THREE.Vector3; target: THREE.Vector3 } => {
    if (impact && now < impact.until) return impact;
    impact = null;
    const rig = CAMERA_RIGS[currentRig];
    rigPosition.fromArray(rig.position);
    rigTarget.fromArray(rig.target);
    return { position: rigPosition, target: rigTarget };
  };
  const renderFrame = (now: number, delta: number): void => {
    const desired = desiredCamera(now);
    const alpha = staticMode ? 1 : 1 - Math.exp(-3.5 * delta);
    camera.position.lerp(desired.position, alpha);
    camera.lookAt(desired.target);
    if (!staticMode) {
      const oceanMaterial = ocean.material as THREE.ShaderMaterial;
      oceanMaterial.uniforms.uTime.value += delta;
      const skyMaterial = sky.children.find((child) => child instanceof THREE.Mesh)?.material;
      if (skyMaterial instanceof THREE.ShaderMaterial) skyMaterial.uniforms.uTime.value += delta;
      for (const updater of updaters) updater(now, delta);
    }
    renderer.render(scene, camera);
  };
  const loop = (now: number): void => {
    if (document.hidden) {
      rafId = 0;
      return;
    }
    const delta = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!staticMode || !renderedStatic) {
      renderFrame(now, delta);
      renderedStatic = staticMode;
    }
    if (staticMode) {
      rafId = 0;
      return;
    }
    rafId = requestAnimationFrame(loop);
  };
  const visibility = (): void => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
      rafId = 0;
      return;
    }
    last = performance.now();
    renderedStatic = false;
    if (!rafId) rafId = requestAnimationFrame(loop);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  document.addEventListener("visibilitychange", visibility);
  resize();
  camera.position.fromArray(CAMERA_RIGS.overview.position);
  camera.lookAt(new THREE.Vector3(...CAMERA_RIGS.overview.target));
  rafId = requestAnimationFrame(loop);

  return {
    scene,
    renderer,
    camera,
    ocean,
    trailCapable: !softwareRenderer,
    render(force = false): void {
      if (document.hidden) return;
      if (staticMode && renderedStatic && !force) return;
      renderFrame(performance.now(), 0);
      renderedStatic = staticMode;
    },
    setTheatre(next): void {
      theatre = theatreConfig(next.id);
      scene.fog = new THREE.Fog(theatre.fog, 320, 620);
      const uniforms = (ocean.material as THREE.ShaderMaterial).uniforms;
      uniforms.uDeep.value.set(theatre.deep);
      uniforms.uSea.value.set(theatre.sea);
      uniforms.uHorizon.value.set(theatre.sky);
      uniforms.uFogColor.value.set(theatre.fog);
      uniforms.uSunDir.value.set(...theatre.sun).normalize();
      uniforms.uChoppy.value = theatre.choppy;
      hemisphere.color.set(theatre.sky);
      hemisphere.groundColor.set(theatre.deep);
      sun.position.set(...theatre.sun).multiplyScalar(100);
      disposeObject(sky);
      scene.remove(sky);
      sky = createSky(theatre);
      scene.add(sky);
    },
    setRig(rig): void {
      currentRig = rig;
      if (staticMode) {
        const next = CAMERA_RIGS[rig];
        camera.position.fromArray(next.position);
        camera.lookAt(new THREE.Vector3(...next.target));
      }
    },
    focusImpact(coord, side): void {
      const point = gridToWorld(coord, side);
      impact = {
        position: new THREE.Vector3(point.x * 0.45, 26, point.z + 104),
        target: new THREE.Vector3(point.x, 12, point.z),
        until: performance.now() + 1800,
      };
      if (staticMode) {
        camera.position.copy(impact.position);
        camera.lookAt(impact.target);
      }
    },
    addFrameUpdater(updater): () => void {
      updaters.add(updater);
      return () => updaters.delete(updater);
    },
    setStatic(on): void {
      staticMode = on;
      renderedStatic = false;
      if (on && !document.hidden) renderFrame(performance.now(), 0);
      if (!on && !rafId && !document.hidden) {
        last = performance.now();
        rafId = requestAnimationFrame(loop);
      }
    },
    dispose(): void {
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      cancelAnimationFrame(rafId);
      updaters.clear();
      renderer.dispose();
      disposeObject(scene);
      renderer.domElement.remove();
    },
  };
}
