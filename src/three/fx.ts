import * as THREE from "three";

export type ImpactVisualKind = "neutral" | "hit" | "sunk";

export interface FxVisual {
  readonly group: THREE.Group;
  readonly startedAt: number;
  readonly duration: number;
  readonly persistent: boolean;
  readonly fadeDuration: number;
}

function material(color: string, opacity = 1): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
}

export function createImpact(kind: ImpactVisualKind, position: THREE.Vector3, now: number): FxVisual {
  const group = new THREE.Group();
  group.name = `${kind}-impact`;
  const foam = new THREE.Mesh(new THREE.RingGeometry(1.4, 2.0, 24), material("#d8f4ef", 0.8));
  foam.rotation.x = -Math.PI / 2;
  group.add(foam);
  const plumeHeight = kind === "sunk" ? 26 : kind === "neutral" ? 22 : 17;
  const plume = new THREE.Mesh(
    new THREE.CylinderGeometry(kind === "sunk" ? 2.4 : 1.5, kind === "sunk" ? 3.4 : 2.2, plumeHeight, 14, 1, true),
    material("#f4f8f2", 0.66),
  );
  plume.name = "plume";
  plume.position.y = plumeHeight / 2;
  group.add(plume);
  const spray = new THREE.Mesh(new THREE.SphereGeometry(kind === "sunk" ? 3.4 : 2.4, 12, 9), material("#ffffff", 0.52));
  spray.name = "spray";
  spray.position.y = plumeHeight;
  group.add(spray);
  if (kind !== "neutral") {
    const fire = new THREE.Mesh(new THREE.SphereGeometry(kind === "sunk" ? 4.4 : 2.8, 14, 10), material("#f06a2d", 0.92));
    fire.name = "fireball";
    fire.position.y = 3.2;
    group.add(fire);
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(kind === "sunk" ? 4.8 : 3.6, 14, 10),
      material("#ffe29a", 0.95),
    );
    flash.name = "airburst-flash";
    flash.position.y = kind === "sunk" ? 13 : 11;
    (flash.material as THREE.MeshBasicMaterial).depthTest = false;
    flash.renderOrder = 2;
    group.add(flash);
    const shockwave = new THREE.Mesh(
      new THREE.RingGeometry(kind === "sunk" ? 3.5 : 2.6, kind === "sunk" ? 3.9 : 3.0, 32),
      material("#ffd36a", 0.72),
    );
    shockwave.name = "airburst-shockwave";
    shockwave.position.y = kind === "sunk" ? 13 : 11;
    (shockwave.material as THREE.MeshBasicMaterial).depthTest = false;
    shockwave.renderOrder = 2;
    group.add(shockwave);
  }
  group.position.copy(position);
  return {
    group,
    startedAt: now,
    duration: kind === "sunk" ? 2500 : 1050,
    persistent: kind !== "neutral",
    fadeDuration: kind === "neutral" ? 0 : 2200,
  };
}

export function createDamageEffect(stage: 0 | 1 | 2 | 3, x: number): THREE.Group | null {
  if (stage === 0) return null;
  const group = new THREE.Group();
  group.name = stage >= 3 ? "sinking-fire-smoke" : stage >= 2 ? "heavy-fire-smoke" : "fire-smoke-wisp";
  group.position.set(x, 2.4, 0);
  const fire = new THREE.Mesh(new THREE.SphereGeometry(stage >= 2 ? 0.9 : 0.55, 10, 8), material("#ed642b", 0.9));
  fire.name = "fire";
  group.add(fire);
  const smoke = new THREE.Mesh(new THREE.SphereGeometry(stage >= 2 ? 1.5 : 0.9, 10, 8), material("#4d4f4d", stage >= 2 ? 0.48 : 0.28));
  smoke.name = "smoke";
  smoke.position.y = stage >= 2 ? 1.8 : 1.1;
  group.add(smoke);
  if (stage >= 2) {
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1.05, 5, 10), material("#454847", 0.28));
    column.name = "smoke-column";
    column.position.y = 4;
    group.add(column);
  }
  return group;
}

export function updateFx(visual: FxVisual, now: number): boolean {
  const age = now - visual.startedAt;
  const t = Math.max(0, Math.min(1, age / visual.duration));
  visual.group.scale.setScalar(0.5 + t * 0.8);
  const plume = visual.group.getObjectByName("plume");
  if (plume) plume.scale.y = 0.25 + Math.min(1, t * 2.2);
  const spray = visual.group.getObjectByName("spray");
  if (spray) spray.scale.setScalar(0.6 + t * 1.1);
  const fire = visual.group.getObjectByName("fireball");
  if (fire) fire.scale.setScalar(1 + Math.sin(t * Math.PI) * 0.7);
  const flash = visual.group.getObjectByName("airburst-flash");
  if (flash) {
    const burst = Math.max(0, Math.min(1, age / 900));
    flash.scale.setScalar(0.35 + burst * 2.4);
    const material = (flash as THREE.Mesh).material as THREE.MeshBasicMaterial;
    material.opacity = 0.95 * (1 - burst);
  }
  const shockwave = visual.group.getObjectByName("airburst-shockwave");
  if (shockwave) {
    const burst = Math.max(0, Math.min(1, age / 900));
    shockwave.scale.setScalar(0.35 + burst * 2.8);
    const material = (shockwave as THREE.Mesh).material as THREE.MeshBasicMaterial;
    material.opacity = 0.72 * (1 - burst);
  }
  if (visual.persistent && age >= visual.duration) {
    const fade = Math.max(0, 1 - (age - visual.duration) / visual.fadeDuration);
    visual.group.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        const baseOpacity = typeof material.userData.baseOpacity === "number"
          ? material.userData.baseOpacity
          : material.opacity;
        material.userData.baseOpacity = baseOpacity;
        material.opacity = baseOpacity * fade;
      }
    });
  }
  return age >= visual.duration + visual.fadeDuration;
}

export function updateDamageEffect(group: THREE.Group, now: number): void {
  const pulse = 1 + Math.sin(now / 180) * 0.12;
  const fire = group.getObjectByName("fire");
  if (fire) fire.scale.setScalar(pulse);
  const smoke = group.getObjectByName("smoke");
  if (smoke) {
    const baseY = typeof smoke.userData.baseY === "number" ? smoke.userData.baseY : smoke.position.y;
    smoke.userData.baseY = baseY;
    smoke.position.y = baseY + Math.sin(now / 180) * 0.12;
  }
}
