"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "pcg-tutorial-enabled";

export function readTutorialEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === "1";
}

export function writeTutorialEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
}

/** Persists tutorial/guidance preference in localStorage (default: on). */
export function useTutorialMode() {
  const [enabled, setEnabledState] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEnabledState(readTutorialEnabled());
    setHydrated(true);
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    writeTutorialEnabled(value);
  }, []);

  const toggle = useCallback(() => {
    setEnabled(!enabled);
  }, [enabled, setEnabled]);

  return {
    enabled: hydrated ? enabled : true,
    setEnabled,
    toggle,
    hydrated,
  };
}
