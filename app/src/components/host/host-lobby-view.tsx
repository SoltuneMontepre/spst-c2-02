"use client";

import { Play } from "lucide-react";
import { useSessionSnapshot, useSetReady } from "@/hooks/use-session-room";
import { useSessionStream } from "@/hooks/use-session-stream";
import { useHostControl } from "@/hooks/use-host-control";
import { useSessionCancelledRedirect } from "@/hooks/use-session-cancelled-redirect";
import { HostLobbyHeader } from "@/components/host/host-lobby-header";
import { HostLobbyRoster } from "@/components/host/host-lobby-roster";
import { LobbyRefreshButton } from "@/components/lobby/lobby-refresh-button";
import { HostLobbyChecklist } from "@/components/host/host-lobby-checklist";
import { HostRoleDistribution } from "@/components/host/host-role-distribution";
import { HostTeacherTips } from "@/components/host/host-teacher-tips";
import { CreateRoomShareCard } from "@/components/create-room/create-room-share-card";
import { LobbySetup } from "@/components/lobby/lobby-setup";
import { Button } from "@/components/ui/button";
import { computeLobbyReadiness } from "@/lib/lobby-readiness";
import { lobbyMinHumans } from "@/components/lobby/lobby-controls";
import { SoloLobbyCountdown } from "@/components/lobby/solo-lobby-countdown";
import { ApiClientError } from "@/hooks/use-api";
import { errorMessage } from "@/lib/error-messages";

export function HostLobbyView({
  sessionId,
}: {
  sessionId: string;
  displayName: string;
}) {
  useSessionStream(sessionId);
  const { data, isLoading } = useSessionSnapshot(sessionId);
  const host = useHostControl(sessionId);
  const setReady = useSetReady(sessionId);

  useSessionCancelledRedirect(data?.status, "solo_timeout");

  if (isLoading || !data) {
    return <p className="p-8 text-muted-foreground">Đang tải bảng điều khiển…</p>;
  }

  const humans = data.participants.filter((p) => !p.isBot);
  const self = data.participants.find((p) => p.isSelf);
  const readiness = computeLobbyReadiness(data);
  const minHumans = lobbyMinHumans(data.autoHost);
  const showSoloCountdown =
    humans.length <= 1 && data.lobbySoloSince && data.status === "LOBBY";

  return (
    <div className="flex min-h-full flex-col bg-background">
      <HostLobbyHeader
        sessionId={sessionId}
        code={data.code}
        subtitle="Đang chờ người chơi tham gia"
        status={data.status}
      />
      <main className="flex w-full flex-1 flex-col gap-4 p-4 pb-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-4 lg:items-start">
          <div className="col-span-12 min-h-[320px] lg:col-span-4">
            <HostLobbyRoster
              participants={data.participants}
              readyCount={readiness.readyCount}
              humanCount={readiness.humanCount}
              headerExtra={<LobbyRefreshButton sessionId={sessionId} />}
            />
          </div>

          <div className="col-span-12 mx-auto flex w-full max-w-sm flex-col gap-3 lg:col-span-4">
            <CreateRoomShareCard code={data.code} compact />
            <p className="text-center text-sm text-muted-foreground">
              Chia sẻ mã hoặc màn hình QR này cho học sinh
            </p>
            {self ? (
              <Button
                variant={self.ready ? "secondary" : "outline"}
                className="w-full"
                disabled={setReady.isPending}
                onClick={() => setReady.mutate(!self.ready)}
              >
                {self.ready ? "Bỏ sẵn sàng" : "Tôi đã sẵn sàng (host)"}
              </Button>
            ) : null}
            {data.autoHost ? (
              readiness.canStart ? (
                <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-center text-sm font-medium text-primary">
                  AI đang khởi động phiên…
                </p>
              ) : null
            ) : (
              <Button
                size="lg"
                className="w-full gap-2"
                disabled={!readiness.canStart || host.isPending}
                onClick={() => host.mutate("start")}
              >
                <Play className="size-4" aria-hidden />
                Bắt đầu phiên chợ
              </Button>
            )}
            {!readiness.canStart && humans.length < minHumans ? (
              <p className="text-center text-xs text-muted-foreground">
                Cần ít nhất {minHumans} người chơi để bắt đầu.
              </p>
            ) : null}
            {showSoloCountdown ? (
              <SoloLobbyCountdown
                soloSince={data.lobbySoloSince!}
                extendUsed={data.lobbySoloExtendUsed}
                isHost
                extendPending={host.isPending}
                onExtend={() => host.mutate("extendSoloLobby")}
              />
            ) : null}
          </div>

          <div className="col-span-12 flex flex-col gap-4 lg:col-span-4">
            <HostLobbyChecklist
              items={readiness.checklist}
              completedCount={readiness.completedCount}
              totalCount={readiness.totalCount}
            />
            <HostRoleDistribution roles={readiness.roleDistribution} />
          </div>
        </div>

        {!data.autoAssignRoles ? (
          <div className="rounded-2xl border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold">Gán vai thủ công</h3>
            <LobbySetup
              participants={data.participants}
              maxPlayers={data.maxPlayers}
              pending={host.isPending}
              onAction={(action) => host.mutate(action)}
            />
            {host.isError && host.error instanceof ApiClientError ? (
              <p className="mt-3 text-sm text-danger" role="alert">
                {errorMessage(host.error.code)}
              </p>
            ) : null}
          </div>
        ) : null}

        <HostTeacherTips />
      </main>
    </div>
  );
}
