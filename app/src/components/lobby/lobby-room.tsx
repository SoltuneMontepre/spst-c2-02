"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSessionSnapshot,
  useSetReady,
  useLeaveRoom,
} from "@/hooks/use-session-room";
import { useSessionStream } from "@/hooks/use-session-stream";
import {
  useSelfRoleChange,
  type RoleChangeNotice,
} from "@/hooks/use-self-role-change";
import { useSessionCancelledRedirect } from "@/hooks/use-session-cancelled-redirect";
import { useHostControl } from "@/hooks/use-host-control";
import { ApiClientError } from "@/hooks/use-api";
import { errorMessage } from "@/lib/error-messages";
import { computeLobbyReadiness, lobbyMinHumans } from "@/lib/lobby-readiness";
import { isRoleTutorialSkipped } from "@/lib/role-tutorial";
import type { GameEvent } from "@/lib/events";
import type { SessionSnapshot } from "@/lib/session-service";
import type { Role } from "@/generated/prisma/enums";

import { LobbyRoomHeader } from "@/components/lobby/lobby-room-header";
import { LobbyReadyBar } from "@/components/lobby/lobby-ready-bar";
import { LobbySettingsPanel } from "@/components/lobby/lobby-settings-panel";
import { HostLobbyRoster } from "@/components/host/host-lobby-roster";
import { HostLobbyChecklist } from "@/components/host/host-lobby-checklist";
import { CreateRoomShareCard } from "@/components/create-room/create-room-share-card";
import { LobbyRefreshButton } from "@/components/lobby/lobby-refresh-button";
import { LobbySetup } from "@/components/lobby/lobby-setup";
import { RoleChangeAlert } from "@/components/lobby/role-change-alert";
import { SessionGuidanceScope } from "@/components/learning/session-guidance-scope";
import { RoleTutorialCallouts } from "@/components/lobby/role-tutorial-callouts";
import { RoleTutorialWizard } from "@/components/lobby/role-tutorial-wizard";
import { SoloLobbyCountdown } from "@/components/lobby/solo-lobby-countdown";
import { getRoleTutorialContent } from "@/lib/role-tutorial";

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
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useSessionSnapshot(sessionId);
  const setReady = useSetReady(sessionId);
  const leave = useLeaveRoom(sessionId);
  const host = useHostControl(sessionId);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [roleChangeNotice, setRoleChangeNotice] = useState<RoleChangeNotice | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);
  const [startCountdown, setStartCountdown] = useState<number | null>(null);
  const autoOpened = useRef(false);
  const selfIdRef = useRef<string | undefined>(undefined);
  const lastNotifiedKeyRef = useRef<string | null>(null);
  const wizardRef = useRef<HTMLDivElement>(null);
  const autoStartTriggeredRef = useRef(false);

  const notifyRoleChange = useCallback((notice: RoleChangeNotice) => {
    const key = `${notice.previousRole ?? "null"}->${notice.newRole ?? "null"}`;
    if (lastNotifiedKeyRef.current === key) return;
    lastNotifiedKeyRef.current = key;
    setRoleChangeNotice(notice);
  }, []);

  const handleStreamEvent = useCallback(
    (event: GameEvent) => {
      if (event.type !== "participant:role_set" || !event.data) return;
      const selfId = selfIdRef.current;
      if (!selfId) return;

      const snap = queryClient.getQueryData<SessionSnapshot>(["session", sessionId]);
      const selfP = snap?.participants.find((p) => p.id === selfId);
      const prevRole = selfP?.role ?? null;

      const d = event.data as {
        participantId?: string;
        role?: Role | null;
        participantAId?: string;
        participantBId?: string;
      };

      if (d.participantId === selfId) {
        notifyRoleChange({ previousRole: prevRole, newRole: d.role ?? null });
        return;
      }

      if (d.participantAId && d.participantBId) {
        if (selfId !== d.participantAId && selfId !== d.participantBId) return;
        const a = snap?.participants.find((p) => p.id === d.participantAId);
        const b = snap?.participants.find((p) => p.id === d.participantBId);
        if (!a || !b) return;
        const newRole = selfId === d.participantAId ? b.role : a.role;
        notifyRoleChange({ previousRole: prevRole, newRole: newRole ?? null });
      }
    },
    [queryClient, sessionId, notifyRoleChange],
  );

  useSessionStream(sessionId, {
    enabled: !!data,
    onEvent: handleStreamEvent,
  });

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

  const self = data?.participants.find((p) => p.isSelf);
  const selfRole = self?.role ?? null;
  const selfRoleForHook = data && data.status === "LOBBY" ? selfRole : undefined;

  useEffect(() => {
    selfIdRef.current = self?.id;
  }, [self?.id]);

  useSelfRoleChange(selfRoleForHook, notifyRoleChange);

  useEffect(() => {
    if (roleChangeNotice || !data?.guidanceEnabled || !selfRole || autoOpened.current) {
      return;
    }
    if (!isRoleTutorialSkipped(selfRole)) {
      autoOpened.current = true;
      setTutorialOpen(true);
    }
  }, [data?.guidanceEnabled, selfRole, roleChangeNotice]);

  useEffect(() => {
    if (!tutorialOpen) return;
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    if (!isMobile) return;
    const frame = requestAnimationFrame(() => {
      wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [tutorialOpen]);

  const autoStartArmed =
    !!data && data.status === "LOBBY" && data.isHost && !data.autoHost
      ? computeLobbyReadiness(data).canStart
      : false;

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
    host.mutate("start");
  }, [startCountdown, host]);

  if (!mounted || isLoading || (!data && !isError)) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <p className="p-8 text-muted-foreground">Đang tải phòng…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <p className="p-8 text-muted-foreground">Không thể truy cập phòng này.</p>
      </div>
    );
  }

  const isHost = data.isHost;
  const humans = data.participants.filter((p) => !p.isBot);
  const readiness = computeLobbyReadiness(data);
  const minHumans = lobbyMinHumans(data.autoHost);
  const showSoloCountdown =
    humans.length <= 1 && data.lobbySoloSince && data.status === "LOBBY";
  const tutorialContent = selfRole ? getRoleTutorialContent(selfRole) : null;

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
                participants={data.participants}
                readyCount={readiness.readyCount}
                humanCount={readiness.humanCount}
                headerExtra={<LobbyRefreshButton sessionId={sessionId} />}
              />
            </div>

            <div className="col-span-7 flex flex-col gap-4 lg:col-span-2">
              <HostLobbyChecklist
                items={readiness.checklist}
                completedCount={readiness.completedCount}
                totalCount={readiness.totalCount}
                roles={readiness.roleDistribution}
              />
            </div>
          </div>

          {isHost && !data.autoAssignRoles ? (
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

          {tutorialOpen && selfRole ? (
            <div ref={wizardRef} className="scroll-mt-20">
              <RoleTutorialWizard role={selfRole} onClose={() => setTutorialOpen(false)} />
            </div>
          ) : null}

          {selfRole && tutorialContent ? (
            <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <h3 className="text-sm font-semibold">Hướng dẫn vai trò</h3>
              <div className="mt-4">
                <RoleTutorialCallouts
                  className="lg:grid lg:grid-cols-3 lg:gap-4"
                  theoryCallout={tutorialContent.theoryCallout}
                  goalCallout={tutorialContent.goalCallout(data.totalRounds)}
                  actions={tutorialContent.actions}
                />
              </div>
            </section>
          ) : null}
        </main>

        <LobbyReadyBar
          statusText={statusText}
          selfReady={self?.ready ?? false}
          readyPending={setReady.isPending}
          isParticipant={!!self}
          onSetReady={(ready) => setReady.mutate(ready)}
          showAutoStart={isHost && !data.autoHost}
          startCountdown={startCountdown}
          isHost={isHost}
          onLeave={() => leave.mutate()}
          leavePending={leave.isPending}
        />
      </div>

      {roleChangeNotice ? (
        <RoleChangeAlert
          notice={roleChangeNotice}
          onDismiss={() => setRoleChangeNotice(null)}
          onOpenTutorial={
            data.guidanceEnabled && roleChangeNotice.newRole
              ? () => setTutorialOpen(true)
              : undefined
          }
        />
      ) : null}
    </SessionGuidanceScope>
  );
}
