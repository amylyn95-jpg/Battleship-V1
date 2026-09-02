import * as THREE from "three";
import type { ProjectileKind } from "./theatres.js";

export interface ArcPoint {
  x: number;
  y: number;
  z: number;
}

export function arcPoint(from: ArcPoint, to: ArcPoint, apex: number, t: number): ArcPoint {
  const progress = Math.max(0, Math.min(1, t));
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress + apex * 4 * progress * (1 - progress),
    z: from.z + (to.z - from.z) * progress,
  };
}

export interface ProjectileFlight {
  readonly group: THREE.Group;
  readonly from: ArcPoint;
  readonly to: ArcPoint;
  readonly apex: number;
  readonly duration: number;
  readonly startedAt: number;
  readonly kind: ProjectileKind;
}

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, name: string): THREE.Mesh {
  const result = new THREE.Mesh(geometry, material);
  result.name = name;
  return result;
}

export function createProjectile(kind: ProjectileKind, from: ArcPoint, to: ArcPoint, now: number): ProjectileFlight {
  const group = new THREE.Group();
  group.name = `${kind}-projectile`;
  if (kind === "cannonball") {
    group.add(mesh(new THREE.SphereGeometry(0.7, 10, 8), new THREE.MeshStandardMaterial({ color: "#4b4b4b", metalness: 0.65 }), "cannonball"));
    group.add(mesh(new THREE.SphereGeometry(1.3, 8, 6), new THREE.MeshBasicMaterial({ color: "#9a6942", transparent: true, opacity: 0.16 }), "muzzle-smoke"));
  } else if (kind === "bolt") {
    const bolt = mesh(new THREE.CylinderGeometry(0.16, 0.24, 2.4, 8), new THREE.MeshStandardMaterial({ color: "#d39a35", emissive: "#bd3d16", emissiveIntensity: 1.8 }), "flaming-bolt");
    bolt.rotation.z = Math.PI / 2;
    group.add(bolt);
    group.add(mesh(new THREE.SphereGeometry(0.65, 8, 6), new THREE.MeshBasicMaterial({ color: "#f26d32", transparent: true, opacity: 0.45 }), "bolt-trail"));
  } else {
    const aircraft = mesh(new THREE.BoxGeometry(3.8, 0.18, 1.4), new THREE.MeshStandardMaterial({ color: "#a4a9a5", metalness: 0.45 }), "dive-bomber");
    const wing = mesh(new THREE.BoxGeometry(1.2, 0.08, 4.5), new THREE.MeshStandardMaterial({ color: "#7e8a8c" }), "aircraft-wings");
    group.add(aircraft, wing);
    const bomb = mesh(new THREE.SphereGeometry(0.38, 8, 6), new THREE.MeshStandardMaterial({ color: "#31373a", metalness: 0.5 }), "bomb");
    bomb.position.y = -0.8;
    group.add(bomb);
  }
  return {
    group,
    from,
    to,
    apex: kind === "bomb" ? Math.max(26, from.y + 22) : kind === "bolt" ? 15 : 22,
    duration: kind === "bomb" ? 1600 : kind === "bolt" ? 900 : 1100,
    startedAt: now,
    kind,
  };
}

export function updateProjectile(flight: ProjectileFlight, now: number): boolean {
  const t = Math.max(0, Math.min(1, (now - flight.startedAt) / flight.duration));
  const point = arcPoint(flight.from, flight.to, flight.apex, t);
  flight.group.position.set(point.x, point.y, point.z);
  const next = arcPoint(flight.from, flight.to, flight.apex, Math.min(1, t + 0.02));
  flight.group.lookAt(next.x, next.y, next.z);
  if (flight.kind === "bomb") {
    const bomb = flight.group.getObjectByName("bomb");
    if (bomb) bomb.visible = t > 0.45;
  }
  return t >= 1;
}
