import { describe, expect, it } from "vitest";
import { activateNearestSoundDistractor } from "../../src/application/simulation/soundDistractor";

const POINTS = [{ x: 10, y: 10 }, { x: 100, y: 10 }];

describe("sound distractor interaction", () => {
  it("activates the nearest distractor and emits sound from its position", () => {
    const activation = activateNearestSoundDistractor(
      { x: 12, y: 10 },
      POINTS,
      500,
      5,
      190,
      800,
    );

    expect(activation.result).toEqual({
      activated: true,
      position: POINTS[0],
      distance: 2,
    });
    expect(activation.event).toEqual({
      position: POINTS[0],
      radius: 190,
      emittedAtMs: 500,
      durationMs: 800,
    });
  });

  it("does not create an event outside interaction range or without devices", () => {
    expect(activateNearestSoundDistractor(
      { x: 20, y: 10 },
      POINTS,
      500,
      5,
      190,
      800,
    ).event).toBeNull();
    expect(activateNearestSoundDistractor(
      { x: 20, y: 10 },
      [],
      500,
      5,
      190,
      800,
    ).result.activated).toBe(false);
  });
});
