"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useSessionSnapshot,
  useSetReady,
  useLeaveRoom,
} from "@/hooks/use-session-room";
import { useSessionStream } from "@/hooks/use-session-stream";
import { useSessionCancelledRedirect } from "@/hooks/use-session-cancelled-redirect";
import { useHostControl } from "@/hooks/use-host-control";
import { ApiClientError } from "@/hooks/use-api";
import { errorMessage } from "@/lib/error-messages";
import { computeLobbyReadiness, lobbyMinHumans } from "@/lib/lobby-readiness";
import { PageLoading } from "@/components/ui/page-loading";

import { LobbyRoomHeader } from "@/components/lobby/lobby-room-header";
import { LobbyReadyBar } from "@/components/lobby/lobby-ready-bar";
import { LobbySettingsPanel } from "@/components/lobby/lobby-settings-panel";
import { HostLobbyRoster } from "@/components/host/host-lobby-roster";
import {
  HostLobbyChecklist,
  YourRolePanel,
} from "@/components/host/host-lobby-checklist";
import { CreateRoomShareCard } from "@/components/create-room/create-room-share-card";
import { LobbyRefreshButton } from "@/components/lobby/lobby-refresh-button";
import { SessionGuidanceScope } from "@/components/learning/session-guidance-scope";
import { SoloLobbyCountdown } from "@/components/lobby/solo-lobby-countdown";

const ENDED = ["COMPLETED", "INCOMPLETE"];
const AUTO_START_COUNTDOWN_SECONDS = 5;

function lobbyStatusText({
  humanCount,
  minHumans,
  readyCount,
}: {
  humanCount: number;
  minHumans: number;
  readyCount: number;
}): string {
  return humanCount < minHumans
    ? `${humanCount}/${minHumans}`
    : `${readyCount}/${humanCount}`;
}

