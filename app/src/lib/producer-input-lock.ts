import { PHASE_DURATIONS_SEC, PRODUCER_INPUT_LOCK_SEC } from "./scenario";

/** Unix ms when the producer input lock ends (first 15s of DECISION), or null. */
export function producerInputLockEndsAtMs(
  phase: string | null,
  phaseEndsAt: Date | string | null,
): number | null {
  if (phase !== "DECISION" || !phaseEndsAt) return null;
  const end =
    typeof phaseEndsAt === "string"
      ? new Date(phaseEndsAt).getTime()
      : phaseEndsAt.getTime();
  const phaseStart = end - PHASE_DURATIONS_SEC.DECISION * 1000;
  return phaseStart + PRODUCER_INPUT_LOCK_SEC * 1000;
}

export function isProducerInputLockedAt(params: {
  phase: string | null;
  phaseEndsAt: Date | string | null;
  paused?: boolean;
  isBot?: boolean;
  now?: number;
}): boolean {
  if (params.isBot || params.paused) return false;
  const lockEnds = producerInputLockEndsAtMs(params.phase, params.phaseEndsAt);
  if (lockEnds == null) return false;
  return (params.now ?? Date.now()) < lockEnds;
}

export function producerInputLockRemainingSec(params: {
  phase: string | null;
  phaseEndsAt: Date | string | null;
  paused?: boolean;
  now?: number;
}): number | null {
  if (params.paused) return null;
  const lockEnds = producerInputLockEndsAtMs(params.phase, params.phaseEndsAt);
  if (lockEnds == null) return null;
  const sec = Math.ceil((lockEnds - (params.now ?? Date.now())) / 1000);
  return Math.max(0, sec);
}
