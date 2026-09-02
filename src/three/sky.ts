import * as THREE from "three";
import type { Theatre } from "./theatres.js";

export function createSky(theatre: Theatre): THREE.Group {
  const group = new THREE.Group();
  const gradient = new THREE.MeshBasicMaterial({ color: theatre.sky, side: THREE.BackSide });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(220, 24, 12), gradient);
  group.add(dome);

  const texture = new THREE.TextureLoader().load(theatre.art);
  texture.colorSpace = THREE.SRGBColorSpace;
  const horizon = new THREE.Mesh(
    new THREE.PlaneGeometry(260, 70),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.8 }),
  );
  horizon.position.set(0, 30, -118);
  group.add(horizon);
  return group;
}
