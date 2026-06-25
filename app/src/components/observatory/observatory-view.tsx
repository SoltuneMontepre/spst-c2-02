"use client";

import Link from "next/link";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { GameSessionLayout } from "@/components/session/game-session-layout";
import { MarketSnapshotPanel } from "@/components/session/market-snapshot-panel";
import { PriceValueChart } from "./price-value-chart";
import { ChartLegend } from "./chart-legend";
import { SupplyDemandMeter } from "@/components/learning/supply-demand-meter";
import { ValueShiftAnimation } from "@/components/learning/value-shift-animation";
import { formatThousandDong } from "@/lib/money";
import { PHASE_LABELS } from "@/lib/labels";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ObservatoryView({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  if (!data) return <p className="p-6 text-muted-foreground">Đang tải…</p>;

  const live = data.liveRoundStats ?? data.analytics[data.analytics.length - 1];
  const phaseLabel = data.phase ? PHASE_LABELS[data.phase] : "";
  const isRoundLive =
    ["ROUND_1", "ROUND_2", "ROUND_3", "ROUND_4"].includes(data.status) &&
    data.phase != null &&
    !["RECAP", "SETTLEMENT"].includes(data.phase);
  const txCount = data.recentTransactions.length;
  const avgPrice =
    txCount > 0
      ? Math.round(
          data.recentTransactions.reduce((s, t) => s + t.unitPriceVnd * t.quantity, 0) /
            data.recentTransactions.reduce((s, t) => s + t.quantity, 0),
        )
      : null;

  const rightPanel = (
    <>
      <Card className="border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
        <p className="text-xs font-bold uppercase">Giá trị = Mỏ neo</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Giá TT dao động quanh giá trị xã hội — không thay đổi khi cung-cầu biến động.
        </p>
      </Card>
      <Card className="p-4">
        <p className="text-sm font-semibold">Tóm tắt vòng {data.currentRound}</p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Giao dịch</dt>
            <dd className="font-medium">{txCount}</dd>
          </div>
          {live && "expectedInventory" in live ? (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tồn dự kiến</dt>
              <dd className="font-medium">{live.expectedInventory} thùng</dd>
            </div>
          ) : null}
          {avgPrice != null ? (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Giá TB giao dịch</dt>
              <dd className="font-medium">{formatThousandDong(avgPrice)}</dd>
            </div>
          ) : null}
        </dl>
      </Card>
      <Link
        href={`/session/${sessionId}/map`}
        className={cn(buttonVariants({ size: "lg" }), "w-full")}
      >
        Xem tổng kết →
      </Link>
    </>
  );

  return (
    <GameSessionLayout
      sessionId={sessionId}
      activeZone="observatory"
      title="Quan sát thị trường"
      subtitle={
        <span className="inline-flex items-center gap-2">
          Vòng {data.currentRound} · {phaseLabel}
          {isRoundLive ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
              Đang diễn ra
            </span>
          ) : null}
        </span>
      }
      rightPanel={rightPanel}
    >
      <div className="flex flex-col gap-4">
        <Card className="p-4">
          <p className="mb-3 text-sm font-semibold">Giá trị vs Giá thị trường</p>
          <PriceValueChart rounds={data.analytics} liveStats={data.liveRoundStats} />
          <ChartLegend />
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          {live ? (
            <Card className="p-4">
              <p className="mb-3 text-xs font-bold uppercase text-muted-foreground">
                Trạng thái cung-cầu
              </p>
              <SupplyDemandMeter
                embedded
                supply={live.supplyQuantity}
                demand={live.demandQuantity}
                theoryTrend={
                  data.currentRound === 2 ? "down" : data.currentRound === 3 ? "up" : "neutral"
                }
              />
            </Card>
          ) : null}

          <Card className="p-4">
            <p className="mb-3 text-xs font-bold uppercase text-muted-foreground">
              Giao dịch đã xác lập
            </p>
            {data.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có giao dịch.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.recentTransactions.slice(0, 6).map((tx) => (
                  <li key={tx.id} className="flex justify-between gap-2">
                    <span className="truncate text-muted-foreground">
                      {tx.counterpartyName}
                    </span>
                    <span className="shrink-0 font-medium text-primary">
                      {tx.quantity}t × {formatThousandDong(tx.unitPriceVnd)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <MarketSnapshotPanel stats={data.liveRoundStats} />
        </div>

        {data.currentRound === 4 && data.phase === "EVENT" ? (
          <ValueShiftAnimation active />
        ) : null}
      </div>
    </GameSessionLayout>
  );
}
