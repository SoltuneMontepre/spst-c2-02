"use client";

import { CircleHelp } from "lucide-react";
import { useTutorial } from "./tutorial-provider";
import { useSessionGuidance } from "./session-guidance-scope";

/** Inline hint shown next to a label when tutorial mode is on. */
export function HelpHint({ text }: { text: string }) {
  const { enabled } = useTutorial();
  const { guidanceEnabled } = useSessionGuidance();
  if (!guidanceEnabled || !enabled) return null;

  return (
    <span
      className="ml-1 inline-flex align-middle text-muted-foreground"
      title={text}
      aria-label={text}
    >
      <CircleHelp className="size-3.5" aria-hidden />
    </span>
  );
}
