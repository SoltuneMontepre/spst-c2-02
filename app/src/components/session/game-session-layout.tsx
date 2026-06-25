"use client";

import type { ReactNode } from "react";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useSessionStream } from "@/hooks/use-session-stream";
import { GameSidebar, GameMobileNav, type GameNavItem } from "@/components/session/game-sidebar";
import { GameTopBar } from "@/components/session/game-top-bar";
import { GameAnnouncementBanner } from "@/components/session/game-announcement-banner";
import { SessionRosterWall } from "@/components/session/session-roster-wall";
import { SessionGuidanceScope } from "@/components/learning/session-guidance-scope";
import type { GameScreen } from "@/lib/game-zones";

function navFromZone(zone: GameScreen, phase: string | null): GameNavItem {
  if (phase === "RECAP") return "recap";
  return zone;
}

export function GameSessionLayout({
  sessionId,
  activeZone,
  title,
  subtitle,
  rightPanel,
  children,
}: {
  sessionId: string;
  activeZone: GameScreen | "debrief";
  title?: string;
  subtitle?: ReactNode;
  rightPanel?: ReactNode;
  children: ReactNode;
}) {
  const streamState = useSessionStream(sessionId);
  const { data, isLoading } = useSessionSnapshot(sessionId);

  if (isLoading || !data) {
    return <p className="p-8 text-muted-foreground">Đang tải phiên…</p>;
  }

  const navItem: GameNavItem =
    activeZone === "debrief" ? "debrief" : navFromZone(activeZone, data.phase);

  return (
    <SessionGuidanceScope guidanceEnabled={data.guidanceEnabled}>
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex min-h-0 flex-1">
          <GameSidebar
            sessionId={sessionId}
            active={navItem}
            role={data.self?.role ?? null}
            status={data.status}
            phase={data.phase}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <GameTopBar data={data} streamState={streamState} />

            {activeZone !== "debrief" ? (
              <div className="border-b border-border px-4 py-3 sm:px-6">
                <GameAnnouncementBanner sessionId={sessionId} data={data} />
              </div>
            ) : null}

            <div className="flex min-h-0 flex-1 gap-4 overflow-auto p-4 pb-20 sm:p-6 lg:pb-6">
              <main className="min-w-0 flex-1">
                {title ? (
                  <div className="mb-4">
                    <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                      {title}
                    </h1>
                    {subtitle ? (
                      <div className="mt-0.5 text-sm text-muted-foreground">
                        {subtitle}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {children}
              </main>

              {rightPanel ? (
                <aside className="hidden w-72 shrink-0 flex-col gap-4 lg:flex">
                  {rightPanel}
                </aside>
              ) : null}
            </div>
          </div>
        </div>

        <GameMobileNav
          sessionId={sessionId}
          active={navItem}
          role={data.self?.role ?? null}
        />

        <SessionRosterWall
          sessionId={sessionId}
          participants={data.participants}
          sessionStatus={data.status}
        />
      </div>
    </SessionGuidanceScope>
  );
}
