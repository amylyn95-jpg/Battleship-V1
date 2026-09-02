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
    float skyMix = smoothstep(-0.04, 0.2, vDirection.y);
    vec3 color = mix(uHorizon, uTop, skyMix);
    float sun = max(dot(normalize(vDirection), normalize(uSunDir)), 0.0);
    color += vec3(1.0, 0.72, 0.34) * pow(sun, 320.0) * 2.6;
    color += vec3(1.0, 0.6, 0.3) * pow(sun, 9.0) * 0.28;
    float cloudBand = smoothstep(0.005, 0.06, vDirection.y) * (1.0 - smoothstep(0.25, 0.75, vDirection.y));
    vec2 cloudPlane = vDirection.xz / max(vDirection.y, 0.02);
    float clouds = smoothstep(0.34, 0.72, fbm(cloudPlane * 0.06 + vec2(uTime * 0.004, 0.0)));
    color = mix(color, mix(color, vec3(1.0, 0.88, 0.78), 0.55), clouds * cloudBand * 0.7);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createSky(theatre: Theatre): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color(theatre.skyTop) },
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
