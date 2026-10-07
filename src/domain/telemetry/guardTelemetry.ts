import type { GuardMode } from "../behavior/guardBehavior";
import type { GridPoint } from "../model/grid";

export interface GuardTransition {
  readonly atMs: number;
  readonly from: GuardMode | null;
  readonly to: GuardMode;
  readonly event: string;
  readonly reason: string;
  readonly target: GridPoint | null;
}
