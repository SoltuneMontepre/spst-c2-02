"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useSessionStream } from "@/hooks/use-session-stream";
import { useHostControl } from "@/hooks/use-host-control";
import { SessionNav } from "@/components/session/session-nav";
import { BentoTile } from "@/components/ui/bento-tile";
import { PhaseBanner } from "@/components/session/phase-banner";
import { HostLobbyView } from "@/components/host/host-lobby-view";
import { HostRoster } from "@/components/host/host-roster";
import { HostControls } from "./host-controls";
import { PriceValueChart } from "@/components/observatory/price-value-chart";
import { SupplyDemandMeter } from "@/components/learning/supply-demand-meter";
import { ChartLegend } from "@/components/observatory/chart-legend";
import { STATUS_LABELS, PHASE_LABELS } from "@/lib/labels";

const ENDED = ["COMPLETED", "INCOMPLETE", "CANCELLED"];

function SessionStats({
  status,
  currentRound,
  totalRounds,
  readyCount,
  humanCount,
}: {
  status: string;
  currentRound: number;
  totalRounds: number;
  readyCount: number;
  humanCount: number;
}) {
  return (
    <dl className="grid grid-cols-2 gap-2 text-sm">
      <div className="rounded-lg bg-muted/30 px-3 py-2">
        <dt className="text-xs text-muted-foreground">Phiên</dt>
        <dd className="mt-0.5 truncate font-semibold">
          {STATUS_LABELS[status] ?? status}
        </dd>
      </div>
      <div className="rounded-lg bg-muted/30 px-3 py-2">
        <dt className="text-xs text-muted-foreground">Vòng</dt>
        <dd className="mt-0.5 font-mono font-semibold tabular-nums">
          {currentRound > 0 ? `${currentRound}/${totalRounds}` : "—"}
        </dd>
      </div>
      <div className="col-span-2 rounded-lg bg-muted/30 px-3 py-2">
        <dt className="text-xs text-muted-foreground">Người sẵn sàng</dt>
        <dd className="mt-0.5 font-mono font-semibold tabular-nums">
          {readyCount}/{humanCount}
        </dd>
      </div>
    </dl>
  );
}

export function HostControl({
  sessionId,
  displayName,
}: {
  sessionId: string;
  displayName: string;
}) {
  const router = useRouter();
  useSessionStream(sessionId);
  const { data, isLoading } = useSessionSnapshot(sessionId);
  const host = useHostControl(sessionId);

  useEffect(() => {
    if (!data) return;
    if (ENDED.includes(data.status)) router.replace(`/session/${sessionId}/debrief`);
  }, [data, router, sessionId]);

  if (isLoading || !data) {
    return (
      <div className="flex min-h-full flex-col">
        <SessionNav displayName={displayName} sessionLabel="Điều phối" />
        <p className="p-8 text-muted-foreground">Đang tải bảng điều khiển…</p>
      </div>
    );
  }

  if (data.status === "LOBBY") {
    return <HostLobbyView sessionId={sessionId} displayName={displayName} />;
  }

  const latest = data.analytics[data.analytics.length - 1];
  const humans = data.participants.filter((p) => !p.isBot);
  const readyCount = humans.filter((p) => p.ready).length;
  const phaseLabel =
    data.phase && data.currentRound > 0
      ? `Vòng ${data.currentRound} · ${PHASE_LABELS[data.phase] ?? data.phase}`
      : STATUS_LABELS[data.status] ?? data.status;

  return (
    <div className="flex min-h-full flex-col bg-background">
      <SessionNav
        displayName={displayName}
        sessionLabel="Điều phối phiên"
        sessionCode={data.code}
      />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bảng điều phối</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Chế độ projector · {data.autoHost ? "AI điều phối" : "Host thủ công"}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{phaseLabel}</p>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <BentoTile
            colSpan="col-span-12 lg:col-span-4 lg:row-span-2 lg:row-start-1 lg:col-start-1"
            title="Người chơi"
            description={`${data.participants.length} trong phòng`}
            className="lg:min-h-[min(520px,72vh)]"
          >
            <HostRoster participants={data.participants} />
          </BentoTile>

          <BentoTile
            colSpan="col-span-12 lg:col-span-5 lg:row-start-1 lg:col-start-5"
            title="Giai đoạn"
            description={phaseLabel}
            className="min-h-[148px]"
          >
            {data.currentRound > 0 ? (
              <PhaseBanner
                round={data.currentRound}
                phase={data.phase}
                phaseEndsAt={data.phaseEndsAt}
                paused={data.paused}
                aiNarration={data.aiNarration}
                autoHost={data.autoHost}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Chờ bắt đầu vòng 1…</p>
            )}
          </BentoTile>

          <BentoTile
            colSpan="col-span-12 lg:col-span-3 lg:row-span-2 lg:row-start-1 lg:col-start-10"
            title="Điều khiển"
            description={data.autoHost ? "AI đang điều phối" : "Host thủ công"}
            className="lg:sticky lg:top-20 lg:min-h-[280px]"
          >
            <div className="flex h-full flex-col gap-4">
              <SessionStats
                status={data.status}
                currentRound={data.currentRound}
                totalRounds={data.totalRounds}
                readyCount={readyCount}
                humanCount={humans.length}
              />
              <HostControls
                status={data.status}
                phase={data.phase}
                paused={data.paused}
                pending={host.isPending}
                autoHost={data.autoHost}
                onAction={(action) => host.mutate(action)}
              />
            </div>
          </BentoTile>

          <BentoTile
            colSpan="col-span-12 lg:col-span-4 lg:row-start-2 lg:col-start-5"
            title="Giá – Giá trị"
            description="Tháp quan sát"
            className="min-h-[260px]"
          >
            <PriceValueChart rounds={data.analytics} />
            <ChartLegend className="mt-3" />
          </BentoTile>

          <BentoTile
            colSpan="col-span-12 lg:col-span-4 lg:row-start-2 lg:col-start-9"
            title="Cung – Cầu"
            description={latest ? `Vòng ${latest.number}` : "Chưa có dữ liệu"}
            className="min-h-[260px]"
          >
            {latest ? (
              <SupplyDemandMeter
                embedded
                supply={latest.supplyQuantity}
                demand={latest.demandQuantity}
                theoryTrend={
                  data.currentRound === 2
                    ? "down"
                    : data.currentRound === 3
                      ? "up"
                      : "neutral"
                }
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Biểu đồ cung-cầu xuất hiện sau vòng 1.
              </p>
            )}
          </BentoTile>
        </div>
      </div>
    </div>
  );
}
