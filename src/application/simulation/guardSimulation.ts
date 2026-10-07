import {
  cellCenter,
  isWalkable,
  worldToCell,
  type GridMap,
  type GridPoint,
} from "../../domain/model/grid";
import { advanceAlongPath } from "../../domain/navigation/pathFollower";
import {
  findPathAStar,
  findPathBfs,
  type SearchAlgorithm,
  type SearchResult,
  type SearchStatus,
} from "../../domain/navigation/search";
import type { Vector2 } from "../../domain/model/vector";
import {
  createGuardBehaviorState,
  decideGuardBehavior,
  type GuardBehaviorState,
} from "../../domain/behavior/guardBehavior";
import type { GuardTransition } from "../../domain/telemetry/guardTelemetry";

const MAX_RECORDED_TRANSITIONS = 100;

export interface GuardSimulationState {
  readonly behavior: GuardBehaviorState;
  readonly position: Vector2;
  readonly facing: Vector2;
  readonly route: readonly Vector2[];
  readonly nextWaypoint: number;
  readonly routeTarget: GridPoint | null;
  readonly routeFailed: boolean;
  readonly routeResult: SearchResult | null;
  readonly transitions: readonly GuardTransition[];
}

export interface GuardSimulationInput {
  readonly map: GridMap;
  readonly tileSize: number;
  readonly patrolPoints: readonly GridPoint[];
  readonly timeMs: number;
  readonly deltaMs: number;
  readonly speed: number;
  readonly algorithm: SearchAlgorithm;
  readonly searchDurationMs: number;
  readonly searchRadiusInCells: number;
  readonly visiblePosition: GridPoint | null;
  readonly heardPosition: GridPoint | null;
  readonly lastKnownPosition: Vector2 | null;
}

export function initialGuardSimulation(
  map: GridMap,
  tileSize: number,
  guardStart: GridPoint,
  patrolPoints: readonly GridPoint[],
  timeMs = 0,
): GuardSimulationState {
  if (!isWalkable(map, guardStart)) {
    throw new Error("Guard start must be on a walkable cell.");
  }
  if (!Number.isFinite(timeMs)) {
    throw new Error("Guard initialization time must be finite.");
  }

  const behavior = createGuardBehaviorState(patrolPoints, map);
  const start = worldToCell(cellCenter(guardStart, tileSize), tileSize);
  const routeResult = findPathAStar(map, start, behavior.target ?? guardStart);
  const transition: GuardTransition = {
    atMs: timeMs,
    from: null,
    to: behavior.mode,
    event: "guard-initialized",
    reason: "El guardia comienza el ciclo de patrulla.",
    target: behavior.target,
  };

  return {
    behavior,
    position: cellCenter(guardStart, tileSize),
    facing: { x: -1, y: 0 },
    route: routeResult.status === "success"
      ? routeResult.path.map((point) => cellCenter(point, tileSize))
      : [],
    nextWaypoint: 0,
    routeTarget: behavior.target,
    routeFailed: routeResult.status !== "success",
    routeResult,
    transitions: [transition],
  };
}

export function advanceGuardSimulation(
  state: GuardSimulationState,
  input: GuardSimulationInput,
): GuardSimulationState {
  validateInput(input);
  const currentCell = worldToCell(state.position, input.tileSize);
  const lastKnownPosition = input.lastKnownPosition
    ? worldToCell(input.lastKnownPosition, input.tileSize)
    : null;
  const arrived = state.routeTarget !== null
    && !state.routeFailed
    && state.nextWaypoint >= state.route.length;
  const decision = decideGuardBehavior(state.behavior, {
    map: input.map,
    patrolPoints: input.patrolPoints,
    timeMs: input.timeMs,
    searchDurationMs: input.searchDurationMs,
    searchRadiusInCells: input.searchRadiusInCells,
    visiblePosition: input.visiblePosition,
    heardPosition: input.heardPosition,
    lastKnownPosition,
    arrived,
    routeFailed: state.routeFailed,
  });

  const targetChanged = !samePoint(state.routeTarget, decision.state.target);
  const algorithmChanged = state.routeResult !== null
    && state.routeResult.algorithm !== input.algorithm;
  const mustReplan = targetChanged || algorithmChanged;
  let route = state.route;
  let nextWaypoint = state.nextWaypoint;
  let routeTarget = state.routeTarget;
  let routeFailed = state.routeFailed;
  let routeResult = state.routeResult;

  if (mustReplan) {
    routeTarget = decision.state.target;
    nextWaypoint = 0;
    if (routeTarget) {
      routeResult = input.algorithm === "astar"
        ? findPathAStar(input.map, currentCell, routeTarget)
        : findPathBfs(input.map, currentCell, routeTarget);
      routeFailed = routeResult.status !== "success";
      route = routeFailed
        ? []
        : routeResult.path.map((point) => cellCenter(point, input.tileSize));
    } else {
      route = [];
      routeFailed = false;
      routeResult = null;
    }
  }

  const movement = advanceAlongPath(
    state.position,
    route,
    nextWaypoint,
    input.speed * input.deltaMs / 1000,
  );
  const transitions = decision.transitions.length > 0
    ? [...state.transitions, ...decision.transitions].slice(-MAX_RECORDED_TRANSITIONS)
    : state.transitions;

  return {
    behavior: decision.state,
    position: movement.position,
    facing: movement.direction ?? state.facing,
    route,
    nextWaypoint: movement.nextWaypoint,
    routeTarget,
    routeFailed,
    routeResult,
    transitions,
  };
}

export function guardNavigationStatus(state: GuardSimulationState): SearchStatus | "idle" {
  if (!state.behavior.target) {
    return "idle";
  }
  return state.routeResult?.status ?? "unreachable";
}

function validateInput(input: GuardSimulationInput): void {
  if (
    !Number.isFinite(input.timeMs)
    || !Number.isFinite(input.deltaMs)
    || input.deltaMs < 0
    || !Number.isFinite(input.speed)
    || input.speed < 0
    || !Number.isFinite(input.searchDurationMs)
    || input.searchDurationMs <= 0
    || !Number.isInteger(input.searchRadiusInCells)
    || input.searchRadiusInCells < 1
  ) {
    throw new Error("Guard simulation timing, movement, and search configuration must be valid.");
  }
}

function samePoint(left: GridPoint | null, right: GridPoint | null): boolean {
  return left !== null && right !== null && left.x === right.x && left.y === right.y;
}
