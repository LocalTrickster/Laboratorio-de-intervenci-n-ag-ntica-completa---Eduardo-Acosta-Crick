import {
  cellKey,
  isWalkable,
  type GridMap,
  type GridPoint,
} from "../model/grid";
import type { GuardTransition } from "../telemetry/guardTelemetry";
import { createSearchPattern } from "./searchPattern";

export type GuardMode = "patrolling" | "investigating" | "pursuing" | "searching" | "returning";

export interface GuardBehaviorState {
  readonly mode: GuardMode;
  readonly patrolIndex: number;
  readonly target: GridPoint | null;
  readonly searchAnchor: GridPoint | null;
  readonly searchCandidates: readonly GridPoint[];
  readonly searchCandidateIndex: number;
  readonly searchDeadlineMs: number | null;
  readonly attemptedPatrolIndices: readonly number[];
  readonly patrolPauseUntilMs: number | null;
}

export interface GuardBehaviorInput {
  readonly map: GridMap;
  readonly patrolPoints: readonly GridPoint[];
  readonly timeMs: number;
  readonly searchDurationMs: number;
  readonly searchRadiusInCells: number;
  readonly patrolPauseDurationMs: number;
  readonly visiblePosition: GridPoint | null;
  readonly heardPosition: GridPoint | null;
  readonly lastKnownPosition: GridPoint | null;
  readonly arrived: boolean;
  readonly routeFailed: boolean;
}

export interface GuardBehaviorDecision {
  readonly state: GuardBehaviorState;
  readonly transitions: readonly GuardTransition[];
}

export function createGuardBehaviorState(
  patrolPoints: readonly GridPoint[],
  map: GridMap,
): GuardBehaviorState {
  if (patrolPoints.length === 0) {
    throw new Error("At least one patrol point is required.");
  }
  patrolPoints.forEach((point) => {
    if (!isWalkable(map, point)) {
      throw new Error(`Patrol point is not walkable: ${cellKey(point)}.`);
    }
  });

  return {
    mode: "patrolling",
    patrolIndex: 0,
    target: patrolPoints[0] ?? null,
    searchAnchor: null,
    searchCandidates: [],
    searchCandidateIndex: -1,
    searchDeadlineMs: null,
    attemptedPatrolIndices: [],
    patrolPauseUntilMs: null,
  };
}

