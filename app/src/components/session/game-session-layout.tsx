"use client";

import type { ReactNode } from "react";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useSessionStream } from "@/hooks/use-session-stream";
import { GameSidebar, GameMobileNav, type GameNavItem } from "@/components/session/game-sidebar";
import { GameTopBar } from "@/components/session/game-top-bar";
import { SessionGuidanceScope } from "@/components/learning/session-guidance-scope";
import type { GameScreen } from "@/lib/game-zones";
import { cn } from "@/lib/utils";

function navFromZone(zone: GameScreen, phase: string | null): GameNavItem {
  if (phase === "RECAP") return "recap";
  return zone;
}

export function GameSessionLayout({
  sessionId,
  activeZone,
  variant = "default",
  title,
  subtitle,
  rightPanel,
  children,
}: {
  sessionId: string;
  activeZone: GameScreen | "debrief";
  variant?: "default" | "focused" | "map";
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

  const isFocused = variant === "focused" || variant === "map";

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
            isHost={data.isHost}
            sessionStatus={data.status}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <GameTopBar
              data={data}
              streamState={streamState}
            />

            <div className="flex min-h-0 flex-1 overflow-auto pb-20 lg:pb-6">
              <main
                className={cn(
                  "min-w-0 flex-1",
                  isFocused
                    ? "flex flex-col gap-3.5 bg-[#f7f4ef] p-[17.5px]"
                    : "p-4 sm:p-6",
                )}
              >
                {!isFocused && title ? (
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
                <aside
                  className={cn(
                    "hidden shrink-0 flex-col lg:flex",
                    isFocused
                      ? "w-[236px] border-l border-[#ede8e0] bg-[#fefcf9]"
                      : "w-72 gap-4 p-4 sm:p-6",
                  )}
                >
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
      </div>
    </SessionGuidanceScope>
  );
}
