import * as THREE from "three";
import type { Theatre } from "./theatres.js";

const skyVertexShader = `
  varying vec3 vDirection;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vDirection = normalize(worldPosition.xyz - cameraPosition);
    gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
  }
`;

const skyFragmentShader = `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform float uTime;
  varying vec3 vDirection;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    return noise(p) * 0.65 + noise(p * 2.1 + 8.0) * 0.35;
  }

  void main() {
    float skyMix = smoothstep(-0.16, 0.7, vDirection.y);
    vec3 color = mix(uHorizon, uTop, skyMix);
    float sun = max(dot(normalize(vDirection), normalize(uSunDir)), 0.0);
    color += vec3(1.0, 0.52, 0.2) * pow(sun, 180.0) * 1.8;
    color += vec3(1.0, 0.5, 0.25) * pow(sun, 12.0) * 0.16;
    float cloudBand = smoothstep(-0.02, 0.38, vDirection.y) * (1.0 - smoothstep(0.38, 0.72, vDirection.y));
    float clouds = smoothstep(0.48, 0.78, fbm(vDirection.xz * 5.0 + vec2(uTime * 0.008, 0.0)));
    color = mix(color, color + vec3(0.23, 0.2, 0.17), clouds * cloudBand * 0.42);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createSky(theatre: Theatre): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color(theatre.deep) },
      uHorizon: { value: new THREE.Color(theatre.sky) },
      uSunDir: { value: new THREE.Vector3(...theatre.sun).normalize() },
      uTime: { value: 0 },
    },
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(390, 32, 18), material);
  dome.name = "sky-dome";
  group.add(dome);

  if (theatre.id === "salamis") {
    const islandMaterial = new THREE.MeshLambertMaterial({ color: "#253b3b" });
    for (const [x, z, scale] of [[-44, -118, 1], [48, -135, 0.75]] as const) {
      const island = new THREE.Mesh(new THREE.ConeGeometry(24 * scale, 13 * scale, 5), islandMaterial);
      island.name = "salamis-island";
      island.position.set(x, 5 * scale, z);
      island.scale.z = 0.45;
      group.add(island);
    }
  }
  return group;
}
