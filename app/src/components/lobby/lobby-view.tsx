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
import { ApiClientError } from "@/hooks/use-api";
import { LobbyShell } from "@/components/lobby/lobby-shell";
import { PlayerLobbyScreen } from "@/components/lobby/player-lobby-screen";
import { RoleTutorialWizard } from "@/components/lobby/role-tutorial-wizard";
import { SessionGuidanceScope } from "@/components/learning/session-guidance-scope";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { isRoleTutorialSkipped } from "@/lib/role-tutorial";

export function LobbyView({
  sessionId,
}: {
  sessionId: string;
  displayName: string;
}) {
  const router = useRouter();
  const { data, isLoading, isError, error } = useSessionSnapshot(sessionId);
  useSessionStream(sessionId, { enabled: !!data });
  const setReady = useSetReady(sessionId);
  const leave = useLeaveRoom(sessionId);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const autoOpened = useRef(false);

  useSessionCancelledRedirect(data?.status, "solo_timeout");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!data || data.status !== "LOBBY") return;
    if (data.isHost) {
      router.replace(`/host/session/${sessionId}`);
      return;
    }
  }, [data, router, sessionId]);

  useEffect(() => {
    if (!isError || !(error instanceof ApiClientError) || error.status !== 403) return;
    router.replace("/home");
  }, [isError, error, router]);

  useEffect(() => {
    if (!data || data.status === "LOBBY" || data.status === "CANCELLED") return;
    if (["COMPLETED", "INCOMPLETE"].includes(data.status)) {
      router.replace(`/session/${sessionId}/debrief`);
    } else {
      router.replace(
        data.isHost && !data.autoHost
          ? `/host/session/${sessionId}`
          : `/session/${sessionId}/map`,
      );
    }
  }, [data, router, sessionId]);

  const self = data?.participants.find((p) => p.isSelf);
  const selfRole = self?.role ?? null;

  useEffect(() => {
    if (!data?.guidanceEnabled || !selfRole || autoOpened.current) return;
    if (!isRoleTutorialSkipped(selfRole)) {
      autoOpened.current = true;
      setTutorialOpen(true);
    }
  }, [data?.guidanceEnabled, selfRole]);

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

  if (data.isHost) {
    return (
      <div className="flex min-h-full flex-col bg-background">
        <p className="p-8 text-muted-foreground">Đang chuyển tới bảng host…</p>
      </div>
    );
  }

  const lobbySubtitle = "Đang chờ host bắt đầu…";
  const tutorialSubtitle = selfRole
    ? `${ROLE_LABELS[selfRole]} · 3 bước`
    : lobbySubtitle;

  const handleLeave = () => leave.mutate();

  return (
    <SessionGuidanceScope guidanceEnabled={data.guidanceEnabled}>
      <LobbyShell
        mode={tutorialOpen && selfRole ? "tutorial" : "lobby"}
        sessionCode={data.code}
        subtitle={tutorialOpen && selfRole ? tutorialSubtitle : lobbySubtitle}
        onLeave={handleLeave}
        leavePending={leave.isPending}
      >
        {tutorialOpen && selfRole ? (
          <RoleTutorialWizard
            role={selfRole}
            totalRounds={data.totalRounds}
            onClose={() => setTutorialOpen(false)}
          />
        ) : (
          <PlayerLobbyScreen
            data={data}
            readyPending={setReady.isPending}
            onSetReady={(ready) => setReady.mutate(ready)}
            onOpenTutorial={() => {
              if (selfRole) setTutorialOpen(true);
            }}
          />
        )}
      </LobbyShell>
    </SessionGuidanceScope>
  );
}
