import * as THREE from "three";
import type { Board, Coord, Ship, ShotResult, TheatreId } from "../types.js";
import type { Session } from "../session.js";
import { gridToWorld, worldToGrid, type BoardSide } from "./grid.js";
import { createImpact, createDamageEffect, type FxVisual, updateDamageEffect, updateFx } from "./fx.js";
import {
  createProjectile,
  createProjectileTrail,
  updateProjectile,
  updateProjectileTrail,
  type ProjectileFlight,
  type ProjectileTrail,
} from "./projectiles.js";
import { createScene, disposeObject, type SceneRig } from "./scene.js";
import { buildShip, damageStage, hitPosition, sinkEasing, updateShipPose } from "./ships.js";
import { theatreConfig } from "./theatres.js";
import type { Screen } from "../view-types.js";

export interface Director {
  setTheatre(id: TheatreId): void;
  syncBoards(session: Session, screen: Screen, revealEnemy: boolean): void;
  aim(coord: Coord | null): void;
  playerShot(results: readonly ShotResult[], salvo: boolean): void;
  enemyShot(results: readonly ShotResult[]): void;
  setStatic(on: boolean): void;
  dispose(): void;
}

interface ShipVisual {
  readonly group: THREE.Group;
  readonly ship: Ship;
  readonly side: BoardSide;
  readonly damage: THREE.Group[];
  sinkStartedAt: number | null;
}

interface ImpactFlight {
  readonly flight: ProjectileFlight;
  readonly trail: ProjectileTrail | null;
  readonly target: THREE.Vector3;
  readonly kind: "neutral" | "hit" | "sunk";
  impactStarted: boolean;
}

function marker(coord: Coord, side: BoardSide, color: string): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(1.2, 16),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }),
  );
  const point = gridToWorld(coord, side);
  mesh.name = `${side}-water-marker`;
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(point.x, 0.45, point.z);
  return mesh;
}

function resultKind(result: ShotResult): "hit" | "sunk" | "miss" {
  if (result.sunk) return "sunk";
  return result.hit ? "hit" : "miss";
}

const TARGET_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.38);

export function pickTarget(ray: THREE.Ray): Coord | null {
  const point = ray.intersectPlane(TARGET_PLANE, new THREE.Vector3());
  return point ? worldToGrid(point.x, point.z, "enemy") : null;
}

