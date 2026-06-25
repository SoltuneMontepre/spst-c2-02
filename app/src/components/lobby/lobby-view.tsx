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
import { ApiClientError } from "@/hooks/use-api";
import { LobbyShell } from "@/components/lobby/lobby-shell";
import { PlayerLobbyScreen } from "@/components/lobby/player-lobby-screen";
import { RoleChangeAlert } from "@/components/lobby/role-change-alert";
import { SessionGuidanceScope } from "@/components/learning/session-guidance-scope";
import { isRoleTutorialSkipped } from "@/lib/role-tutorial";
import type { GameEvent } from "@/lib/events";
import type { SessionSnapshot } from "@/lib/session-service";
import { useHostControl } from "@/hooks/use-host-control";
import { OpenProjectorButton } from "@/components/host/projector-mode-toggle";
import { computeLobbyReadiness } from "@/lib/lobby-readiness";
import { lobbyMinHumans } from "@/components/lobby/lobby-controls";
import type { Role } from "@/generated/prisma/enums";

export function LobbyView({
  sessionId,
}: {
  sessionId: string;
  displayName: string;
}) {
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
  const autoOpened = useRef(false);
  const selfIdRef = useRef<string | undefined>(undefined);
  const lastNotifiedKeyRef = useRef<string | null>(null);

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
    if (!data || data.status === "LOBBY" || data.status === "CANCELLED") return;
    if (["COMPLETED", "INCOMPLETE"].includes(data.status)) {
      router.replace(`/session/${sessionId}/debrief`);
    } else {
      router.replace(`/session/${sessionId}/map`);
    }
  }, [data, router, sessionId]);

  const self = data?.participants.find((p) => p.isSelf);
  const selfRole = self?.role ?? null;
  const selfRoleForHook =
    data && data.status === "LOBBY" ? selfRole : undefined;

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

  if (!mounted || isLoading || (!data && !isError)) {
    return (
      <div className="flex min-h-full flex-col bg-background">
        <p className="p-8 text-muted-foreground">Đang tải phòng…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-full flex-col bg-background">
        <p className="p-8 text-muted-foreground">Không thể truy cập phòng này.</p>
      </div>
    );
  }

  const lobbySubtitle = data.isHost
    ? "Chơi như người chơi — dùng «Bảng projector» để điều phối lớp"
    : "Đang chờ host bắt đầu…";

  const readiness = computeLobbyReadiness(data);
  const minHumans = lobbyMinHumans(data.autoHost);

  const handleLeave = () => leave.mutate();

  return (
    <SessionGuidanceScope guidanceEnabled={data.guidanceEnabled}>
      <LobbyShell
        mode="lobby"
        sessionCode={data.code}
        subtitle={lobbySubtitle}
        onLeave={handleLeave}
        leavePending={leave.isPending}
        headerExtra={
          data.isHost ? (
            <>
              <OpenProjectorButton sessionId={sessionId} className="hidden sm:inline-flex" />
              <OpenProjectorButton sessionId={sessionId} className="sm:hidden" size="sm" />
            </>
          ) : null
        }
      >
        <PlayerLobbyScreen
          data={data}
          readyPending={setReady.isPending}
          tutorialOpen={tutorialOpen}
          onSetReady={(ready) => setReady.mutate(ready)}
          onOpenTutorial={() => {
            if (selfRole) setTutorialOpen(true);
          }}
          onCloseTutorial={() => setTutorialOpen(false)}
          hostControls={
            data.isHost
              ? {
                  autoHostPending: host.isPending,
                  hostPending: host.isPending,
                  allReady: readiness.allReady,
                  manualComplete: readiness.manualComplete,
                  humanCount: readiness.humanCount,
                  minHumans,
                  onSetAutoHost: (enabled) =>
                    host.mutate({ action: "setAutoHost", autoHost: enabled }),
                  onStart: () => host.mutate("start"),
                }
              : undefined
          }
        />
      </LobbyShell>
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
