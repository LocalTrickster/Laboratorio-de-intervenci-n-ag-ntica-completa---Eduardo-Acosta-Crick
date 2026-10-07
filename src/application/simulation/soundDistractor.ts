import { distanceBetween, type Vector2 } from "../../domain/model/vector";
import type { SoundEvent } from "../../domain/perception/perception";

export interface SoundDistractorActivation {
  readonly activated: boolean;
  readonly position: Vector2 | null;
  readonly distance: number | null;
}

export function activateNearestSoundDistractor(
  playerPosition: Vector2,
  distractorPositions: readonly Vector2[],
  timeMs: number,
  interactionRange: number,
  soundRadius: number,
  durationMs: number,
): { readonly result: SoundDistractorActivation; readonly event: SoundEvent | null } {
  if (
    !Number.isFinite(timeMs)
    || !Number.isFinite(interactionRange)
    || interactionRange < 0
    || !Number.isFinite(soundRadius)
    || soundRadius < 0
    || !Number.isFinite(durationMs)
    || durationMs < 0
  ) {
    throw new Error("Sound distractor configuration must be finite and non-negative.");
  }

  let nearest: Vector2 | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const position of distractorPositions) {
    const distance = distanceBetween(playerPosition, position);
    if (distance < nearestDistance) {
      nearest = position;
      nearestDistance = distance;
    }
  }

  if (!nearest || nearestDistance > interactionRange) {
    return {
      result: { activated: false, position: null, distance: Number.isFinite(nearestDistance) ? nearestDistance : null },
      event: null,
    };
  }

  const position = { ...nearest };
  return {
    result: { activated: true, position, distance: nearestDistance },
    event: {
      position,
      radius: soundRadius,
      emittedAtMs: timeMs,
      durationMs,
    },
  };
}
