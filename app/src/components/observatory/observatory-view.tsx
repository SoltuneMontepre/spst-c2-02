"use client";

import { useSessionSnapshot } from "@/hooks/use-session-room";
import { GameBentoShell } from "@/components/session/game-bento-shell";
import { PriceValueChart } from "./price-value-chart";
import { ChartLegend } from "./chart-legend";
import { SupplyDemandMeter } from "@/components/learning/supply-demand-meter";
import { ValueShiftAnimation } from "@/components/learning/value-shift-animation";
import { formatThousandDong } from "@/lib/money";
import { ROUND_NAMES } from "@/lib/labels";
import type { RoundAnalytics } from "@/lib/session-service";

function trend(r: RoundAnalytics): string {
  if (r.marketPriceVnd === null) return "Không hình thành giá";
  if (r.marketPriceVnd > r.unitValueVnd) return "Giá cao hơn giá trị";
  if (r.marketPriceVnd < r.unitValueVnd) return "Giá thấp hơn giá trị";
  return "Giá xấp xỉ giá trị";
}

export function ObservatoryView({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  if (!data) return <p className="p-6 text-muted-foreground">Đang tải…</p>;

  const live = data.analytics[data.analytics.length - 1];

  return (
    <GameBentoShell
      sessionId={sessionId}
      activeZone="observatory"
      guidanceContext={{ screen: "observatory", round: data.currentRound }}
    >
      <div className="flex flex-col gap-4">
        {live ? (
          <SupplyDemandMeter
            embedded
            supply={live.supplyQuantity}
            demand={live.demandQuantity}
            theoryTrend={
              data.currentRound === 2 ? "down" : data.currentRound === 3 ? "up" : "neutral"
            }
          />
        ) : null}
        <PriceValueChart rounds={data.analytics} />
        <ChartLegend />

        {data.currentRound === 4 && data.phase === "EVENT" ? (
          <ValueShiftAnimation active />
        ) : null}

        {data.analytics.map((r) => (
          <div
            key={r.number}
            className="rounded-xl border border-border bg-muted/10 p-4 text-sm"
          >
            <span className="font-semibold">
              Vòng {r.number} · {ROUND_NAMES[r.number]}
            </span>
            <dl className="mt-2 space-y-1">
              <Row label="Giá trị xã hội" value={formatThousandDong(r.unitValueVnd)} />
              <Row
                label="Giá thị trường"
                value={
                  r.marketPriceVnd === null
                    ? "Chưa hình thành"
                    : formatThousandDong(r.marketPriceVnd)
                }
              />
              <Row label="Cung / Cầu" value={`${r.supplyQuantity} / ${r.demandQuantity}`} />
              <Row
                label="Đã bán lẻ / Hỏng"
                value={`${r.retailSoldQuantity} / ${r.spoiledQuantity}`}
              />
            </dl>
            {r.spoiledQuantity > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Lao động cá biệt chưa được thị trường thừa nhận ({r.spoiledQuantity} thùng).
              </p>
            ) : null}
            <span className="mt-2 block text-xs font-medium text-primary">{trend(r)}</span>
          </div>
        ))}
      </div>
    </GameBentoShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
