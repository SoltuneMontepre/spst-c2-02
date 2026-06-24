"use client";

import { useEffect, useState } from "react";

/** Seconds remaining until an ISO deadline; null when no deadline/paused. */
export function useCountdown(endsAtIso: string | null, paused: boolean): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAtIso || paused) return;
    const tick = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(tick);
  }, [endsAtIso, paused]);

  if (!endsAtIso || paused) return null;
  return Math.max(0, Math.ceil((new Date(endsAtIso).getTime() - now) / 1000));
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
