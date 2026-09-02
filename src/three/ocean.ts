import * as THREE from "three";
import type { Theatre } from "./theatres.js";

export interface GerstnerWave {
  readonly direction: readonly [number, number];
  readonly wavelength: number;
  readonly amplitude: number;
  readonly speed: number;
}

export const GERSTNER_WAVES: readonly GerstnerWave[] = [
  { direction: [1, 0.2], wavelength: 48, amplitude: 1.2, speed: 0.65 },
  { direction: [0.3, 1], wavelength: 30, amplitude: 0.75, speed: 0.9 },
  { direction: [-0.7, 0.4], wavelength: 18, amplitude: 0.4, speed: 1.25 },
  { direction: [0.2, -1], wavelength: 10, amplitude: 0.2, speed: 1.8 },
];

export function waveHeight(x: number, z: number, t: number, choppy: number): number {
  return GERSTNER_WAVES.reduce((height, wave) => {
    const [dx, dz] = wave.direction;
    const length = Math.hypot(dx, dz);
    const k = (Math.PI * 2) / wave.wavelength;
    const phase = ((x * dx + z * dz) / length) * k + t * wave.speed;
    return height + Math.sin(phase) * wave.amplitude * choppy;
  }, 0);
}

const waveUniforms = GERSTNER_WAVES.map(
  (wave) => new THREE.Vector4(wave.direction[0], wave.direction[1], wave.wavelength, wave.amplitude),
);

const vertexShader = `
  uniform float uTime;
  uniform float uChoppy;
  uniform vec4 uWaves[4];
  uniform float uWaveSpeeds[4];
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vHeight;

  void main() {
    vec3 p = position;
    float height = 0.0;
    float dxHeight = 0.0;
    float dzHeight = 0.0;
    for (int i = 0; i < 4; i++) {
      vec2 direction = normalize(uWaves[i].xy);
      float k = 6.2831853 / uWaves[i].z;
      float phase = dot(p.xz, direction) * k + uTime * uWaveSpeeds[i];
      float contribution = sin(phase) * uWaves[i].w;
      height += contribution;
      float derivative = cos(phase) * uWaves[i].w * k * uChoppy;
      dxHeight += derivative * direction.x;
      dzHeight += derivative * direction.y;
    }
    p.y += height * uChoppy;
    vec3 normal = normalize(vec3(-dxHeight, 1.0, -dzHeight));
    vHeight = height * uChoppy;
    vNormal = normalize(normalMatrix * normal);
    vWorldPosition = (modelMatrix * vec4(p, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const OCEAN_VERTEX_SHADER = vertexShader;

const fragmentShader = `
  uniform vec3 uDeep;
  uniform vec3 uSea;
  uniform vec3 uHorizon;
  uniform vec3 uFogColor;
  uniform vec3 uSunDir;
  uniform float uSunStrength;
  uniform float uFoamRing;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vHeight;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorldPosition);
    vec3 L = normalize(uSunDir);
    float crest = smoothstep(-1.6, 1.2, vHeight);
    vec3 color = mix(uDeep, uSea, 0.45 + 0.55 * crest);
    float lambert = max(dot(N, L), 0.0);
    color *= 0.9 + 0.35 * lambert;
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 5.0);
    color = mix(color, uHorizon, fresnel * 0.34);
    float mirror = max(dot(reflect(-L, N), V), 0.0);
    color += vec3(1.0, 0.78, 0.44) * pow(mirror, 90.0) * uSunStrength * 0.7;
    color += vec3(1.0, 0.72, 0.46) * pow(mirror, 22.0) * uSunStrength * 0.07;
    float foam = pow(clamp(crest, 0.0, 1.0), 9.0) * 0.2 + uFoamRing;
    color = mix(color, vec3(0.9, 0.97, 1.0), clamp(foam, 0.0, 1.0));
    float distanceFog = smoothstep(320.0, 620.0, distance(cameraPosition, vWorldPosition));
    color = mix(color, mix(uFogColor, uHorizon, 0.5), distanceFog * 0.95);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export const OCEAN_FRAGMENT_SHADER = fragmentShader;

export function createOcean(theatre: Theatre, mobile: boolean, lowPower = false): THREE.Mesh {
  const segments = lowPower ? 32 : mobile ? 64 : 128;
  const geometry = new THREE.PlaneGeometry(620, 620, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  if (lowPower) {
    return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: theatre.sea }));
  }
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWaves: { value: waveUniforms.map((wave) => wave.clone()) },
      uWaveSpeeds: { value: GERSTNER_WAVES.map((wave) => wave.speed) },
      uDeep: { value: new THREE.Color(theatre.deep) },
      uSea: { value: new THREE.Color(theatre.sea) },
      uHorizon: { value: new THREE.Color(theatre.sky) },
      uFogColor: { value: new THREE.Color(theatre.fog) },
      uSunDir: { value: new THREE.Vector3(...theatre.sun).normalize() },
      uSunStrength: { value: 1.8 },
      uChoppy: { value: theatre.choppy },
      uFoamRing: { value: 0 },
    },
    vertexShader,
    fragmentShader,
  });
  return new THREE.Mesh(geometry, material);
}
