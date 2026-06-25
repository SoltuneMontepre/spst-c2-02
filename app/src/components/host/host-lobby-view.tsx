"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { useSessionSnapshot, useSetReady } from "@/hooks/use-session-room";
import { useSessionStream } from "@/hooks/use-session-stream";
import { useHostControl } from "@/hooks/use-host-control";
import { HostLobbyHeader } from "@/components/host/host-lobby-header";
import { HostLobbyRoster } from "@/components/host/host-lobby-roster";
import { HostLobbyChecklist } from "@/components/host/host-lobby-checklist";
import { HostRoleDistribution } from "@/components/host/host-role-distribution";
import { HostTeacherTips } from "@/components/host/host-teacher-tips";
import { CreateRoomShareCard } from "@/components/create-room/create-room-share-card";
import { LobbySetup } from "@/components/lobby/lobby-setup";
import { Button } from "@/components/ui/button";
import { computeLobbyReadiness } from "@/lib/lobby-readiness";
import { lobbyMinHumans } from "@/components/lobby/lobby-controls";

export function HostLobbyView({
  sessionId,
}: {
  sessionId: string;
  displayName: string;
}) {
  const router = useRouter();
  useSessionStream(sessionId);
  const { data, isLoading } = useSessionSnapshot(sessionId);
  const host = useHostControl(sessionId);
  const setReady = useSetReady(sessionId);

  useEffect(() => {
    if (!data || data.status === "LOBBY") return;
    if (["CANCELLED", "COMPLETED", "INCOMPLETE"].includes(data.status)) {
      router.replace(`/session/${sessionId}/debrief`);
    } else {
      router.replace(`/host/session/${sessionId}`);
    }
  }, [data, router, sessionId]);

  if (isLoading || !data) {
    return <p className="p-8 text-muted-foreground">Đang tải bảng điều khiển…</p>;
  }

  const humans = data.participants.filter((p) => !p.isBot);
  const self = data.participants.find((p) => p.isSelf);
  const readiness = computeLobbyReadiness(data);
  const minHumans = lobbyMinHumans(data.autoHost);
  return (
    <div className="flex min-h-full flex-col bg-background">
      <HostLobbyHeader
        code={data.code}
        subtitle="Đang chờ người chơi tham gia"
      />
      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-4 p-4 pb-8 lg:grid-cols-[240px_1fr_280px] lg:items-start">
        <div className="min-h-[420px] lg:sticky lg:top-20 lg:self-start">
          <HostLobbyRoster
            participants={data.participants}
            readyCount={readiness.readyCount}
            humanCount={readiness.humanCount}
          />
        </div>

        <div className="flex flex-col gap-4">
          <CreateRoomShareCard code={data.code} />
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
          <Button
            size="lg"
            className="w-full gap-2"
            disabled={!readiness.canStart || host.isPending}
            onClick={() => host.mutate("start")}
          >
            <Play className="size-4" aria-hidden />
            Bắt đầu phiên chợ
          </Button>
          {!readiness.canStart && humans.length < minHumans ? (
            <p className="text-center text-xs text-muted-foreground">
              Cần ít nhất {minHumans} người chơi để bắt đầu.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <HostLobbyChecklist
            items={readiness.checklist}
            completedCount={readiness.completedCount}
            totalCount={readiness.totalCount}
          />
          <HostRoleDistribution roles={readiness.roleDistribution} />
          {!data.autoAssignRoles ? (
            <div className="rounded-2xl border border-border bg-surface p-4">
              <h3 className="mb-3 text-sm font-semibold">Gán vai thủ công</h3>
              <LobbySetup
                participants={data.participants}
                humanCount={humans.length}
                pending={host.isPending}
                onAction={(action) => host.mutate(action)}
              />
            </div>
          ) : null}
          <HostTeacherTips />
        </div>
      </main>
    </div>
  );
}
