import type { GuardMode } from "../../domain/behavior/guardBehavior";
import type { VisionReason } from "../../domain/perception/perception";

export const VISION_COLORS: Readonly<Record<VisionReason, number>> = {
  visible: 0x73c991,
  "out-of-range": 0x71828d,
  "outside-cone": 0x6b8afd,
  occluded: 0xe16969,
  "invalid-facing": 0xffa44c,
  concealed: 0xb06ded,
};

export const GUARD_STATE_COLORS: Readonly<Record<GuardMode, number>> = {
  patrolling: 0x6b8afd,
  investigating: 0xe5b454,
  pursuing: 0xe16969,
  searching: 0xb06ded,
  returning: 0x73c991,
};
