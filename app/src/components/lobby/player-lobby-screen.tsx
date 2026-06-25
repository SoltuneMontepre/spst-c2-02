"use client";

import type { SessionSnapshot } from "@/lib/session-service";
import { computeLobbyReadiness } from "@/lib/lobby-readiness";
import { LobbyRoleCard } from "@/components/lobby/lobby-role-card";
import { LobbyParticipantPanel } from "@/components/lobby/lobby-participant-panel";
import { LobbyReadyPanel } from "@/components/lobby/lobby-ready-panel";
import { SoloLobbyCountdown } from "@/components/lobby/solo-lobby-countdown";

export function PlayerLobbyScreen({
  data,
  readyPending,
  onSetReady,
  onOpenTutorial,
}: {
  data: SessionSnapshot;
  readyPending: boolean;
  onSetReady: (ready: boolean) => void;
  onOpenTutorial: () => void;
}) {
  const self = data.participants.find((p) => p.isSelf);
  const humans = data.participants.filter((p) => !p.isBot);
  const readiness = computeLobbyReadiness(data);
  const showSoloCountdown =
    humans.length <= 1 && data.lobbySoloSince && data.status === "LOBBY";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {showSoloCountdown ? (
        <SoloLobbyCountdown
          soloSince={data.lobbySoloSince!}
          extendUsed={data.lobbySoloExtendUsed}
          isHost={false}
        />
      ) : null}
      <div className="grid w-full gap-4 md:grid-cols-3 md:items-stretch">
      <div className="min-h-[360px] md:col-span-1">
        <LobbyRoleCard role={self?.role ?? null} onOpenTutorial={onOpenTutorial} />
      </div>
      <div className="min-h-[360px] md:col-span-1">
        <LobbyParticipantPanel
          participants={data.participants}
          humanCount={humans.length}
          maxPlayers={data.maxPlayers}
        />
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
    </div>
  );
}
