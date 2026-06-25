"use client";

import { getGuidance, type GuidanceContext } from "@/lib/game-guidance";
import { useTutorial } from "./tutorial-provider";
import { useSessionGuidance } from "./session-guidance-scope";
import { TutorialToggle } from "./tutorial-toggle";
import { GuidancePanel } from "./guidance-panel";

/** Contextual tips + global tutorial toggle for a screen. */
export function GameGuidance({ context }: { context: GuidanceContext }) {
  const { enabled } = useTutorial();
  const { guidanceEnabled } = useSessionGuidance();
  const content = getGuidance(context);
  const showGuidance = guidanceEnabled && enabled;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <TutorialToggle />
      </div>
      {showGuidance ? <GuidancePanel content={content} /> : null}
    </div>
  );
}