export function decideGuardBehavior(
  state: GuardBehaviorState,
  input: GuardBehaviorInput,
): GuardBehaviorDecision {
  assertInput(input);

  if (input.visiblePosition) {
    if (state.mode !== "pursuing" || !samePoint(state.target, input.visiblePosition)) {
      return changeState(
        state,
        {
          ...state,
          mode: "pursuing",
          target: input.visiblePosition,
          searchAnchor: null,
          searchCandidates: [],
          searchCandidateIndex: -1,
          searchDeadlineMs: null,
          attemptedPatrolIndices: [],
          patrolPauseUntilMs: null,
        },
        input,
        state.mode === "pursuing" ? "visual-target-updated" : "visual-contact",
        state.mode === "pursuing"
          ? "La percepción visual válida cambió el objetivo."
          : "La percepción visual válida tiene prioridad sobre otros estímulos.",
      );
    }
  } else if (state.mode === "pursuing") {
    if (!input.lastKnownPosition) {
      return beginReturn(state, input, "visual-contact-lost", "No hay posición conocida válida.");
    }
    return changeState(
      state,
      {
        ...state,
        mode: "searching",
        target: input.lastKnownPosition,
        searchAnchor: input.lastKnownPosition,
        searchCandidates: [],
        searchCandidateIndex: -1,
        searchDeadlineMs: null,
        attemptedPatrolIndices: [],
        patrolPauseUntilMs: null,
      },
      input,
      "visual-contact-lost",
      "Se navega a la última posición conocida antes de iniciar el plazo de búsqueda.",
    );
  }

  if (input.heardPosition && state.mode !== "pursuing") {
    if (state.mode === "searching") {
      if (!samePoint(state.searchAnchor, input.heardPosition)) {
        const candidates = createSearchPattern(input.map, input.heardPosition, input.searchRadiusInCells);
        const nextState = {
          ...state,
          target: state.searchDeadlineMs === null
            ? input.heardPosition
            : candidates[0] ?? input.heardPosition,
          searchAnchor: input.heardPosition,
          searchCandidates: candidates,
          searchCandidateIndex: candidates.length > 0 ? 0 : -1,
        };
        return changeState(
          state,
          nextState,
          input,
          "sound-reoriented-search",
          "Un sonido validado reorientó la búsqueda sin reiniciar su plazo.",
        );
      }
    } else if (
      state.mode !== "investigating"
      || !samePoint(state.target, input.heardPosition)
    ) {
      return changeState(
        state,
        {
          ...state,
          mode: "investigating",
          target: input.heardPosition,
          searchAnchor: null,
          searchCandidates: [],
          searchCandidateIndex: -1,
          searchDeadlineMs: null,
          patrolPauseUntilMs: null,
          attemptedPatrolIndices: [],
        },
        input,
        state.mode === "investigating" ? "sound-target-updated" : "sound-heard",
        "Se investiga únicamente la posición de un sonido validado.",
      );
    }
  }

  if (state.mode === "patrolling" && state.patrolPauseUntilMs !== null) {
    if (input.timeMs < state.patrolPauseUntilMs) {
      return { state, transitions: [] };
    }
    return changeState(
      state,
      { ...state, patrolPauseUntilMs: null },
      input,
      "patrol-pause-completed",
      "Terminó la pausa de patrulla y el guardia continúa hacia el siguiente punto.",
    );
  }

  if (input.routeFailed && state.target) {
    if (state.mode === "returning") {
      return tryNextReturnPoint(state, input);
    }
    return beginReturn(
      state,
      input,
      "route-failed",
      `No existe una ruta válida hacia ${cellKey(state.target)}.`,
      state.mode === "patrolling" ? [state.patrolIndex] : [],
    );
  }

  if (state.mode === "searching" && state.searchDeadlineMs !== null) {
    if (input.timeMs >= state.searchDeadlineMs) {
      return beginReturn(state, input, "search-expired", "Venció el plazo de búsqueda.");
    }
    if (input.arrived && state.searchCandidates.length > 1) {
      const index = (state.searchCandidateIndex + 1) % state.searchCandidates.length;
      return changeState(
        state,
        { ...state, target: state.searchCandidates[index] ?? state.searchAnchor, searchCandidateIndex: index },
        input,
        "search-waypoint-reached",
        "Se seleccionó el siguiente candidato de búsqueda.",
      );
    }
  }

  if (input.arrived) {
    switch (state.mode) {
      case "patrolling": {
        const index = (state.patrolIndex + 1) % input.patrolPoints.length;
        return changeState(
          state,
          {
            ...state,
            patrolIndex: index,
            target: input.patrolPoints[index] ?? null,
            patrolPauseUntilMs: input.timeMs + input.patrolPauseDurationMs,
          },
          input,
          "patrol-waypoint-reached",
          "Se alcanzó el punto y se seleccionó el siguiente del ciclo.",
        );
      }
      case "investigating": {
        const anchor = state.target;
        if (!anchor) {
          return beginReturn(state, input, "investigation-target-missing", "La investigación no tiene destino.");
        }
        const candidates = createSearchPattern(input.map, anchor, input.searchRadiusInCells);
        if (candidates.length === 0) {
          return beginReturn(state, input, "search-pattern-empty", "No hay candidatos transitables para buscar.");
        }
        const duration = input.searchDurationMs;
        return changeState(
          state,
          {
            ...state,
            mode: "searching",
            searchAnchor: anchor,
            searchCandidates: candidates,
            searchCandidateIndex: 0,
            searchDeadlineMs: input.timeMs + duration,
            target: candidates[0] ?? anchor,
            attemptedPatrolIndices: [],
          },
          input,
          "investigation-arrived",
          "Se alcanzó la posición investigada; comienza el plazo limitado de búsqueda.",
        );
      }
      case "searching": {
        if (state.searchDeadlineMs === null && state.searchAnchor) {
          const candidates = createSearchPattern(input.map, state.searchAnchor, input.searchRadiusInCells);
          if (candidates.length === 0) {
            return beginReturn(state, input, "search-pattern-empty", "No hay candidatos transitables para buscar.");
          }
          return changeState(
            state,
            {
              ...state,
              searchCandidates: candidates,
              searchCandidateIndex: 0,
              searchDeadlineMs: input.timeMs + input.searchDurationMs,
              target: candidates[0] ?? state.searchAnchor,
            },
            input,
            "search-started",
            "Se llegó a la última posición conocida y comienza el plazo de búsqueda.",
          );
        }
        break;
      }
      case "returning": {
        if (state.target) {
          const index = (state.patrolIndex + 1) % input.patrolPoints.length;
          return changeState(
            state,
            {
              ...state,
              mode: "patrolling",
              patrolIndex: index,
              target: input.patrolPoints[index] ?? null,
              attemptedPatrolIndices: [],
              patrolPauseUntilMs: null,
            },
            input,
            "patrol-point-reached",
            "Se alcanzó un punto de patrulla válido y se reanuda el ciclo.",
          );
        }
        break;
      }
      case "pursuing":
        break;
    }
  }

  return { state, transitions: [] };
}

