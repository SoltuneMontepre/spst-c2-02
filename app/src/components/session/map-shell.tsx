"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useSessionStream } from "@/hooks/use-session-stream";
import { PhaseBanner } from "./phase-banner";
import { PlayerStatusBar } from "./player-status-bar";
import { MapZones } from "./map-zones";

const ENDED = ["COMPLETED", "INCOMPLETE", "CANCELLED"];

export function MapShell({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  useSessionStream(sessionId);
  const { data, isLoading } = useSessionSnapshot(sessionId);

  useEffect(() => {
    if (!data) return;
    if (data.status === "LOBBY") router.replace(`/session/${sessionId}/lobby`);
    else if (data.isHost) router.replace(`/host/session/${sessionId}`);
    else if (ENDED.includes(data.status)) router.replace(`/session/${sessionId}/debrief`);
  }, [data, router, sessionId]);

  if (isLoading || !data) {
    return <p className="p-6 text-muted-foreground">Đang tải phiên…</p>;
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
      <PhaseBanner
        round={data.currentRound}
        phase={data.phase}
        phaseEndsAt={data.phaseEndsAt}
        paused={data.paused}
      />
      <PlayerStatusBar self={data.self} />
      {data.status === "INTRO" ? (
        <p className="rounded-xl bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
          Host đang giới thiệu phiên. Khu nhiệm vụ sẽ mở khi vào vòng 1.
        </p>
      ) : (
        <MapZones sessionId={sessionId} role={data.self?.role ?? null} />
      )}
    </main>
  );
}
