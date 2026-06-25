"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useTutorial } from "./tutorial-provider";

type SessionGuidanceValue = {
  guidanceEnabled: boolean;
};

const SessionGuidanceContext = createContext<SessionGuidanceValue | null>(null);

export function SessionGuidanceScope({
  guidanceEnabled,
  children,
}: {
  guidanceEnabled: boolean;
  children: ReactNode;
}) {
  const parent = useTutorial();

  useEffect(() => {
    if (!guidanceEnabled) parent.setEnabled(false);
  }, [guidanceEnabled, parent.setEnabled]);

  const value = useMemo(() => ({ guidanceEnabled }), [guidanceEnabled]);

  return (
    <SessionGuidanceContext.Provider value={value}>
      {children}
    </SessionGuidanceContext.Provider>
  );
}

/** Whether in-session guidance toggle should be shown and user preference applies. */
export function useSessionGuidance(): SessionGuidanceValue {
  const ctx = useContext(SessionGuidanceContext);
  return ctx ?? { guidanceEnabled: true };
}
