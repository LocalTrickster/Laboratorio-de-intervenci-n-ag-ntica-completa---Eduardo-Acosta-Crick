import { describe, expect, it } from "vitest";
import { GUARD_STATE_COLORS, VISION_COLORS } from "../../src/game/presentation/guardPresentation";

describe("guard presentation mapping", () => {
  it("gives all behavior states distinct visual colors", () => {
    expect(new Set(Object.values(GUARD_STATE_COLORS)).size).toBe(5);
  });

  it("distinguishes every vision outcome including concealment", () => {
    expect(new Set(Object.values(VISION_COLORS)).size).toBe(6);
    expect(VISION_COLORS.concealed).not.toBe(VISION_COLORS.visible);
    expect(VISION_COLORS.occluded).not.toBe(VISION_COLORS.visible);
  });
});
