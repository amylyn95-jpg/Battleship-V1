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

export const TRAIL_PUFF_INTERVAL = 60;
export const TRAIL_PUFF_DURATION = 700;
export const TRAIL_PUFF_LIMIT = 24;

export interface TrailPuff {
  readonly mesh: THREE.Mesh;
  readonly startedAt: number;
}

export interface ProjectileTrail {
  readonly group: THREE.Group;
  readonly puffs: TrailPuff[];
  lastSpawnAt: number | null;
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
    apex: kind === "bomb" ? Math.max(44, from.y + 36) : kind === "bolt" ? 30 : 38,
    duration: kind === "bomb" ? 1900 : kind === "bolt" ? 1250 : 1500,
    startedAt: now,
    kind,
  };
}

export function createProjectileTrail(): ProjectileTrail {
  const group = new THREE.Group();
  group.name = "projectile-vapour-trail";
  return { group, puffs: [], lastSpawnAt: null };
}

export function updateProjectileTrail(
  trail: ProjectileTrail,
  point: ArcPoint,
  now: number,
  complete: boolean,
): boolean {
  if (!complete && (trail.lastSpawnAt === null || now - trail.lastSpawnAt >= TRAIL_PUFF_INTERVAL)) {
    if (trail.puffs.length < TRAIL_PUFF_LIMIT) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 6),
        new THREE.MeshBasicMaterial({ color: "#d8e4e6", transparent: true, opacity: 0.36 }),
      );
      puff.position.set(point.x, point.y, point.z);
      puff.scale.setScalar(0.4);
      trail.group.add(puff);
      trail.puffs.push({ mesh: puff, startedAt: now });
    }
    trail.lastSpawnAt = now;
  }
  for (let index = trail.puffs.length - 1; index >= 0; index--) {
    const puff = trail.puffs[index]!;
    const age = now - puff.startedAt;
    const progress = Math.max(0, Math.min(1, age / TRAIL_PUFF_DURATION));
    puff.mesh.scale.setScalar(0.4 + progress * 1.7);
    const material = puff.mesh.material as THREE.MeshBasicMaterial;
    material.opacity = 0.36 * (1 - progress);
    if (progress < 1) continue;
    trail.group.remove(puff.mesh);
    puff.mesh.geometry.dispose();
    material.dispose();
    trail.puffs.splice(index, 1);
  }
  return complete && trail.puffs.length === 0;
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
