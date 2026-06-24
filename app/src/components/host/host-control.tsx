"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useSessionStream } from "@/hooks/use-session-stream";
import { useHostControl } from "@/hooks/use-host-control";
import { PhaseBanner } from "@/components/session/phase-banner";
import { LobbyRoster } from "@/components/lobby/lobby-roster";
import { HostControls } from "./host-controls";
import { STATUS_LABELS } from "@/lib/labels";

const ENDED = ["COMPLETED", "INCOMPLETE", "CANCELLED"];

export function HostControl({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  useSessionStream(sessionId);
  const { data, isLoading } = useSessionSnapshot(sessionId);
  const host = useHostControl(sessionId);

  useEffect(() => {
    if (!data) return;
    if (data.status === "LOBBY") router.replace(`/session/${sessionId}/lobby`);
    else if (ENDED.includes(data.status)) router.replace(`/session/${sessionId}/debrief`);
  }, [data, router, sessionId]);

  if (isLoading || !data) {
    return <p className="p-6 text-muted-foreground">Đang tải bảng điều khiển…</p>;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Điều phối phiên · {STATUS_LABELS[data.status]}</CardTitle>
          <span className="font-mono text-sm text-muted-foreground">{data.code}</span>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {data.currentRound > 0 ? (
            <PhaseBanner
              round={data.currentRound}
              phase={data.phase}
              phaseEndsAt={data.phaseEndsAt}
              paused={data.paused}
            />
          ) : null}
          <HostControls
            status={data.status}
            phase={data.phase}
            paused={data.paused}
            pending={host.isPending}
            onAction={(action) => host.mutate(action)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Người chơi</CardTitle>
        </CardHeader>
        <CardContent>
          <LobbyRoster participants={data.participants} />
        </CardContent>
      </Card>
    </main>
  );
}