function beginReturn(
  state: GuardBehaviorState,
  input: GuardBehaviorInput,
  event: string,
  reason: string,
  attempted: readonly number[] = [],
): GuardBehaviorDecision {
  const returning: GuardBehaviorState = {
    ...state,
    mode: "returning",
    target: null,
    searchAnchor: null,
    searchCandidates: [],
    searchCandidateIndex: -1,
    searchDeadlineMs: null,
    attemptedPatrolIndices: [...new Set([...state.attemptedPatrolIndices, ...attempted])],
    patrolPauseUntilMs: null,
  };
  return selectReturnPoint(state, returning, input, event, reason);
}

function tryNextReturnPoint(
  state: GuardBehaviorState,
  input: GuardBehaviorInput,
): GuardBehaviorDecision {
  const attempted = [...new Set([...state.attemptedPatrolIndices, state.patrolIndex])];
  const returning = { ...state, target: null, attemptedPatrolIndices: attempted };
  return selectReturnPoint(
    state,
    returning,
    input,
    "return-destination-unreachable",
    "El punto de retorno no es alcanzable; se prueba el siguiente punto válido.",
  );
}

function selectReturnPoint(
  previous: GuardBehaviorState,
  returning: GuardBehaviorState,
  input: GuardBehaviorInput,
  event: string,
  reason: string,
): GuardBehaviorDecision {
  for (let offset = 0; offset < input.patrolPoints.length; offset += 1) {
    const index = (returning.patrolIndex + offset) % input.patrolPoints.length;
    const candidate = input.patrolPoints[index];
    if (returning.attemptedPatrolIndices.includes(index) || !candidate) {
      continue;
    }
    return changeState(
      previous,
      { ...returning, patrolIndex: index, target: candidate },
      input,
      event,
      reason,
    );
  }

  return changeState(
    previous,
    { ...returning, target: null },
    input,
    "no-reachable-patrol-point",
    "No queda ningún punto de patrulla transitable para el retorno; la locomoción debe detenerse.",
  );
}

function changeState(
  previous: GuardBehaviorState,
  next: GuardBehaviorState,
  input: GuardBehaviorInput,
  event: string,
  reason: string,
): GuardBehaviorDecision {
  return {
    state: next,
    transitions: [{
      atMs: input.timeMs,
      from: previous.mode,
      to: next.mode,
      event,
      reason,
      target: next.target,
    }],
  };
}

function assertInput(input: GuardBehaviorInput): void {
  if (
    !Number.isFinite(input.timeMs)
    || !Number.isFinite(input.searchDurationMs)
    || input.searchDurationMs <= 0
    || !Number.isFinite(input.patrolPauseDurationMs)
    || input.patrolPauseDurationMs < 0
  ) {
    throw new Error("Guard behavior time and search duration must be finite and valid.");
  }
  if (input.patrolPoints.length === 0) {
    throw new Error("At least one patrol point is required.");
  }
  if (!Number.isInteger(input.searchRadiusInCells) || input.searchRadiusInCells < 1) {
    throw new Error("Search radius must be a positive integer.");
  }
}

function samePoint(left: GridPoint | null, right: GridPoint | null): boolean {
  return left !== null && right !== null && left.x === right.x && left.y === right.y;
}
