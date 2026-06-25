"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useSessionSnapshot,
  useSetReady,
  useLeaveRoom,
} from "@/hooks/use-session-room";
import { useSessionStream } from "@/hooks/use-session-stream";
import { useHostControl } from "@/hooks/use-host-control";
import { SessionNav } from "@/components/session/session-nav";
import { BentoTile } from "@/components/ui/bento-tile";
import { LobbyCode } from "./lobby-code";
import { LobbyRoster } from "./lobby-roster";
import { LobbySetup } from "./lobby-setup";
import { LobbyControls, lobbyMinHumans } from "./lobby-controls";
import { GuidancePanel } from "@/components/learning/guidance-panel";
import { getGuidance } from "@/lib/game-guidance";
import { useTutorial } from "@/components/learning/tutorial-provider";
import { SessionGuidanceScope } from "@/components/learning/session-guidance-scope";
import { TutorialToggle } from "@/components/learning/tutorial-toggle";

export function LobbyView({
  sessionId,
  displayName,
}: {
  sessionId: string;
  displayName: string;
}) {
  const router = useRouter();
  useSessionStream(sessionId);
  const { data, isLoading } = useSessionSnapshot(sessionId);
  const setReady = useSetReady(sessionId);
  const leave = useLeaveRoom(sessionId);
  const host = useHostControl(sessionId);
  const { enabled: tutorialOn } = useTutorial();

  useEffect(() => {
    if (!data || data.status !== "LOBBY") return;
    if (data.isHost) {
      router.replace(`/host/session/${sessionId}`);
      return;
    }
  }, [data, router, sessionId]);

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
    return (
      <div className="flex min-h-full flex-col">
        <SessionNav displayName={displayName} sessionLabel="Phòng chờ" />
        <p className="p-8 text-muted-foreground">Đang tải phòng…</p>
      </div>
    );
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
  const minHumans = lobbyMinHumans(data.autoHost);
  const guidance = getGuidance({ screen: "lobby", autoHost: data.autoHost });

  const headerSubtitle = data.isHost
    ? `Bạn là host · ${humans.length}/${data.maxPlayers} người`
    : `Bạn là người chơi · ${humans.length}/${data.maxPlayers} người`;

  const readyDescription = data.isHost
    ? data.autoHost
      ? "Bật AI và báo sẵn sàng để bắt đầu."
      : "Bạn quyết định khi bắt đầu phiên."
    : data.autoHost
      ? "Báo sẵn sàng — AI sẽ tự bắt đầu."
      : "Báo host khi bạn sẵn sàng chơi.";

  return (
    <SessionGuidanceScope guidanceEnabled={data.guidanceEnabled}>
    <div className="flex min-h-full flex-col bg-background">
      <SessionNav
        displayName={displayName}
        sessionLabel="Phòng chờ"
        sessionCode={data.code}
        onLeave={() => leave.mutate()}
        leavePending={leave.isPending}
      />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Phòng chờ</h1>
            <p className="mt-1 text-sm text-muted-foreground">{headerSubtitle}</p>
          </div>
          <TutorialToggle className="sm:hidden" />
        </div>

        <div className="grid grid-cols-12 gap-4 lg:items-start">
          {/* Trái — mời tham gia (+ hướng dẫn nếu bật) */}
          <div className="col-span-12 flex flex-col gap-4 lg:col-span-3 lg:col-start-1 lg:sticky lg:top-20 lg:self-start">
            <BentoTile
              title="Mời tham gia"
              description={
                data.isHost
                  ? "Chia sẻ mã hoặc QR để mời người chơi."
                  : "Mã phòng để mời thêm bạn bè (nếu host cho phép)."
              }
            >
              <LobbyCode code={data.code} />
            </BentoTile>

            {tutorialOn ? (
              <BentoTile title="Hướng dẫn">
                <GuidancePanel content={guidance} />
              </BentoTile>
            ) : null}
          </div>

          {/* Giữa — danh sách / gán vai / bot */}
          <BentoTile
            colSpan="col-span-12 lg:col-span-6 lg:col-start-4"
            title={data.isHost ? "Người chơi & vai trò" : "Danh sách người chơi"}
            description={
              data.isHost
                ? "Gán vai và thêm bot trước khi bắt đầu."
                : "Theo dõi ai đã vào phòng và sẵn sàng."
            }
            className="lg:min-h-[min(520px,72vh)]"
          >
            {data.isHost ? (
              <LobbySetup
                participants={data.participants}
                humanCount={humans.length}
                pending={host.isPending}
                onAction={(action) => host.mutate(action)}
              />
            ) : (
              <div className="max-h-[min(480px,60vh)] overflow-y-auto pr-0.5">
                <LobbyRoster participants={data.participants} />
              </div>
            )}
          </BentoTile>

          {/* Phải — sẵn sàng / điều khiển */}
          <BentoTile
            colSpan="col-span-12 lg:col-span-3 lg:col-start-10"
            title="Sẵn sàng"
            description={readyDescription}
            className="lg:sticky lg:top-20 lg:self-start"
          >
            <LobbyControls
              isHost={data.isHost}
              autoHost={data.autoHost}
              autoHostPending={host.isPending}
              hostPending={host.isPending}
              allReady={allReady}
              manualComplete={manualComplete}
              humanCount={humans.length}
              minHumans={minHumans}
              selfReady={self?.ready ?? false}
              isParticipant={!!self}
              readyPending={setReady.isPending}
              onSetReady={(ready) => setReady.mutate(ready)}
              onSetAutoHost={(enabled) =>
                host.mutate({ action: "setAutoHost", autoHost: enabled })
              }
              onStart={() => host.mutate("start")}
            />
          </BentoTile>
        </div>
      </div>
    </div>
    </SessionGuidanceScope>
  );
}
