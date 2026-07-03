// Immutable scenario constants for the default simple scenario.
// These live in config, never hard-coded across the client; host/users cannot edit.

import type { ProductivityProfile, EventType } from "@/generated/prisma/enums";
import type { Role } from "@/generated/prisma/enums";

export const SCENARIO_VERSION = "dragon-fruit-simple-v1";

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
  /** VAT-style cut on every retail/wholesale sale, routed to the government wallet. */
  salesTaxRate: 0.1,
  needFulfillmentUtilityVnd: 20000,
  consumerBaseNeedUnits: 2, // base need target per consumer per round
} as const;

/** Per-profile production model. Labor fields remain for SRS explanations/legacy sessions. */
export const PRODUCTIVITY_PROFILES: Record<
  ProductivityProfile,
  { individualLaborTime: number; productionCapacity: number; label: string }
> = {
  TRADITIONAL: { individualLaborTime: 4, productionCapacity: 2, label: "Thủ công" },
  SOCIAL_AVERAGE: { individualLaborTime: 2, productionCapacity: 4, label: "Cơ bản" },
  PIONEER: { individualLaborTime: 1, productionCapacity: 6, label: "Hiện đại" },
};

/** Profile assignment order by producer count (SRS §3.3). */
export const PROFILE_ASSIGNMENT: Record<number, ProductivityProfile[]> = {
  2: ["TRADITIONAL", "PIONEER"],
  3: ["TRADITIONAL", "SOCIAL_AVERAGE", "PIONEER"],
  4: ["TRADITIONAL", "SOCIAL_AVERAGE", "SOCIAL_AVERAGE", "PIONEER"],
  5: [
    "TRADITIONAL",
    "SOCIAL_AVERAGE",
    "SOCIAL_AVERAGE",
    "PIONEER",
    "PIONEER",
  ],
  6: [
    "TRADITIONAL",
    "TRADITIONAL",
    "SOCIAL_AVERAGE",
    "SOCIAL_AVERAGE",
    "PIONEER",
    "PIONEER",
  ],
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
  11: { producer: 4, consumer: 5, intermediary: 1, government: 1 },
  12: { producer: 5, consumer: 5, intermediary: 1, government: 1 },
  13: { producer: 5, consumer: 5, intermediary: 2, government: 1 },
  14: { producer: 5, consumer: 6, intermediary: 2, government: 1 },
  15: { producer: 6, consumer: 6, intermediary: 2, government: 1 },
  16: { producer: 6, consumer: 7, intermediary: 2, government: 1 },
};

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 16;
/** Minimum humans to start (SRS FR-HOST-01). Bots fill remaining slots. */
export const START_MIN_HUMANS = MIN_PLAYERS;

/** Room code expires after 24h if not started, or 24h after completion (FR-ROOM-08). */
export const ROOM_CODE_EXPIRY_HOURS = 24;

/** Max concurrent hosted sessions (LOBBY through DEBRIEF) per user. */
export const MAX_ACTIVE_HOST_ROOMS = 2;

/** Solo host lobby (no other humans) auto-cancel after this duration. */
export const SOLO_LOBBY_CANCEL_MS = 60_000;

/** Target role counts for a session with `playerCount` seats (SRS §3.2). */
export function compositionTarget(playerCount: number): Record<Role, number> {
  const slots = compositionSlots(playerCount);
  return slots.reduce(
    (acc, role) => {
      acc[role]++;
      return acc;
    },
    { PRODUCER: 0, CONSUMER: 0, INTERMEDIARY: 0, GOVERNMENT: 0 } as Record<Role, number>,
  );
}

/** Ordered full role slots for a session (producers, consumers, intermediaries, government). */
export function compositionSlots(playerCount: number): Role[] {
  const targetCount = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, playerCount));
  const dist =
    targetCount >= MIN_PLAYERS && targetCount <= MAX_PLAYERS
      ? ROLE_DISTRIBUTION[targetCount]
      : { producer: 2, consumer: 2, intermediary: 0, government: 0 };
  return [
    ...Array<Role>(dist.producer).fill("PRODUCER"),
    ...Array<Role>(dist.consumer).fill("CONSUMER"),
    ...Array<Role>(dist.intermediary).fill("INTERMEDIARY"),
    ...Array<Role>(dist.government).fill("GOVERNMENT"),
  ];
}

/** Tech upgrade costs (SRS §5.4). */
export const UPGRADE_COSTS = {
  TRADITIONAL_TO_SOCIAL_AVERAGE: 12000,
  SOCIAL_AVERAGE_TO_PIONEER: 16000,
} as const;

/** Phase durations in seconds (SRS §4.2, §4.3). */
export const PHASE_DURATIONS_SEC = {
  EVENT: 22,
  DECISION: 180,
  MARKET_OPEN: 300,
  SETTLEMENT: 0, // server-driven, no fixed timer
  RECAP: 30, // minimum before host may advance
} as const;

/** AI-host timed intro / debrief (no manual host needed). */
export const INTRO_DURATION_SEC = 5;
export const DEBRIEF_DURATION_SEC = 45;

export const PHASE_EXTENSION_SEC = 30;
export const MAX_PHASE_EXTENSIONS = 2;
export const PRODUCER_INPUT_LOCK_SEC = 15; // DECISION lock for state policies
/** Client heartbeat interval (must stay under PRESENCE_STALE_SEC). */
export const HEARTBEAT_INTERVAL_SEC = 5;
/** No heartbeat for this long ⇒ treat as offline (derived from lastSeenAt). */
export const PRESENCE_STALE_SEC = 15;
/** Offline this long ⇒ bot takeover of the seat. */
export const DISCONNECT_BOT_TAKEOVER_SEC = 20;
export const HOST_RECONNECT_WINDOW_SEC = 120;
/** Extra silence after stale before we stop waiting on them for "everyone ready". */
export const DISCONNECT_READY_GRACE_SEC = 5;
/** When every connected human is phase-ready, advance after this short countdown. */
export const ALL_READY_COUNTDOWN_SEC = 5;

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
