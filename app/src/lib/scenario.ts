// Immutable scenario constants for dragon-fruit-v1 (SRS §5.1, §5.3, §5.7, §5.10).
// These live in config, never hard-coded across the client; host/users cannot edit.

import type { ProductivityProfile, EventType } from "@/generated/prisma/enums";
import type { Role } from "@/generated/prisma/enums";

export const SCENARIO_VERSION = "dragon-fruit-v1";

export const SCENARIO = {
  version: SCENARIO_VERSION,
  inputTransferredValueVnd: 2000,
  laborValueRateVnd: 4000, // per unit of labor time
  socialLaborTimeRounds123: 2,
  socialLaborTimeRound4: 1,
  unitValueRounds123Vnd: 10000,
  unitValueRound4Vnd: 6000,
  producerStartingCapitalVnd: 50000,
  consumerSubsidyPerRoundVnd: 20000,
  intermediaryStartingCapitalVnd: 60000,
  stateStartingBudgetVnd: 40000,
  producerLaborPoints: 8,
  roundProductionCap: 4,
  needFulfillmentUtilityVnd: 20000,
  consumerBaseNeedUnits: 2, // base need target per consumer per round
} as const;

/** Per-profile individual labor time and capacity (SRS §5.3). */
export const PRODUCTIVITY_PROFILES: Record<
  ProductivityProfile,
  { individualLaborTime: number; label: string }
> = {
  TRADITIONAL: { individualLaborTime: 4, label: "Truyền thống" },
  SOCIAL_AVERAGE: { individualLaborTime: 2, label: "Trung bình xã hội" },
  PIONEER: { individualLaborTime: 1, label: "Tiên phong" },
};

/** Profile assignment order by producer count (SRS §3.3). */
export const PROFILE_ASSIGNMENT: Record<number, ProductivityProfile[]> = {
  2: ["TRADITIONAL", "PIONEER"],
  3: ["TRADITIONAL", "SOCIAL_AVERAGE", "PIONEER"],
  4: ["TRADITIONAL", "SOCIAL_AVERAGE", "SOCIAL_AVERAGE", "PIONEER"],
};

/** Role distribution by player count (SRS §3.2). null => bot fills the role. */
export const ROLE_DISTRIBUTION: Record<
  number,
  { producer: number; consumer: number; intermediary: number; government: number }
> = {
  4: { producer: 2, consumer: 2, intermediary: 0, government: 0 },
  5: { producer: 2, consumer: 2, intermediary: 1, government: 0 },
  6: { producer: 2, consumer: 2, intermediary: 1, government: 1 },
  7: { producer: 3, consumer: 2, intermediary: 1, government: 1 },
  8: { producer: 3, consumer: 3, intermediary: 1, government: 1 },
  9: { producer: 4, consumer: 3, intermediary: 1, government: 1 },
  10: { producer: 4, consumer: 4, intermediary: 1, government: 1 },
};

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 10;
/** Minimum humans to start (SRS FR-HOST-01). Bots fill remaining slots. */
export const START_MIN_HUMANS = MIN_PLAYERS;

/** Room code expires after 24h if not started, or 24h after completion (FR-ROOM-08). */
export const ROOM_CODE_EXPIRY_HOURS = 24;

/** Target role counts for a session with `humanCount` humans (SRS §3.2). */
export function compositionTarget(humanCount: number): Record<Role, number> {
  const slots = compositionSlots(humanCount);
  return slots.reduce(
    (acc, role) => {
      acc[role]++;
      return acc;
    },
    { PRODUCER: 0, CONSUMER: 0, INTERMEDIARY: 0, GOVERNMENT: 0 } as Record<Role, number>,
  );
}

/** Ordered full role slots for a session (producers, consumers, intermediary, government). */
export function compositionSlots(humanCount: number): Role[] {
  const dist =
    humanCount >= MIN_PLAYERS && humanCount <= 10
      ? ROLE_DISTRIBUTION[humanCount]
      : { producer: 2, consumer: 2 };
  return [
    ...Array<Role>(dist.producer).fill("PRODUCER"),
    ...Array<Role>(dist.consumer).fill("CONSUMER"),
    "INTERMEDIARY",
    "GOVERNMENT",
  ];
}

/** Tech upgrade costs (SRS §5.4). */
export const UPGRADE_COSTS = {
  TRADITIONAL_TO_SOCIAL_AVERAGE: 12000,
  SOCIAL_AVERAGE_TO_PIONEER: 16000,
} as const;

/** Phase durations in seconds (SRS §4.2, §4.3). */
export const PHASE_DURATIONS_SEC = {
  EVENT: 15,
  DECISION: 45,
  MARKET_OPEN: 60,
  SETTLEMENT: 0, // server-driven, no fixed timer
  RECAP: 30, // minimum before host may advance
} as const;

/** AI-host timed intro / debrief (no manual host needed). */
export const INTRO_DURATION_SEC = 20;
export const DEBRIEF_DURATION_SEC = 45;

export const PHASE_EXTENSION_SEC = 30;
export const MAX_PHASE_EXTENSIONS = 2;
export const PRODUCER_INPUT_LOCK_SEC = 15; // DECISION lock for state policies
export const DISCONNECT_BOT_TAKEOVER_SEC = 15;
export const HOST_RECONNECT_WINDOW_SEC = 120;

/** Round event types in fixed order (SRS §5.7, BR-ROUND-01). */
export const ROUND_EVENTS: Record<number, EventType> = {
  1: "BASELINE",
  2: "BUMPER_HARVEST",
  3: "VIRAL",
  4: "TECH_DIFFUSION",
};

/** Policy definitions (SRS §5.10). */
export const POLICIES = {
  INFO_DISCLOSURE: { fixedCostVnd: 3000 },
  COLD_STORAGE: { perUnitCostVnd: 2000, maxUnits: 3 },
  EXPORT_PROMOTION: { fixedCostVnd: 4000, demandShare: 0.25 },
  TECH_SUPPORT: { fixedCostVnd: 8000, discountRate: 0.5 },
} as const;

export type ScenarioConfig = typeof SCENARIO;
