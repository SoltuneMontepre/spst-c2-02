"use client";

import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useSessionStream } from "@/hooks/use-session-stream";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackToMap } from "@/components/session/back-to-map";
import { PriceValueChart } from "./price-value-chart";
import { SupplyDemandMeter } from "@/components/learning/supply-demand-meter";
import { ValueShiftAnimation } from "@/components/learning/value-shift-animation";
import { GameGuidance } from "@/components/learning/game-guidance";
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
  useSessionStream(sessionId);
  const { data } = useSessionSnapshot(sessionId);
  if (!data) return <p className="p-6 text-muted-foreground">Đang tải…</p>;

  const live = data.analytics[data.analytics.length - 1];

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
      <BackToMap sessionId={sessionId} />
      <GameGuidance context={{ screen: "observatory", round: data.currentRound }} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tháp quan sát</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <PriceValueChart rounds={data.analytics} />
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4 bg-[var(--value)]" /> Giá trị xã hội
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4 bg-[var(--price)]" /> Giá thị trường
            </span>
          </div>
        </CardContent>
      </Card>

      {data.currentRound === 4 && data.phase === "EVENT" ? (
        <ValueShiftAnimation active />
      ) : null}

      {live ? (
        <SupplyDemandMeter
          supply={live.supplyQuantity}
          demand={live.demandQuantity}
          theoryTrend={
            data.currentRound === 2 ? "down" : data.currentRound === 3 ? "up" : "neutral"
          }
        />
      ) : null}

      {data.analytics.map((r) => (
        <Card key={r.number}>
          <CardContent className="flex flex-col gap-1 p-4 text-sm">
            <span className="font-semibold">
              Vòng {r.number} · {ROUND_NAMES[r.number]}
            </span>
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
            <Row label="Đã bán lẻ / Hỏng" value={`${r.retailSoldQuantity} / ${r.spoiledQuantity}`} />
            {r.spoiledQuantity > 0 ? (
              <p className="text-xs text-muted-foreground">
                Lao động cá biệt chưa được thị trường thừa nhận ({r.spoiledQuantity} thùng).
              </p>
            ) : null}
            <span className="mt-1 text-xs font-medium text-primary">{trend(r)}</span>
          </CardContent>
        </Card>
      ))}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
