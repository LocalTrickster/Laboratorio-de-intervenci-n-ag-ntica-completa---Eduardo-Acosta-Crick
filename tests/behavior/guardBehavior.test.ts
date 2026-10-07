import { describe, expect, it } from "vitest";
import { decideGuardBehavior, createGuardBehaviorState } from "../../src/domain/behavior/guardBehavior";
import { createSearchPattern } from "../../src/domain/behavior/searchPattern";
import { createGridMap, type GridPoint } from "../../src/domain/model/grid";

const MAP = createGridMap(10, 10, []);
const PATROLS: readonly GridPoint[] = [{ x: 1, y: 1 }, { x: 8, y: 8 }];
const BASE_INPUT = {
  map: MAP,
  patrolPoints: PATROLS,
  timeMs: 100,
  searchDurationMs: 2_000,
  searchRadiusInCells: 2,
  visiblePosition: null,
  heardPosition: null,
  lastKnownPosition: null,
  arrived: false,
  routeFailed: false,
};

describe("guard behavior", () => {
  it("cycles patrol points on arrival and emits observable same-state transitions", () => {
    const state = createGuardBehaviorState(PATROLS, MAP);
    const decision = decideGuardBehavior(state, { ...BASE_INPUT, arrived: true });

    expect(decision.state.mode).toBe("patrolling");
    expect(decision.state.patrolIndex).toBe(1);
    expect(decision.state.target).toEqual(PATROLS[1]);
    expect(decision.transitions[0]).toMatchObject({
      from: "patrolling",
      to: "patrolling",
      event: "patrol-waypoint-reached",
    });
  });

  it("gives valid vision priority over a simultaneous sound", () => {
    const state = createGuardBehaviorState(PATROLS, MAP);
    const decision = decideGuardBehavior(state, {
      ...BASE_INPUT,
      visiblePosition: { x: 4, y: 4 },
      heardPosition: { x: 5, y: 5 },
    });

    expect(decision.state.mode).toBe("pursuing");
    expect(decision.state.target).toEqual({ x: 4, y: 4 });
    expect(decision.transitions[0]?.event).toBe("visual-contact");
  });

  it("investigates only a validated sound position", () => {
    const state = createGuardBehaviorState(PATROLS, MAP);
    const decision = decideGuardBehavior(state, {
      ...BASE_INPUT,
      heardPosition: { x: 6, y: 5 },
    });

    expect(decision.state.mode).toBe("investigating");
    expect(decision.state.target).toEqual({ x: 6, y: 5 });
    expect(decision.transitions[0]?.event).toBe("sound-heard");
  });

  it("starts a bounded search after investigating the last known position", () => {
    const state = createGuardBehaviorState(PATROLS, MAP);
    const investigation = decideGuardBehavior(state, {
      ...BASE_INPUT,
      heardPosition: { x: 5, y: 5 },
    }).state;
    const searching = decideGuardBehavior(investigation, {
      ...BASE_INPUT,
      timeMs: 700,
      arrived: true,
    });

    expect(searching.state.mode).toBe("searching");
    expect(searching.state.searchDeadlineMs).toBe(2_700);
    expect(searching.state.target).not.toEqual({ x: 5, y: 5 });
    expect(searching.transitions[0]?.event).toBe("investigation-arrived");
  });

  it("goes to the last seen position before starting the search timer", () => {
    const pursuing = decideGuardBehavior(
      createGuardBehaviorState(PATROLS, MAP),
      { ...BASE_INPUT, visiblePosition: { x: 4, y: 5 } },
    ).state;
    const searching = decideGuardBehavior(pursuing, {
      ...BASE_INPUT,
      timeMs: 500,
      lastKnownPosition: { x: 4, y: 5 },
    });

    expect(searching.state.mode).toBe("searching");
    expect(searching.state.target).toEqual({ x: 4, y: 5 });
    expect(searching.state.searchDeadlineMs).toBeNull();

    const arrived = decideGuardBehavior(searching.state, {
      ...BASE_INPUT,
      timeMs: 900,
      arrived: true,
    });
    expect(arrived.state.searchDeadlineMs).toBe(2_900);
  });

  it("returns when the search expires but accepts vision at the deadline first", () => {
    const searching = decideGuardBehavior(
      createGuardBehaviorState(PATROLS, MAP),
      { ...BASE_INPUT, heardPosition: { x: 4, y: 4 } },
    ).state;
    const activeSearch = decideGuardBehavior(searching, {
      ...BASE_INPUT,
      arrived: true,
    }).state;
    const expiry = activeSearch.searchDeadlineMs ?? 0;

    const visible = decideGuardBehavior(activeSearch, {
      ...BASE_INPUT,
      timeMs: expiry,
      visiblePosition: { x: 7, y: 7 },
    });
    expect(visible.state.mode).toBe("pursuing");

    const expired = decideGuardBehavior(activeSearch, {
      ...BASE_INPUT,
      timeMs: expiry,
    });
    expect(expired.state.mode).toBe("returning");
    expect(expired.transitions[0]?.event).toBe("search-expired");
  });

  it("resumes the patrol cycle at the waypoint after the reached return point", () => {
    let returning = decideGuardBehavior(
      createGuardBehaviorState(PATROLS, MAP),
      { ...BASE_INPUT, heardPosition: { x: 4, y: 4 } },
    ).state;
    returning = decideGuardBehavior(returning, {
      ...BASE_INPUT,
      routeFailed: true,
    }).state;

    const resumed = decideGuardBehavior(returning, {
      ...BASE_INPUT,
      arrived: true,
    });
    expect(resumed.state.mode).toBe("patrolling");
    expect(resumed.state.patrolIndex).toBe(1);
    expect(resumed.state.target).toEqual(PATROLS[1]);
    expect(resumed.transitions[0]?.event).toBe("patrol-point-reached");
  });

  it("tries another patrol destination and reports when all return points fail", () => {
    let state = createGuardBehaviorState(PATROLS, MAP);
    state = decideGuardBehavior(state, {
      ...BASE_INPUT,
      heardPosition: { x: 4, y: 4 },
    }).state;
    state = decideGuardBehavior(state, {
      ...BASE_INPUT,
      routeFailed: true,
    }).state;
    expect(state.mode).toBe("returning");
    expect(state.target).toEqual(PATROLS[0]);

    state = decideGuardBehavior(state, {
      ...BASE_INPUT,
      routeFailed: true,
    }).state;
    expect(state.mode).toBe("returning");
    expect(state.target).toEqual(PATROLS[1]);

    const noRoute = decideGuardBehavior(state, { ...BASE_INPUT, routeFailed: true });
    expect(noRoute.state.mode).toBe("returning");
    expect(noRoute.state.target).toBeNull();
    expect(noRoute.transitions[0]?.event).toBe("no-reachable-patrol-point");
  });

  it("builds deterministic, walkable local search candidates", () => {
    const map = createGridMap(5, 5, [{ x: 2, y: 1 }]);
    const candidates = createSearchPattern(map, { x: 2, y: 2 }, 1);

    expect(candidates).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
    ]);
  });

  it("rejects missing patrol points and invalid search parameters", () => {
    expect(() => createGuardBehaviorState([], MAP)).toThrow("At least one patrol point");
    const state = createGuardBehaviorState(PATROLS, MAP);
    expect(() => decideGuardBehavior(state, { ...BASE_INPUT, searchDurationMs: 0 })).toThrow(
      "search duration",
    );
  });
});