export function LobbyRoom({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { data, isLoading, isError, error } = useSessionSnapshot(sessionId);
  const setReady = useSetReady(sessionId);
  const leave = useLeaveRoom(sessionId);
  const host = useHostControl(sessionId);
  const [mounted, setMounted] = useState(false);
  const [startCountdown, setStartCountdown] = useState<number | null>(null);
  const autoStartTriggeredRef = useRef(false);

  const streamState = useSessionStream(sessionId);

  useSessionCancelledRedirect(data?.status, "solo_timeout");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isError || !(error instanceof ApiClientError) || error.status !== 403) return;
    router.replace("/home");
  }, [isError, error, router]);

  useEffect(() => {
    if (!data) return;
    if (ENDED.includes(data.status)) {
      router.replace(`/session/${sessionId}/debrief`);
    } else if (data.status !== "LOBBY" && data.status !== "CANCELLED") {
      router.replace(`/session/${sessionId}/game`);
    }
  }, [data, router, sessionId]);

  const readiness = data ? computeLobbyReadiness(data) : null;

  const autoStartArmed =
    !!data &&
    data.status === "LOBBY" &&
    data.isHost &&
    readiness?.canStart === true;

  useEffect(() => {
    if (!autoStartArmed) {
      setStartCountdown(null);
      autoStartTriggeredRef.current = false;
      return;
    }
    setStartCountdown(AUTO_START_COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setStartCountdown((prev) => (prev !== null ? Math.max(prev - 1, 0) : prev));
    }, 1000);
    return () => clearInterval(interval);
  }, [autoStartArmed]);

  useEffect(() => {
    if (startCountdown !== 0 || autoStartTriggeredRef.current) return;
    autoStartTriggeredRef.current = true;
    host.mutate({ action: "start" });
  }, [startCountdown, host]);

  if (!mounted || isLoading || (!data && !isError)) {
    return <PageLoading label="Đang tải phòng…" fullScreen />;
  }

  if (isError || !data || !readiness) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <p className="p-8 text-muted-foreground">Không thể truy cập phòng này.</p>
      </div>
    );
  }

  const isHost = data.isHost;
  const self = data.participants.find((p) => p.isSelf);
  const minHumans = lobbyMinHumans(data.autoHost);
  const showSoloCountdown =
    Boolean(data.lobbySoloSince) && data.status === "LOBBY";

  const subtitle = isHost
    ? "Đang chờ người chơi tham gia"
    : "Đang chờ host bắt đầu…";

  const statusText = lobbyStatusText({
    humanCount: readiness.humanCount,
    minHumans,
    readyCount: readiness.readyCount,
  });

  return (
    <SessionGuidanceScope guidanceEnabled={data.guidanceEnabled}>
      <div className="flex h-screen flex-col bg-background">
        <LobbyRoomHeader
          subtitle={subtitle}
          isHost={isHost}
          onLeave={() => leave.mutate()}
          leavePending={leave.isPending}
          streamState={streamState}
        />

        <main className="flex w-full flex-1 flex-col gap-4 overflow-y-auto p-4 pb-6 sm:px-6 lg:px-8">
          {showSoloCountdown ? (
            <SoloLobbyCountdown
              soloSince={data.lobbySoloSince!}
              extendUsed={data.lobbySoloExtendUsed}
              isHost={isHost}
              extendPending={host.isPending}
              onExtend={isHost ? () => host.mutate("extendSoloLobby") : undefined}
            />
          ) : null}

          <div className="grid flex-1 grid-cols-7 gap-4">
            <div className="col-span-7 flex flex-col gap-4 lg:col-span-2">
              <CreateRoomShareCard code={data.code} compact />
              <LobbySettingsPanel
                isHost={isHost}
                sessionId={sessionId}
                status={data.status}
                autoHost={data.autoHost}
                autoHostPending={host.isPending}
                onSetAutoHost={(enabled) =>
                  host.mutate({ action: "setAutoHost", autoHost: enabled })
                }
                autoAssignRoles={data.autoAssignRoles}
                autoAssignRolesPending={host.isPending}
                onSetAutoAssignRoles={(enabled) =>
                  host.mutate({ action: "setAutoAssignRoles", autoAssignRoles: enabled })
                }
                guidanceEnabled={data.guidanceEnabled}
                guidanceEnabledPending={host.isPending}
                onSetGuidanceEnabled={(enabled) =>
                  host.mutate({ action: "setGuidanceEnabled", guidanceEnabled: enabled })
                }
              />
            </div>

            <div className="col-span-7 min-h-[320px] lg:col-span-3">
              <HostLobbyRoster
                sessionId={sessionId}
                participants={data.participants}
                readyCount={readiness.readyCount}
                humanCount={readiness.humanCount}
                headerExtra={<LobbyRefreshButton sessionId={sessionId} />}
                autoAssignRoles={data.autoAssignRoles}
                maxPlayers={data.maxPlayers}
              />
              {host.isError && host.error instanceof ApiClientError ? (
                <p className="mt-2 text-sm text-danger" role="alert">
                  {errorMessage(host.error.code)}
                </p>
              ) : null}
            </div>

            <div className="col-span-7 flex flex-col gap-4 lg:col-span-2">
              <YourRolePanel
                role={self?.role ?? null}
                autoAssignRoles={data.autoAssignRoles}
              />
              <HostLobbyChecklist
                items={readiness.checklist}
                completedCount={readiness.completedCount}
                totalCount={readiness.totalCount}
                roles={readiness.roleDistribution}
              />
            </div>
          </div>
        </main>

        <LobbyReadyBar
          statusText={statusText}
          selfReady={self?.ready ?? false}
          readyPending={setReady.isPending}
          isParticipant={!!self}
          onSetReady={(ready) => setReady.mutate(ready)}
          showAutoStart={isHost}
          startCountdown={startCountdown}
          isHost={isHost}
          onLeave={() => leave.mutate()}
          leavePending={leave.isPending}
        />
      </div>
    </SessionGuidanceScope>
  );
}
