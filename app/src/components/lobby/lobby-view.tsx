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
import { MIN_PLAYERS } from "@/lib/scenario";
import { LobbyCode } from "./lobby-code";
import { LobbyRoster } from "./lobby-roster";

export function LobbyView({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  useSessionStream(sessionId);
  const { data, isLoading } = useSessionSnapshot(sessionId);
  const setReady = useSetReady(sessionId);
  const leave = useLeaveRoom(sessionId);
  const host = useHostControl(sessionId);

  // Once the session leaves the lobby, move to the right shell.
  useEffect(() => {
    if (!data || data.status === "LOBBY") return;
    if (["CANCELLED", "COMPLETED", "INCOMPLETE"].includes(data.status)) {
      router.replace(`/session/${sessionId}/debrief`);
    } else {
      router.replace(
        data.isHost
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
        <LobbyRoster participants={data.participants} />

        {data.isHost ? (
          <div className="flex flex-col gap-1">
            <Button
              disabled={!allReady || host.isPending}
              size="lg"
              onClick={() => host.mutate("start")}
            >
              Bắt đầu phiên
            </Button>
            {!allReady ? (
              <p className="text-xs text-muted-foreground">
                Cần ít nhất 1 người sẵn sàng. Bot sẽ lấp các vai còn lại (mục
                tiêu {MIN_PLAYERS}–10 người).
              </p>
            ) : null}
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
