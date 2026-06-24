"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useSessionSnapshot,
  useSetReady,
  useLeaveRoom,
} from "@/hooks/use-session-room";
import { useSessionStream } from "@/hooks/use-session-stream";
import { useHostControl } from "@/hooks/use-host-control";
import { LobbyCode } from "./lobby-code";
import { LobbyRoster } from "./lobby-roster";
import { LobbySetup } from "./lobby-setup";
import { START_MIN_HUMANS } from "@/lib/scenario";
import { GameGuidance } from "@/components/learning/game-guidance";

export function LobbyView({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  useSessionStream(sessionId);
  const { data, isLoading } = useSessionSnapshot(sessionId);
  const setReady = useSetReady(sessionId);
  const leave = useLeaveRoom(sessionId);
  const host = useHostControl(sessionId);

  useEffect(() => {
    if (!data || data.status === "LOBBY") return;
    if (["CANCELLED", "COMPLETED", "INCOMPLETE"].includes(data.status)) {
      router.replace(`/session/${sessionId}/debrief`);
    } else {
      router.replace(
        data.isHost && !data.autoHost
          ? `/host/session/${sessionId}`
          : `/session/${sessionId}/map`,
      );
    }
  }, [data, router, sessionId]);

  if (isLoading || !data) {
    return <p className="p-6 text-muted-foreground">Đang tải phòng…</p>;
  }

  const self = data.participants.find((p) => p.isSelf);
  const humans = data.participants.filter((p) => !p.isBot);
  const allReady = humans.length >= 1 && humans.every((p) => p.ready);
  const manualMode =
    data.participants.some((p) => p.role) || data.participants.some((p) => p.isBot);
  const manualComplete =
    !manualMode ||
    (humans.every((p) => p.role) &&
      data.participants.filter((p) => p.isBot).every((p) => p.role));
  const minHumans = data.autoHost ? 1 : START_MIN_HUMANS;

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="gap-3">
        <CardTitle className="flex items-center justify-between">
          <span>Phòng chờ</span>
          <span className="text-sm font-normal text-muted-foreground">
            {humans.length}/{data.maxPlayers} người
          </span>
        </CardTitle>
        <LobbyCode code={data.code} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <GameGuidance context={{ screen: "lobby", autoHost: data.autoHost }} />
        {data.autoHost ? (
          <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-primary">Điều phối viên AI</span> sẽ tự
            bắt đầu phiên khi đủ {minHumans}+ người sẵn sàng, điều hành timer và lời dẫn.
          </p>
        ) : null}

        {data.isHost ? (
          <LobbySetup
            participants={data.participants}
            humanCount={humans.length}
            pending={host.isPending}
            onAction={(action) => host.mutate(action)}
          />
        ) : (
          <LobbyRoster participants={data.participants} />
        )}

        {data.isHost ? (
          <div className="flex flex-col gap-3">
            <label className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={data.autoHost}
                disabled={host.isPending}
                onChange={(e) =>
                  host.mutate({ action: "setAutoHost", autoHost: e.target.checked })
                }
              />
              <span>
                <span className="font-medium">AI điều phối</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Tự bắt đầu, timer, fast-forward khi mọi người sẵn sàng, và lời dẫn
                  từng giai đoạn.
                </span>
              </span>
            </label>
            {data.autoHost ? (
              <p className="text-center text-sm text-muted-foreground">
                {allReady && manualComplete && humans.length >= minHumans
                  ? "AI đang khởi động phiên…"
                  : `Chờ ${minHumans}+ người sẵn sàng để AI bắt đầu.`}
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                <Button
                  disabled={!allReady || !manualComplete || humans.length < minHumans || host.isPending}
                  size="lg"
                  onClick={() => host.mutate("start")}
                >
                  Bắt đầu phiên
                </Button>
                {humans.length < minHumans ? (
                  <p className="text-xs text-muted-foreground">
                    Cần ít nhất {minHumans} người chơi.
                  </p>
                ) : !allReady ? (
                  <p className="text-xs text-muted-foreground">Chờ mọi người sẵn sàng.</p>
                ) : null}
              </div>
            )}
          </div>
        ) : (
          <Button
            size="lg"
            variant={self?.ready ? "secondary" : "primary"}
            disabled={setReady.isPending}
            onClick={() => setReady.mutate(!self?.ready)}
          >
            {self?.ready ? "Bỏ sẵn sàng" : "Tôi đã sẵn sàng"}
          </Button>
        )}

        <button
          type="button"
          className="text-xs text-muted-foreground underline"
          onClick={() => leave.mutate()}
        >
          Rời phòng
        </button>
      </CardContent>
    </Card>
  );
}
