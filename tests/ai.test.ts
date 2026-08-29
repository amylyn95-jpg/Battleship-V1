import { describe, expect, it } from "vitest";
import { candidateCells, createAi, densityMap, nextShot, recordResult } from "../src/ai.js";
import { coordKey, emptyBoard, placeShip, randomFleet } from "../src/board.js";
import { fire } from "../src/game.js";
import { FLEET } from "../src/types.js";
import type { Coord, Difficulty } from "../src/types.js";

/** Deterministic PRNG (mulberry32) so failures are reproducible. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Plays one full game and returns how many shots the AI needed. */
function playGame(difficulty: Difficulty, seed: number): { shots: number; unique: boolean } {
  const random = seeded(seed);
  let board = randomFleet(random);
  const ai = createAi(difficulty);
  const seen = new Set<string>();
  let shots = 0;

  for (; shots < 100; ) {
    const coord = nextShot(ai, random);
    const key = coordKey(coord);
    if (seen.has(key)) return { shots, unique: false };
    seen.add(key);
    const outcome = fire(board, coord);
    board = outcome.board;
    recordResult(ai, outcome.result);
    shots++;
    if (outcome.result.fleetDestroyed) break;
  }
  return { shots, unique: true };
}

const difficulties: Difficulty[] = ["easy", "normal", "hard"];

describe("ai self-play", () => {
  for (const difficulty of difficulties) {
    it(`${difficulty}: never repeats a shot and always finishes within 100 shots`, () => {
      for (let seed = 1; seed <= 300; seed++) {
        const { shots, unique } = playGame(difficulty, seed);
        expect(unique, `repeat shot on seed ${seed}`).toBe(true);
        expect(shots, `seed ${seed} did not finish`).toBeLessThanOrEqual(100);
      }
    });
  }

  it("gets stronger as difficulty rises", () => {
    const averages = difficulties.map((difficulty) => {
      let total = 0;
      const games = 300;
      for (let seed = 1; seed <= games; seed++) total += playGame(difficulty, seed).shots;
      return total / games;
    });
    const [easy, normal, hard] = averages as [number, number, number];
    expect(easy).toBeGreaterThan(normal);
    expect(normal).toBeGreaterThan(hard);
    // Sanity band: a competent AI clears the board well under a random sweep.
    expect(hard).toBeLessThan(60);
    expect(easy).toBeGreaterThan(80);
  });
});

describe("hunt and target", () => {
  it("finishes a ship it has wounded before hunting elsewhere", () => {
    const destroyer = FLEET[4]!;
    let board = placeShip(emptyBoard(), destroyer, { row: 4, col: 4 }, "horizontal");
    const ai = createAi("normal");
    const random = seeded(7);

    const first = fire(board, { row: 4, col: 4 });
    board = first.board;
    recordResult(ai, first.result);

    // Every follow-up shot must be adjacent to the known hit until the ship dies.
    const follow = nextShot(ai, random);
    const adjacent = [
      { row: 3, col: 4 },
      { row: 5, col: 4 },
      { row: 4, col: 3 },
      { row: 4, col: 5 },
    ];
    expect(adjacent.some((c) => c.row === follow.row && c.col === follow.col)).toBe(true);
  });

  it("locks onto the axis once two hits line up", () => {
    const cruiser = FLEET[2]!;
    let board = placeShip(emptyBoard(), cruiser, { row: 2, col: 2 }, "horizontal");
    const ai = createAi("normal");

    for (const coord of [
      { row: 2, col: 2 },
      { row: 2, col: 3 },
    ] satisfies Coord[]) {
      const outcome = fire(board, coord);
      board = outcome.board;
      recordResult(ai, outcome.result);
    }

    expect(ai.axis).toBe("horizontal");
    // Only the two ends of the run remain as candidates.
    expect(ai.queue).toEqual([
      { row: 2, col: 1 },
      { row: 2, col: 4 },
    ]);
  });

  it("resumes on a second wounded ship after sinking the first", () => {
    let board = placeShip(emptyBoard(), FLEET[4]!, { row: 0, col: 0 }, "horizontal");
    board = placeShip(board, FLEET[2]!, { row: 2, col: 0 }, "horizontal");
    const ai = createAi("normal");

    for (const coord of [
      { row: 2, col: 0 }, // wound the cruiser
      { row: 0, col: 0 },
      { row: 0, col: 1 }, // sink the destroyer
    ] satisfies Coord[]) {
      const outcome = fire(board, coord);
      board = outcome.board;
      recordResult(ai, outcome.result);
    }

    expect(ai.activeHits).toEqual([{ row: 2, col: 0 }]);
    const follow = nextShot(ai, seeded(3));
    expect([
      { row: 1, col: 0 },
      { row: 3, col: 0 },
      { row: 2, col: 1 },
    ]).toContainEqual(follow);
  });

  it("recovers when two touching ships fake a wrong axis", () => {
    // Destroyer and cruiser meet at a corner, so the AI's first two hits can
    // line up on an axis that belongs to no single ship.
    let board = placeShip(emptyBoard(), FLEET[4]!, { row: 0, col: 0 }, "vertical");
    board = placeShip(board, FLEET[2]!, { row: 0, col: 1 }, "horizontal");
    const ai = createAi("normal");
    const random = seeded(5);

    for (const coord of [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ] satisfies Coord[]) {
      const outcome = fire(board, coord);
      board = outcome.board;
      recordResult(ai, outcome.result);
    }

    let shots = 0;
    while (shots < 100) {
      const outcome = fire(board, nextShot(ai, random));
      board = outcome.board;
      recordResult(ai, outcome.result);
      shots++;
      if (board.ships.every((s) => s.hits.length === s.length)) break;
    }
    expect(board.ships.every((s) => s.hits.length === s.length)).toBe(true);
  });

  it("never fires at a cell it already tried, even from the queue", () => {
    const ai = createAi("normal");
    const board = randomFleet(seeded(11));
    let current = board;
    for (let i = 0; i < 40; i++) {
      const coord = nextShot(ai, seeded(i + 1));
      expect(ai.tried.has(coordKey(coord))).toBe(false);
      const outcome = fire(current, coord);
      current = outcome.board;
      recordResult(ai, outcome.result);
      if (outcome.result.fleetDestroyed) break;
    }
  });
});

