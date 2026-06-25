"use client";

import { useEffect, useRef } from "react";
import type { SessionSnapshot } from "@/lib/session-service";
import { computeLobbyReadiness } from "@/lib/lobby-readiness";
import { getRoleTutorialContent } from "@/lib/role-tutorial";
import { LobbyRoleCard } from "@/components/lobby/lobby-role-card";
import { LobbyParticipantPanel } from "@/components/lobby/lobby-participant-panel";
import { LobbyReadyPanel } from "@/components/lobby/lobby-ready-panel";
import { RoleTutorialCallouts } from "@/components/lobby/role-tutorial-callouts";
import { RoleTutorialWizard } from "@/components/lobby/role-tutorial-wizard";
import { SoloLobbyCountdown } from "@/components/lobby/solo-lobby-countdown";

export function PlayerLobbyScreen({
  data,
  readyPending,
  tutorialOpen,
  onSetReady,
  onOpenTutorial,
  onCloseTutorial,
}: {
  data: SessionSnapshot;
  readyPending: boolean;
  tutorialOpen: boolean;
  onSetReady: (ready: boolean) => void;
  onOpenTutorial: () => void;
  onCloseTutorial: () => void;
}) {
  const self = data.participants.find((p) => p.isSelf);
  const selfRole = self?.role ?? null;
  const humans = data.participants.filter((p) => !p.isBot);
  const readiness = computeLobbyReadiness(data);
  const showSoloCountdown = humans.length <= 1 && data.lobbySoloSince && data.status === "LOBBY";

  const tutorialContent = selfRole ? getRoleTutorialContent(selfRole) : null;
  const wizardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tutorialOpen) return;
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    if (!isMobile) return;
    const frame = requestAnimationFrame(() => {
      wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [tutorialOpen]);

  return (
    <div className="flex w-full flex-col gap-4 lg:gap-5">
      {showSoloCountdown ? <SoloLobbyCountdown soloSince={data.lobbySoloSince!} extendUsed={data.lobbySoloExtendUsed} isHost={false} /> : null}
      <div className="grid w-full gap-4 lg:grid-cols-3 lg:items-stretch lg:gap-5">
        <div className="min-h-[360px] md:col-span-1">
          <LobbyRoleCard role={selfRole} onOpenTutorial={onOpenTutorial} />
        </div>
        <div className="min-h-[360px] md:col-span-1">
          <LobbyParticipantPanel participants={data.participants} humanCount={humans.length} maxPlayers={data.maxPlayers} />
        </div>
        <div className="min-h-[360px] md:col-span-1">
          <LobbyReadyPanel
            selfReady={self?.ready ?? false}
            readyPending={readyPending}
            isParticipant={!!self}
            roleDistribution={readiness.roleDistribution}
            onSetReady={onSetReady}
          />
        </div>
      </div>

      {tutorialOpen && selfRole ? (
        <div ref={wizardRef} className="scroll-mt-20">
          <RoleTutorialWizard role={selfRole} onClose={onCloseTutorial} />
        </div>
      ) : null}

      {selfRole && tutorialContent ? (
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="text-sm font-semibold">Hướng dẫn vai trò</h3>
          <div className="mt-4">
            <RoleTutorialCallouts
              className="lg:grid lg:grid-cols-3 lg:gap-4"
              theoryCallout={tutorialContent.theoryCallout}
              goalCallout={tutorialContent.goalCallout(data.totalRounds)}
              actions={tutorialContent.actions}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
