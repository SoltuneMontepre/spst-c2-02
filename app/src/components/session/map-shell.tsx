"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useSessionCancelledRedirect } from "@/hooks/use-session-cancelled-redirect";
import { useAutoPhaseReady } from "@/hooks/use-phase-ready";
import { GameSessionLayout } from "@/components/session/game-session-layout";
import { GamePhaseCta } from "@/components/session/game-phase-cta";
import { GameBottomPill } from "@/components/session/game-bottom-pill";
import { MapPlayerRoster } from "@/components/session/map-player-roster";
import { MapRoleActionPanel } from "@/components/session/map-role-action-panel";
import { MapResourcesPanel } from "@/components/session/map-resources-panel";
import {
  EventAnnouncementPopup,
  useEventAnnouncement,
} from "@/components/session/event-announcement";
import { RoundRecapCard } from "@/components/observatory/round-recap-card";
import { PageLoading } from "@/components/ui/page-loading";
import { getRoleQuest } from "@/lib/role-quest";

const ENDED = ["COMPLETED", "INCOMPLETE"];

export function MapShell({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { data, isLoading } = useSessionSnapshot(sessionId);

  useSessionCancelledRedirect(data?.status, "solo_timeout");

  useEffect(() => {
    if (!data) return;
    if (data.status === "LOBBY") router.replace(`/session/${sessionId}/lobby`);
    else if (ENDED.includes(data.status) || data.status === "DEBRIEF")
      router.replace(`/session/${sessionId}/debrief`);
  }, [data, router, sessionId]);

  const selfParticipant = data?.participants.find((p) => p.isSelf);
  const role = data?.self?.role ?? null;
  const quest = useMemo(() => {
    if (!data || !role) return null;
    return getRoleQuest({
      role,
      phase: data.phase,
      round: data.currentRound,
      roleState: data.self?.roleState ?? null,
      marketListingCount: data.market?.listings.length ?? 0,
    });
  }, [data, role]);

  const questStatus = quest?.status;
  // Auto-ready when waiting (nothing to do). After an action (done), the
  // bottom pill ready button pulses so the player confirms — except for
  // the government, whose "done" state (policy already applied) leaves
  // nothing left to confirm, so it auto-readies too.
  const shouldAutoReady =
    questStatus === "waiting" || (role === "GOVERNMENT" && questStatus === "done");
  const phaseReady = selfParticipant?.phaseReady ?? false;
  const canPhaseReady = Boolean(selfParticipant && !selfParticipant.isBot);

  useAutoPhaseReady({
    sessionId,
    phase: data?.phase ?? null,
    phaseReady,
    shouldAutoReady,
    paused: data?.paused ?? false,
    enabled: canPhaseReady,
  });

  const eventAnnouncement = useEventAnnouncement(
    sessionId,
    data?.status ?? "",
    data?.phase ?? null,
    data?.currentRound ?? 0,
  );

  if (isLoading || !data) {
    return <PageLoading label="Đang tải phiên…" fullScreen />;
  }

  const recapRound = data.analytics.find((r) => r.number === data.currentRound);

  return (
    <GameSessionLayout variant="map" sessionId={sessionId} activeZone="map">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <MapPlayerRoster
          snapshot={{
            phase: data.phase,
            status: data.status,
            currentRound: data.currentRound,
            self: data.self,
            market: data.market,
            autoHost: data.autoHost,
            participants: data.participants,
          }}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden p-3 pb-[4.75rem]">
          <div className="shrink-0">
            <GamePhaseCta
              variant="map"
              sessionId={sessionId}
              status={data.status}
              phase={data.phase}
              round={data.currentRound}
              role={role}
              roleState={data.self?.roleState ?? null}
              marketListingCount={data.market?.listings.length ?? 0}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {data.phase === "RECAP" && recapRound ? (
              <RoundRecapCard
                sessionId={sessionId}
                round={recapRound}
                analytics={data.analytics}
                selfTransactions={data.recentTransactions}
              />
            ) : (
              <MapRoleActionPanel sessionId={sessionId} />
            )}
          </div>
        </div>

        <MapResourcesPanel data={data} className="hidden min-h-0 lg:flex" />
      </div>

      <GameBottomPill
        sessionId={sessionId}
        self={data.self}
        selfParticipant={selfParticipant}
        phase={data.phase}
        phaseEndsAt={data.phaseEndsAt}
        paused={data.paused}
        status={data.status}
        phaseReady={phaseReady}
        autoHost={data.autoHost}
        questStatus={questStatus}
      />

      <EventAnnouncementPopup
        round={eventAnnouncement.round}
        open={eventAnnouncement.open}
        onClose={eventAnnouncement.dismiss}
        preview={eventAnnouncement.preview}
      />
    </GameSessionLayout>
  );
}
