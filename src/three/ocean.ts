import * as THREE from "three";
import type { Theatre } from "./theatres.js";

interface Wave {
  readonly direction: [number, number];
  readonly length: number;
  readonly amplitude: number;
  readonly speed: number;
}

const WAVES: readonly Wave[] = [
  { direction: [1, 0.2], length: 48, amplitude: 1.2, speed: 0.65 },
  { direction: [0.3, 1], length: 30, amplitude: 0.75, speed: 0.9 },
  { direction: [-0.7, 0.4], length: 18, amplitude: 0.4, speed: 1.25 },
  { direction: [0.2, -1], length: 10, amplitude: 0.2, speed: 1.8 },
];

export function waveHeight(x: number, z: number, t: number, choppy: number): number {
  return WAVES.reduce((height, wave) => {
    const [dx, dz] = wave.direction;
    const length = Math.hypot(dx, dz);
    const phase = (x * dx + z * dz) / length / wave.length + t * wave.speed;
    return height + Math.sin(phase) * wave.amplitude * choppy;
  }, 0);
}

export function createOcean(theatre: Theatre, mobile: boolean): THREE.Mesh {
  const segments = mobile ? 48 : 96;
  const geometry = new THREE.PlaneGeometry(400, 400, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSeaColor: { value: new THREE.Color(theatre.sea) },
      uSkyColor: { value: new THREE.Color(theatre.deep) },
      uSunDir: { value: new THREE.Vector3(...theatre.sun).normalize() },
      uChoppy: { value: theatre.choppy },
      uFoamRing: { value: 0 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uChoppy;
      varying float vHeight;
      void main() {
        vec3 p = position;
        float h = sin(p.x / 48.0 + uTime * 0.65) * 1.2;
        h += sin(p.z / 30.0 + uTime * 0.9) * 0.75;
        h += sin((p.x - p.z) / 18.0 + uTime * 1.25) * 0.4;
        h += sin(p.z / 10.0 + uTime * 1.8) * 0.2;
        p.y += h * uChoppy;
        vHeight = h * uChoppy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uSeaColor;
      uniform vec3 uSkyColor;
      varying float vHeight;
      void main() {
        float foam = smoothstep(1.0, 1.7, vHeight);
        gl_FragColor = vec4(mix(uSeaColor, uSkyColor, 0.2 + foam * 0.35), 1.0);
      }
    `,
  });
  return new THREE.Mesh(geometry, material);
}
