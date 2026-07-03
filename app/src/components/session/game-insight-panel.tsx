"use client";

import type { LiveRoundStats, MarketActivityView } from "@/lib/session-service";
import { EventPanel, InsightSectionLabel } from "@/components/session/event-panel";
import { MapPresenceLegend } from "@/components/session/map-zones";
import { MarketActivityFeed } from "@/components/session/market-activity-feed";
import { MarketSnapshotPanel } from "@/components/session/market-snapshot-panel";

export function GameInsightPanel({
  round,
  stats,
  activity,
}: {
  round: number;
  stats: LiveRoundStats | null;
  activity: MarketActivityView[];
}) {
  return (
    <div className="flex h-full flex-col gap-2.5 overflow-y-auto px-[15px] py-3.5">
      <InsightSectionLabel>Biến cố · Vòng {round}</InsightSectionLabel>
      <EventPanel round={round} variant="insight" />

      <InsightSectionLabel>Snapshot thị trường</InsightSectionLabel>
      <MarketSnapshotPanel stats={stats} variant="insight" />

      <InsightSectionLabel>Diễn biến chợ</InsightSectionLabel>
      <MarketActivityFeed activity={activity} variant="insight" />

      <MapPresenceLegend />
    </div>
  );
}