describe("human-like imperfection", () => {
  /** Wounds a ship and misses one probe, leaving a live lead plus a miss. */
  function chasingAfterAMiss(): ReturnType<typeof createAi> {
    let board = placeShip(emptyBoard(), FLEET[2]!, { row: 4, col: 4 }, "horizontal");
    const ai = createAi("normal");
    for (const coord of [
      { row: 4, col: 4 }, // hit
      { row: 3, col: 4 }, // miss
    ] satisfies Coord[]) {
      const outcome = fire(board, coord);
      board = outcome.board;
      recordResult(ai, outcome.result);
    }
    return ai;
  }

  it("keeps chasing when it does not lose the thread", () => {
    const ai = chasingAfterAMiss();
    const head = ai.queue[0]!;
    expect(nextShot(ai, () => 0.99)).toEqual(head);
  });

  it("breaks off after a miss but keeps the lead for later", () => {
    const ai = chasingAfterAMiss();
    const head = ai.queue[0]!;
    const shot = nextShot(ai, () => 0);
    expect(shot).not.toEqual(head);
    expect(ai.queue).toContainEqual(head);
  });

  it("never breaks off a chase straight after a hit", () => {
    let board = placeShip(emptyBoard(), FLEET[2]!, { row: 4, col: 4 }, "horizontal");
    const ai = createAi("normal");
    const outcome = fire(board, { row: 4, col: 4 });
    board = outcome.board;
    recordResult(ai, outcome.result);
    expect(nextShot(ai, () => 0)).toEqual(ai.queue[0]!);
  });

  it("searches with human spacing instead of a fixed lattice", () => {
    const ai = createAi("normal");
    const random = seeded(21);
    const board = emptyBoard();
    const shots: Coord[] = [];

    for (let i = 0; i < 8; i++) {
      const coord = nextShot(ai, random);
      // Every searching shot keeps its distance from the ones before it.
      for (const earlier of shots) {
        const gap = Math.max(Math.abs(earlier.row - coord.row), Math.abs(earlier.col - coord.col));
        expect(gap).toBeGreaterThanOrEqual(2);
      }
      shots.push(coord);
      recordResult(ai, fire(board, coord).result);
    }
    expect(shots.some((c) => (c.row + c.col) % 2 !== 0)).toBe(true);
  });

  it("telegraphs candidate cells it has not already fired at", () => {
    const ai = createAi("normal");
    recordResult(ai, { coord: { row: 6, col: 6 }, hit: false, fleetDestroyed: false });
    const shown = candidateCells(ai, 4, seeded(4));
    expect(shown).toHaveLength(4);
    for (const coord of shown) expect(ai.tried.has(coordKey(coord))).toBe(false);
    expect(new Set(shown.map(coordKey)).size).toBe(shown.length);
  });

  it("chooses its shot from its own history alone", () => {
    // Two states with identical contents must produce identical shots, which is
    // only possible if nothing outside the AI's own record can influence it.
    const [a, b] = [createAi("hard"), createAi("hard")];
    for (const ai of [a, b]) {
      recordResult(ai, { coord: { row: 0, col: 0 }, hit: false, fleetDestroyed: false });
      recordResult(ai, { coord: { row: 5, col: 5 }, hit: true, fleetDestroyed: false });
    }
    expect(nextShot(a, seeded(9))).toEqual(nextShot(b, seeded(9)));
  });
});

describe("density map", () => {
  it("excludes placements blocked by known misses", () => {
    const ai = createAi("hard");
    const before = densityMap(ai).get(coordKey({ row: 0, col: 1 })) ?? 0;
    recordResult(ai, { coord: { row: 0, col: 0 }, hit: false, fleetDestroyed: false });
    const after = densityMap(ai).get(coordKey({ row: 0, col: 1 })) ?? 0;
    expect(after).toBeLessThan(before);
  });

  it("prefers the centre of an empty board over a corner", () => {
    const ai = createAi("hard");
    const density = densityMap(ai);
    expect(density.get(coordKey({ row: 4, col: 4 }))!).toBeGreaterThan(
      density.get(coordKey({ row: 0, col: 0 }))!,
    );
  });
});
