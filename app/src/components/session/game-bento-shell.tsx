"use client";

import type { ReactNode } from "react";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useSessionStream } from "@/components/realtime/session-realtime-provider";
import { BentoTile } from "@/components/ui/bento-tile";
import { ZoneNav } from "@/components/session/zone-nav";
import { GameAnnouncementBanner } from "@/components/session/game-announcement-banner";
import { PersonalInventoryHud } from "@/components/session/personal-inventory-hud";
import { SessionRosterWall } from "@/components/session/session-roster-wall";
import { GuidancePanel } from "@/components/learning/guidance-panel";
import { SessionGuidanceScope } from "@/components/learning/session-guidance-scope";
import { TutorialToggle } from "@/components/learning/tutorial-toggle";
import { useTutorial } from "@/components/learning/tutorial-provider";
import { getGuidance, type GuidanceContext } from "@/lib/game-guidance";
import type { GameScreen } from "@/lib/game-zones";
import { getZonePanelCopy } from "@/lib/zone-phase";
import { getRoleQuest } from "@/lib/role-quest";
import { RoleQuestCard } from "@/components/session/role-quest-card";

export function GameBentoShell({
  sessionId,
  activeZone,
  guidanceContext,
  children,
}: {
  sessionId: string;
  activeZone: GameScreen;
  guidanceContext: GuidanceContext;
  children: ReactNode;
}) {
  const streamState = useSessionStream(sessionId);
  const { data, isLoading } = useSessionSnapshot(sessionId);
  const { enabled: guidanceOn } = useTutorial();
  const guidance = getGuidance(guidanceContext);

  if (isLoading || !data) {
    return <p className="p-8 text-muted-foreground">Đang tải phiên…</p>;
  }

  const panel = getZonePanelCopy({
    activeZone,
    role: data.self?.role ?? null,
    phase: data.phase,
    round: data.currentRound,
  });

  const questTitle =
    data.self?.role != null
      ? getRoleQuest({
          role: data.self.role,
          phase: data.phase,
          round: data.currentRound,
          roleState: data.self.roleState ?? null,
          marketListingCount: data.market?.listings.length ?? 0,
        }).title
      : "Mục tiêu vòng này";

  const selfParticipant = data.participants.find((p) => p.isSelf);

  return (
    <SessionGuidanceScope guidanceEnabled={data.guidanceEnabled}>
    <>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/90">
        <div className="w-full px-4 py-3 sm:px-6 lg:px-8">
          <GameAnnouncementBanner sessionId={sessionId} data={data} />
        </div>
      </header>

      <div className="relative flex w-full flex-1 flex-col gap-4 px-4 pb-24 pr-12 pt-28 sm:px-6 sm:pb-24 sm:pr-14 sm:pt-32 lg:px-8">
        <div className="grid grid-cols-12 gap-4 lg:items-start">
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-3 lg:sticky lg:top-32 lg:self-start">
            <BentoTile title="Khu vực" description="Chuyển màn hình">
              <ZoneNav
                sessionId={sessionId}
                active={activeZone}
                role={data.self?.role ?? null}
                phase={data.phase}
                round={data.currentRound}
              />
            </BentoTile>
          </div>

          <BentoTile
            colSpan="col-span-12 lg:col-span-6"
            title={panel.title}
            description={panel.description}
            className="min-h-[320px]"
          >
            {children}
          </BentoTile>

          <div className="col-span-12 flex flex-col gap-4 lg:col-span-3 lg:sticky lg:top-32 lg:self-start">
            <BentoTile
              title="Nhiệm vụ"
              description={questTitle}
              className="ring-1 ring-primary/25"
            >
              <RoleQuestCard data={data} />
            </BentoTile>

            <BentoTile
              title="Hướng dẫn"
              description={guidance.title}
              headerExtra={<TutorialToggle className="h-8 px-2 text-xs" />}
            >
              {guidanceOn ? (
                <GuidancePanel content={guidance} embedded />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Mẹo đã ẩn. Bấm nút góc trên để hiện lại.
                </p>
              )}
            </BentoTile>
          </div>
        </div>
      </div>

      <PersonalInventoryHud
        self={data.self}
        displayName={selfParticipant?.displayName}
        presence={selfParticipant?.presence ?? "ONLINE"}
        streamState={streamState}
      />

      <SessionRosterWall
        sessionId={sessionId}
        participants={data.participants}
        sessionStatus={data.status}
      />
    </>
    </SessionGuidanceScope>
  );
}
