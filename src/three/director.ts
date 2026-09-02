import * as THREE from "three";
import type { Coord, ShotResult } from "../types.js";
import type { Session } from "../session.js";
import type { Screen } from "../view-types.js";
import { gridToWorld, worldToGrid } from "./grid.js";
import { createScene, type SceneRig } from "./scene.js";
import { theatreConfig, type TheatreId } from "./theatres.js";

export interface Director {
  setTheatre(id: TheatreId): void;
  syncBoards(session: Session, screen: Screen, revealEnemy: boolean): void;
  aim(coord: Coord | null): void;
  playerShot(results: readonly ShotResult[], salvo: boolean): void;
  enemyShot(results: readonly ShotResult[]): void;
  setStatic(on: boolean): void;
  dispose(): void;
}

function marker(coord: Coord, side: "player" | "enemy", color: string): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(1.2, 16),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }),
  );
  const point = gridToWorld(coord, side);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(point.x, 0.45, point.z);
  return mesh;
}

export function createDirector(
  container: HTMLElement,
  opts: { theatre: TheatreId; onPick: (coord: Coord) => void; onHover: (coord: Coord | null) => void },
): Director {
  let rig: SceneRig;
  try {
    rig = createScene(container, opts.theatre);
  } catch {
    container.textContent = "";
    throw new Error("3D scene unavailable");
  }
  const markers = new THREE.Group();
  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(1.6, 2.1, 24),
    new THREE.MeshBasicMaterial({ color: "#f2c14e", side: THREE.DoubleSide }),
  );
  reticle.rotation.x = -Math.PI / 2;
  reticle.visible = false;
  rig.scene.add(markers, reticle);
  let markerSignature = "";
  const clearMarkers = (): void => {
    for (const child of markers.children) {
      child.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
        else mesh.material?.dispose();
      });
    }
    markers.clear();
  };
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pick = (event: PointerEvent): Coord | null => {
    const rect = rig.renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, rig.player);
    const hit = raycaster.intersectObject(rig.ocean)[0];
    return hit ? worldToGrid(hit.point.x, hit.point.z, "enemy") : null;
  };
  rig.renderer.domElement.addEventListener("pointermove", (event) => {
    const coord = pick(event);
    opts.onHover(coord);
  });
  rig.renderer.domElement.addEventListener("pointerleave", () => opts.onHover(null));
  rig.renderer.domElement.addEventListener("click", (event) => {
    const coord = pick(event);
    if (coord) opts.onPick(coord);
  });

  return {
    setTheatre(id): void {
      rig.setTheatre(theatreConfig(id));
    },
    syncBoards(session, screen, revealEnemy): void {
      reticle.visible = screen === "battle" && session.turn === "human" && session.phase === "playing";
      const signature = `${session.playerShots.length}:${session.aiShots.length}:${session.mode}`;
      if (signature !== markerSignature) {
        clearMarkers();
        for (const result of session.playerShots) {
          markers.add(marker(result.coord, "enemy", session.mode === "salvo" ? "#9fb8c8" : result.hit ? "#e05d3a" : "#eaf6ff"));
        }
        for (const result of session.aiShots) {
          markers.add(marker(result.coord, "player", result.hit ? "#e05d3a" : "#eaf6ff"));
        }
        markerSignature = signature;
      }
      if (!revealEnemy) return;
      // Phase B will add procedural ships here; keep this seam read-only for now.
    },
    aim(coord): void {
      if (!coord) {
        reticle.visible = false;
        return;
      }
      const point = gridToWorld(coord, "enemy");
      reticle.position.set(point.x, 0.7, point.z);
      reticle.visible = true;
    },
    playerShot(results, salvo): void {
      // TODO(Phase B): launch the theatre projectile and resolve its impact camera move.
      for (const result of results) markers.add(marker(result.coord, "enemy", salvo ? "#9fb8c8" : result.hit ? "#e05d3a" : "#eaf6ff"));
    },
    enemyShot(results): void {
      // TODO(Phase B): launch incoming projectiles and add ship damage cinematics.
      for (const result of results) markers.add(marker(result.coord, "player", result.hit ? "#e05d3a" : "#eaf6ff"));
    },
    setStatic(on): void {
      rig.setStatic(on);
    },
    dispose(): void {
      rig.dispose();
    },
  };
}
