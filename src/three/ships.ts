import * as THREE from "three";
import type { Ship } from "../types.js";
import { gridToWorld, type BoardSide } from "./grid.js";
import { waveHeight } from "./ocean.js";
import type { TheatreEra } from "./theatres.js";

export function damageStage(hits: number, length: number): 0 | 1 | 2 | 3 {
  if (hits <= 0) return 0;
  if (hits >= length) return 3;
  if (hits * 2 >= length) return 2;
  return 1;
}

export function sinkEasing(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

function material(color: string, options: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.76, metalness: 0.12, ...options });
}

function part(geometry: THREE.BufferGeometry, name: string, mat: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = name;
  return mesh;
}

function sailShip(shipId: string, span: number): THREE.Group {
  const group = new THREE.Group();
  group.name = `${shipId}-sail`;
  group.add(part(new THREE.CylinderGeometry(2.2, 1.6, span, 8), "hull", material("#2a2020")));
  group.children[0]!.rotation.z = Math.PI / 2;
  group.add(part(new THREE.BoxGeometry(span * 0.82, 0.32, 3.8), "deck", material("#70543a")));
  const mastCount = shipId === "destroyer" ? 2 : shipId === "carrier" ? 3 : 3;
  for (let index = 0; index < mastCount; index++) {
    const x = (index - (mastCount - 1) / 2) * span * 0.28;
    const mast = part(new THREE.CylinderGeometry(0.18, 0.24, 10, 8), `mast-${index + 1}`, material("#3d2922"));
    mast.position.set(x, 5, 0);
    group.add(mast);
    const sail = part(new THREE.PlaneGeometry(5.2, 6.2), `sail-${index + 1}`, new THREE.MeshStandardMaterial({
      color: "#d8c09b",
      side: THREE.DoubleSide,
      roughness: 0.95,
    }));
    sail.position.set(x + 1.1, 4.6, 0);
    sail.rotation.y = Math.PI / 2;
    group.add(sail);
  }
  const stripe = part(new THREE.BoxGeometry(span * 0.72, 0.24, 3.95), "gun-port-stripe", material("#b48a44"));
  stripe.position.y = 0.3;
  group.add(stripe);
  const stern = part(new THREE.BoxGeometry(span * 0.16, 2.4, 3.5), "stern-castle", material("#51362d"));
  stern.position.set(span * 0.34, 1.4, 0);
  group.add(stern);
  return group;
}

function oarShip(shipId: string, span: number): THREE.Group {
  const group = new THREE.Group();
  group.name = `${shipId}-oar`;
  group.add(part(new THREE.BoxGeometry(span, 1.45, 3.5), "hull", material("#c6a67b")));
  const ram = part(new THREE.ConeGeometry(1.35, 4.2, 8), "bronze-ram", material("#a87435", { metalness: 0.7 }));
  ram.rotation.z = -Math.PI / 2;
  ram.position.x = -span / 2 - 1.7;
  ram.position.y = -0.2;
  group.add(ram);
  const eye = part(new THREE.CircleGeometry(0.55, 20), "painted-eye", new THREE.MeshBasicMaterial({ color: "#12100e" }));
  eye.position.set(-span / 2 + 0.75, 0.4, -1.8);
  eye.rotation.x = -Math.PI / 2;
  group.add(eye);
  for (const side of [-1, 1]) {
    for (let index = 0; index < Math.max(3, Math.floor(span / 3)); index++) {
      const oar = part(new THREE.BoxGeometry(3.7, 0.12, 0.16), `oar-${side}-${index}`, material("#5d3826"));
      oar.position.set(-span * 0.35 + index * 2.7, 0.4, side * 2.05);
      oar.rotation.y = side * 0.25;
      group.add(oar);
    }
  }
  const mast = part(new THREE.CylinderGeometry(0.16, 0.22, 7, 8), "mast", material("#593b29"));
  mast.position.set(span * 0.12, 3.6, 0);
  group.add(mast);
  const sail = part(new THREE.PlaneGeometry(3.4, 3.2), "furled-sail", material("#bda27b", { side: THREE.DoubleSide }));
  sail.position.set(span * 0.12, 4, 0);
  sail.rotation.y = Math.PI / 2;
  group.add(sail);
  return group;
}

