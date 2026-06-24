"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useSessionStream } from "@/hooks/use-session-stream";
import { GamePhaseHud } from "@/components/session/game-phase-hud";
import { PlayerStatusBar } from "./player-status-bar";
import { MapZones } from "./map-zones";
import { RoundRecapCard } from "@/components/observatory/round-recap-card";
import { GameGuidance } from "@/components/learning/game-guidance";

const ENDED = ["COMPLETED", "INCOMPLETE", "CANCELLED"];

export function MapShell({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  useSessionStream(sessionId);
  const { data, isLoading } = useSessionSnapshot(sessionId);

  useEffect(() => {
    if (!data) return;
    if (data.status === "LOBBY") router.replace(`/session/${sessionId}/lobby`);
    else if (data.isHost && !data.autoHost) router.replace(`/host/session/${sessionId}`);
    else if (ENDED.includes(data.status) || data.status === "DEBRIEF")
      router.replace(`/session/${sessionId}/debrief`);
  }, [data, router, sessionId]);

  if (isLoading || !data) {
    return <p className="p-6 text-muted-foreground">Đang tải phiên…</p>;
  }

  const recapRound = data.analytics.find((r) => r.number === data.currentRound);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
      <GameGuidance
        context={{
          screen: "map",
          status: data.status,
          phase: data.phase,
          role: data.self?.role ?? null,
          autoHost: data.autoHost,
        }}
      />
      <GamePhaseHud sessionId={sessionId} data={data} />
      <PlayerStatusBar self={data.self} />
      {data.status === "INTRO" ? (
        <div className="flex flex-col gap-3 rounded-xl bg-muted px-4 py-6 text-sm">
          <p className="font-semibold">Chào mừng đến Phiên chợ giá trị</p>
          <p className="text-muted-foreground">
            Bạn sẽ trải nghiệm bốn vòng mô phỏng thị trường thanh long. Hãy nhớ: giá trị
            (lao động xã hội) và giá cả (giao dịch) là hai đại lượng khác nhau; cung-cầu
            tác động trực tiếp tới giá cả, không tạo ra giá trị.
          </p>
          <p className="text-xs text-muted-foreground">
            Vai của bạn: {data.self?.role ?? "đang chờ"} · Bản đồ có năm khu — chọn khu
            phù hợp khi vòng 1 bắt đầu.
          </p>
        </div>
      ) : data.phase === "RECAP" && recapRound ? (
        <RoundRecapCard sessionId={sessionId} round={recapRound} />
      ) : (
        <MapZones
          sessionId={sessionId}
          role={data.self?.role ?? null}
          participants={data.participants}
        />
      )}
    </main>
  );
}
