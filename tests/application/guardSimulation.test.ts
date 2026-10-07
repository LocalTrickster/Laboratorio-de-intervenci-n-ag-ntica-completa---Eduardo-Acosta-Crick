import { describe, expect, it } from "vitest";
import {
  advanceGuardSimulation,
  guardNavigationStatus,
  initialGuardSimulation,
} from "../../src/application/simulation/guardSimulation";
import { createGridMap, type GridPoint } from "../../src/domain/model/grid";
import {
  GUARD_PATROL_POINTS,
  GUARD_START,
  LAB_MAP,
  TILE_SIZE,
} from "../../src/application/simulation/labLevel";

const MAP = createGridMap(8, 8, []);
const PATROLS: readonly GridPoint[] = [{ x: 1, y: 1 }, { x: 6, y: 6 }];
const INPUT = {
  map: MAP,
  tileSize: 10,
  patrolPoints: PATROLS,
  timeMs: 100,
  deltaMs: 0,
  speed: 100,
  algorithm: "astar" as const,
  searchDurationMs: 1_000,
  searchRadiusInCells: 2,
  visiblePosition: null,
  heardPosition: null,
  lastKnownPosition: null,
};

describe("guard simulation", () => {
  it("initializes a walkable patrol route with initialization telemetry", () => {
    const state = initialGuardSimulation(MAP, 10, { x: 1, y: 1 }, PATROLS);

    expect(state.behavior.mode).toBe("patrolling");
    expect(state.routeFailed).toBe(false);
    expect(state.transitions[0]).toMatchObject({
      from: null,
      to: "patrolling",
      event: "guard-initialized",
    });

    expect(guardNavigationStatus(state)).toBe("success");
  });

  it("keeps every configured laboratory patrol point reachable", () => {
    const state = initialGuardSimulation(
      LAB_MAP,
      TILE_SIZE,
      GUARD_START,
      GUARD_PATROL_POINTS,
    );
    expect(state.routeFailed).toBe(false);

    for (const patrolPoint of GUARD_PATROL_POINTS) {
      const routeState = initialGuardSimulation(
        LAB_MAP,
        TILE_SIZE,
        GUARD_START,
        [patrolPoint],
      );
      expect(routeState.routeFailed).toBe(false);
      expect(routeState.routeTarget).toEqual(patrolPoint);
    }
  });

  it("keeps an unchanged goal route instead of recalculating every frame", () => {
    const initial = initialGuardSimulation(MAP, 10, { x: 2, y: 1 }, PATROLS);
    const first = advanceGuardSimulation(initial, { ...INPUT, deltaMs: 16 });
    const second = advanceGuardSimulation(first, { ...INPUT, timeMs: 116, deltaMs: 16 });

    expect(second.route).toBe(first.route);
  });

  it("changes from a valid visual chase to search using only remembered position", () => {
    const initial = initialGuardSimulation(MAP, 10, { x: 1, y: 1 }, PATROLS);
    const chasing = advanceGuardSimulation(initial, {
      ...INPUT,
      visiblePosition: { x: 4, y: 1 },
    });
    expect(chasing.behavior.mode).toBe("pursuing");

    const searching = advanceGuardSimulation(chasing, {
      ...INPUT,
      timeMs: 200,
      lastKnownPosition: { x: 45, y: 15 },
    });
    expect(searching.behavior.mode).toBe("searching");
    expect(searching.behavior.target).toEqual({ x: 4, y: 1 });
    expect(searching.behavior.searchDeadlineMs).toBeNull();
    expect(searching.transitions.at(-1)?.event).toBe("visual-contact-lost");
  });

  it("reports inaccessible objectives and stops without a false arrival", () => {
    const splitMap = createGridMap(5, 3, [
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ]);
    const remotePatrol: readonly GridPoint[] = [{ x: 4, y: 1 }];
    const initial = initialGuardSimulation(
      splitMap,
      10,
      { x: 0, y: 1 },
      remotePatrol,
    );
    expect(initial.routeFailed).toBe(true);

    const stopped = advanceGuardSimulation(initial, {
      ...INPUT,
      map: splitMap,
      patrolPoints: remotePatrol,
      visiblePosition: null,
    });

    expect(stopped.behavior.mode).toBe("returning");
    expect(stopped.behavior.target).toBeNull();
    expect(stopped.route.length).toBe(0);
    expect(stopped.transitions.at(-1)?.event).toBe("no-reachable-patrol-point");
    expect(guardNavigationStatus(stopped)).toBe("idle");
  });

  it("rejects invalid movement or timer configuration", () => {
    const initial = initialGuardSimulation(MAP, 10, { x: 1, y: 1 }, PATROLS);

    expect(() => advanceGuardSimulation(initial, { ...INPUT, speed: -1 })).toThrow(
      "simulation timing",
    );
  });
});