function steelShip(shipId: string, span: number): THREE.Group {
  const group = new THREE.Group();
  group.name = `${shipId}-steel`;
  group.add(part(new THREE.BoxGeometry(span, 2.2, 5.2), "hull", material("#53616a", { metalness: 0.52 })));
  const deck = part(new THREE.BoxGeometry(span * 0.82, 0.35, 4.5), "flight-deck", material("#68747a"));
  deck.position.y = 1.25;
  group.add(deck);
  if (shipId === "carrier") {
    for (const x of [-span * 0.18, 0, span * 0.18]) {
      const aircraft = part(new THREE.BoxGeometry(2.1, 0.18, 0.7), `parked-aircraft-${x}`, material("#d2d0c1"));
      aircraft.position.set(x, 1.6, 0);
      group.add(aircraft);
    }
  } else {
    for (const x of [-span * 0.22, span * 0.22]) {
      const turret = part(new THREE.CylinderGeometry(0.7, 0.8, 0.45, 12), `gun-turret-${x}`, material("#3f4a50"));
      turret.position.set(x, 1.7, 0);
      group.add(turret);
    }
  }
  const island = part(new THREE.BoxGeometry(span * 0.16, 2.4, 2.1), "island-superstructure", material("#b8b8ad"));
  island.position.set(span * 0.17, 2.55, 0);
  group.add(island);
  const funnel = part(new THREE.CylinderGeometry(0.42, 0.55, 2.5, 10), "funnel", material("#292f34"));
  funnel.position.set(span * 0.05, 3.5, 0);
  group.add(funnel);
  const mast = part(new THREE.CylinderGeometry(0.1, 0.14, 5, 8), "radar-mast", material("#343e43"));
  mast.position.set(span * 0.18, 5, 0);
  group.add(mast);
  return group;
}

export function buildShip(era: TheatreEra, shipId: string, length: number): THREE.Group {
  const span = Math.max(8, length * 5.2);
  const group = era === "sail" ? sailShip(shipId, span) : era === "oar" ? oarShip(shipId, span) : steelShip(shipId, span);
  group.userData.shipId = shipId;
  group.userData.span = span;
  return group;
}

export function updateShipPose(
  group: THREE.Group,
  ship: Ship,
  side: BoardSide,
  time: number,
  choppy: number,
): void {
  const first = gridToWorld(ship.cells[0]!, side);
  const last = gridToWorld(ship.cells[ship.cells.length - 1]!, side);
  const center = gridToWorld(ship.cells[Math.floor(ship.cells.length / 2)]!, side);
  const h0 = waveHeight(first.x, first.z, time, choppy);
  const h1 = waveHeight(last.x, last.z, time, choppy);
  const perpendicular = { x: -(last.z - first.z) / Math.max(ship.length * 6, 1), z: (last.x - first.x) / Math.max(ship.length * 6, 1) };
  const left = waveHeight(center.x + perpendicular.x * 2, center.z + perpendicular.z * 2, time, choppy);
  const right = waveHeight(center.x - perpendicular.x * 2, center.z - perpendicular.z * 2, time, choppy);
  group.position.set(center.x, 1.0 + waveHeight(center.x, center.z, time, choppy), center.z);
  group.rotation.y = Math.atan2(last.z - first.z, last.x - first.x);
  group.rotation.z = -Math.atan2(h1 - h0, Math.max(ship.length * 6, 1));
  group.rotation.x = Math.atan2(left - right, 4);
}

export function hitPosition(ship: Ship, coord: { row: number; col: number }, span: number): number {
  const index = ship.cells.findIndex((cell) => cell.row === coord.row && cell.col === coord.col);
  return index < 0 ? 0 : (index / Math.max(ship.length - 1, 1) - 0.5) * span;
}