function makeTargetGrid(): THREE.Group {
  const group = new THREE.Group();
  group.name = "enemy-target-grid";
  const positions: number[] = [];
  for (let index = 0; index <= 10; index++) {
    const offset = -30 + index * 6;
    positions.push(-30, 0.38, -84 + index * 6, 30, 0.38, -84 + index * 6);
    positions.push(offset, 0.38, -84, offset, 0.38, -24);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: "#9ee4e5", transparent: true, opacity: 0.25 }));
  group.add(lines);
  const mist = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshBasicMaterial({ color: "#b9d6d2", transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }),
  );
  mist.name = "enemy-fog-of-war";
  mist.rotation.x = -Math.PI / 2;
  mist.position.set(0, 0.3, -54);
  group.add(mist);
  return group;
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
  let theatre = theatreConfig(opts.theatre);
  let staticMode = false;
  const markers = new THREE.Group();
  markers.name = "water-markers";
  const targetGrid = makeTargetGrid();
  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(1.6, 2.1, 24),
    new THREE.MeshBasicMaterial({ color: "#f2c14e", side: THREE.DoubleSide }),
  );
  reticle.name = "target-reticle";
  reticle.rotation.x = -Math.PI / 2;
  reticle.visible = false;
  rig.scene.add(markers, targetGrid, reticle);

  const fleets: Record<BoardSide, Map<string, ShipVisual>> = {
    player: new Map(),
    enemy: new Map(),
  };
  let markerSignature = "";
  let fleetSignature = "";
  let sceneSignature = "";
  let sceneScreen: Screen | null = null;
  let sceneBoardKey = "";
  let currentAim: Coord | null = null;
  const projectiles: ImpactFlight[] = [];
  const impacts: FxVisual[] = [];

  const clearMarkers = (): void => {
    for (const child of [...markers.children]) {
      if (child instanceof THREE.Mesh) disposeObject(child);
      markers.remove(child);
    }
  };
  const clearFleet = (side: BoardSide): void => {
    for (const visual of fleets[side].values()) {
      for (const damage of visual.damage) disposeObject(damage);
      disposeObject(visual.group);
      rig.scene.remove(visual.group);
    }
    fleets[side].clear();
  };
  const renderFleet = (board: Board, side: BoardSide, visible: boolean): void => {
    if (!visible) {
      clearFleet(side);
      return;
    }
    clearFleet(side);
    for (const ship of board.ships) {
      const group = buildShip(theatre.era, ship.id, ship.length);
      const damage: THREE.Group[] = [];
      const stage = damageStage(ship.hits.length, ship.length);
      const span = Number(group.userData.span) || ship.length * 5.2;
      for (const hit of ship.hits) {
        const effect = createDamageEffect(stage >= 2 ? 2 : 1, hitPosition(ship, hit, span));
        if (effect) {
          group.add(effect);
          damage.push(effect);
        }
      }
      rig.scene.add(group);
      fleets[side].set(ship.id, { group, ship, side, damage, sinkStartedAt: stage === 3 ? performance.now() : null });
    }
  };

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pick = (event: PointerEvent): Coord | null => {
    const rect = rig.renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, rig.camera);
    return pickTarget(raycaster.ray);
  };
  rig.renderer.domElement.addEventListener("pointermove", (event) => opts.onHover(pick(event)));
  rig.renderer.domElement.addEventListener("pointerleave", () => opts.onHover(null));
  rig.renderer.domElement.addEventListener("click", (event) => {
    const coord = pick(event);
    if (coord) opts.onPick(coord);
  });

  const updateVisuals = (now: number): void => {
    const seconds = now / 1000;
    for (const side of ["player", "enemy"] as const) {
      for (const visual of fleets[side].values()) {
        if (visual.sinkStartedAt !== null) {
          const progress = Math.min(1, (now - visual.sinkStartedAt) / 2500);
          const eased = sinkEasing(progress);
          visual.group.rotation.z = side === "player" ? -0.9 * eased : 0.9 * eased;
          visual.group.position.y -= eased * 0.015;
          if (progress >= 1) visual.group.visible = false;
        } else {
          updateShipPose(visual.group, visual.ship, visual.side, seconds, theatre.choppy);
        }
        for (const damage of visual.damage) updateDamageEffect(damage, now);
      }
    }
    for (let index = projectiles.length - 1; index >= 0; index--) {
      const flight = projectiles[index]!;
      const arrived = flight.impactStarted || updateProjectile(flight.flight, now);
      const trailDone = flight.trail
        ? updateProjectileTrail(flight.trail, flight.flight.group.position, now, arrived)
        : true;
      if (arrived && !flight.impactStarted) {
        rig.scene.remove(flight.flight.group);
        disposeObject(flight.flight.group);
        const impact = createImpact(flight.kind, flight.target, now);
        rig.scene.add(impact.group);
        impacts.push(impact);
        flight.impactStarted = true;
      }
      if (!arrived || !trailDone) continue;
      if (flight.trail) {
        rig.scene.remove(flight.trail.group);
        disposeObject(flight.trail.group);
      }
      projectiles.splice(index, 1);
    }
    for (let index = impacts.length - 1; index >= 0; index--) {
      if (!updateFx(impacts[index]!, now)) continue;
      const visual = impacts[index]!;
      rig.scene.remove(visual.group);
      disposeObject(visual.group);
      impacts.splice(index, 1);
    }
  };
  const removeUpdater = rig.addFrameUpdater((now) => updateVisuals(now));

  const launch = (coord: Coord, side: BoardSide, kind: "neutral" | "hit" | "sunk"): void => {
    const point = gridToWorld(coord, side === "enemy" ? "enemy" : "player");
    const from = side === "enemy"
      ? { x: 0, y: 8, z: 52 }
      : { x: 0, y: 8, z: -52 };
    const to = { x: point.x, y: 0.8, z: point.z };
    if (staticMode) {
      const impact = createImpact(kind, new THREE.Vector3(to.x, to.y, to.z), performance.now());
      rig.scene.add(impact.group);
      impacts.push(impact);
      return;
    }
    const flight = createProjectile(theatre.projectile, from, to, performance.now());
    const trail = !staticMode && rig.trailCapable && !(window.matchMedia?.("(max-width: 700px)").matches ?? false)
      ? createProjectileTrail()
      : null;
    rig.scene.add(flight.group);
    if (trail) rig.scene.add(trail.group);
    projectiles.push({ flight, trail, target: new THREE.Vector3(to.x, to.y, to.z), kind, impactStarted: false });
  };

  return {
    setTheatre(id): void {
      theatre = theatreConfig(id);
      rig.setTheatre(theatre);
      fleetSignature = "";
      rig.render(true);
    },
    syncBoards(session, screen, revealEnemy): void {
      const activeRig = screen === "command" || screen === "deploy" || screen === "debrief"
        ? "overview"
        : session.turn === "ai" ? "own" : "player";
      rig.setRig(activeRig);
      targetGrid.visible = screen === "battle";
      reticle.visible = currentAim !== null && screen === "battle" && session.turn === "human" && session.phase === "playing";
      const markerKey = `${session.playerShots.length}:${session.aiShots.length}:${session.mode}`;
      if (markerKey !== markerSignature) {
        clearMarkers();
        for (const result of session.playerShots) {
          markers.add(marker(result.coord, "enemy", session.mode === "salvo" ? "#9fb8c8" : result.hit ? "#e05d3a" : "#eaf6ff"));
        }
        for (const result of session.aiShots) markers.add(marker(result.coord, "player", result.hit ? "#e05d3a" : "#eaf6ff"));
        markerSignature = markerKey;
      }
      const boardKey = JSON.stringify([
        session.playerBoard.ships.map((ship) => [ship.id, ship.hits.length]),
        revealEnemy ? session.aiBoard.ships.map((ship) => [ship.id, ship.hits.length]) : [],
        revealEnemy,
        screen !== "command",
        theatre.id,
      ]);
      if (boardKey !== fleetSignature) {
        renderFleet(session.playerBoard, "player", screen !== "command");
        renderFleet(session.aiBoard, "enemy", revealEnemy);
        fleetSignature = boardKey;
      }
      const sceneKey = [
        activeRig,
        targetGrid.visible,
        reticle.visible,
        currentAim?.row ?? "",
        currentAim?.col ?? "",
        boardKey,
      ].join(":");
      if (sceneKey !== sceneSignature) {
        rig.render(sceneScreen === null || sceneScreen !== screen || sceneBoardKey !== boardKey);
        sceneSignature = sceneKey;
        sceneScreen = screen;
        sceneBoardKey = boardKey;
      }
    },
    aim(coord): void {
      currentAim = coord;
      if (coord === null) {
        reticle.visible = false;
        rig.render();
        return;
      }
      const point = gridToWorld(coord, "enemy");
      reticle.position.set(point.x, 0.8, point.z);
      reticle.visible = true;
      rig.render();
    },
    playerShot(results, salvo): void {
      rig.setRig("player");
      for (const result of results) {
        rig.focusImpact(result.coord, "enemy");
        const kind = resultKind(result);
        launch(result.coord, "enemy", salvo || kind === "miss" ? "neutral" : kind);
        markers.add(marker(result.coord, "enemy", salvo ? "#9fb8c8" : result.hit ? "#e05d3a" : "#eaf6ff"));
      }
      rig.render();
    },
    enemyShot(results): void {
      rig.setRig("own");
      for (const result of results) {
        rig.focusImpact(result.coord, "player");
        const kind = resultKind(result);
        launch(result.coord, "player", kind === "miss" ? "neutral" : kind);
        markers.add(marker(result.coord, "player", result.hit ? "#e05d3a" : "#eaf6ff"));
      }
      rig.render();
    },
    setStatic(on): void {
      staticMode = on;
      rig.setStatic(on);
    },
    dispose(): void {
      removeUpdater();
      rig.dispose();
    },
  };
}
