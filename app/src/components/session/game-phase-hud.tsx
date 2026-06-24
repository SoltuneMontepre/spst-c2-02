"use client";

"use client";

import { useTutorial } from "@/components/learning/tutorial-provider";
import { PhaseBanner } from "@/components/session/phase-banner";
import { PhaseReadyButton } from "@/components/session/phase-ready-button";
import type { SessionSnapshot } from "@/lib/session-service";

/** Shared phase HUD: timer, AI narration, TFT-style phase-ready. */
export function GamePhaseHud({
  sessionId,
  data,
}: {
  sessionId: string;
  data: Pick<
    SessionSnapshot,
    | "currentRound"
    | "phase"
    | "phaseEndsAt"
    | "paused"
    | "aiNarration"
    | "autoHost"
    | "participants"
    | "status"
  >;
}) {
  const { enabled: tutorialOn } = useTutorial();
  const self = data.participants.find((p) => p.isSelf);
  const showReady =
    data.autoHost &&
    data.status !== "LOBBY" &&
    data.phase !== "SETTLEMENT" &&
    !!self &&
    !self.isBot;

  return (
    <>
      <PhaseBanner
        round={data.currentRound}
        phase={data.phase}
        phaseEndsAt={data.phaseEndsAt}
        paused={data.paused}
        aiNarration={data.aiNarration}
        autoHost={data.autoHost}
      />
      {showReady ? (
        <div className="flex flex-col gap-1">
          <PhaseReadyButton
            sessionId={sessionId}
            phaseReady={self.phaseReady}
            autoHost={data.autoHost}
            disabled={data.paused}
          />
          {tutorialOn ? (
            <p className="text-center text-xs text-muted-foreground">
              Khi cả nhóm xong việc, mọi người bấm sẵn sàng để chuyển giai đoạn sớm.
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
