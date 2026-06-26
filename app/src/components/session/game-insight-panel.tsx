"use client";

import type { LiveRoundStats } from "@/lib/session-service";
import { EventPanel, InsightSectionLabel } from "@/components/session/event-panel";
import { MarketSnapshotPanel } from "@/components/session/market-snapshot-panel";

export function GameInsightPanel({
  round,
  stats,
}: {
  round: number;
  stats: LiveRoundStats | null;
}) {
  return (
    <div className="flex h-full flex-col gap-2.5 overflow-y-auto px-[15px] py-3.5">
      <InsightSectionLabel>Biến cố · Vòng {round}</InsightSectionLabel>
      <EventPanel round={round} variant="insight" />

      <InsightSectionLabel>Snapshot thị trường</InsightSectionLabel>
      <MarketSnapshotPanel stats={stats} variant="insight" />
    </div>
  );
}
