"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useTutorialMode } from "@/hooks/use-tutorial-mode";

type TutorialContextValue = ReturnType<typeof useTutorialMode>;

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const value = useTutorialMode();
  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used within TutorialProvider");
  return ctx;
}
