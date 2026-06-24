"use client";

import { CircleHelp } from "lucide-react";
import { useTutorial } from "./tutorial-provider";

/** Inline hint shown next to a label when tutorial mode is on. */
export function HelpHint({ text }: { text: string }) {
  const { enabled } = useTutorial();
  if (!enabled) return null;

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
