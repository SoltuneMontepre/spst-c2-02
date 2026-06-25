"use client";

import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useCommand } from "@/hooks/use-command";
import { useState } from "react";
import { GameSessionLayout } from "@/components/session/game-session-layout";
import { ZonePhaseGate } from "@/components/session/zone-phase-gate";
import { RoleKpiRow } from "@/components/session/role-kpi-row";
import {
  MarketListingCard,
  MarketplaceFilters,
  filterListings,
  type MarketplaceFilter,
} from "./market-listing-card";
import { OffersPanel } from "./offers-panel";
import { formatThousandDong } from "@/lib/money";
import { PHASE_LABELS } from "@/lib/labels";
import type { ConsumerRoundState } from "@/lib/role-state";
import { Card } from "@/components/ui/card";

export function ConsumerMarket({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  const command = useCommand(sessionId, data?.stateVersion);
  const [filter, setFilter] = useState<MarketplaceFilter>("all");
  const [offerPrices, setOfferPrices] = useState<Record<string, number>>({});
  if (!data?.self) return <p className="p-6 text-muted-foreground">Đang tải…</p>;

  const state = data.self.roleState as ConsumerRoundState | null;
  const listings = filterListings(data.market?.listings ?? [], filter);
  const open = data.phase === "MARKET_OPEN";
  const role = data.self.role;
  const phaseLabel = data.phase ? PHASE_LABELS[data.phase] : "";
  const unitValue = data.liveRoundStats?.unitValueVnd;
  const needTarget = state?.needTarget ?? 0;
  const fulfilled = state?.fulfilledUnits ?? 0;

  const rightPanel = (
    <>
      <Card className="p-4">
        <p className="text-sm font-semibold">Người tiêu dùng</p>
        <p className="mt-2 text-2xl font-bold">
          {data.self.balanceVnd != null
            ? formatThousandDong(data.self.balanceVnd)
            : "—"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Nhu cầu: {fulfilled}/{needTarget} thùng
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{
              width: needTarget > 0 ? `${(fulfilled / needTarget) * 100}%` : "0%",
            }}
          />
        </div>
      </Card>
      <Card className="border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
        <p className="text-xs font-bold uppercase">Giá niêm yết ≠ Giá TT</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Giá niêm yết chỉ là đề xuất — chỉ giao dịch thực tế mới xác lập giá thị trường.
        </p>
      </Card>
    </>
  );

  const marketContent = !open ? (
    <p className="rounded-xl bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
      Danh sách quầy sẽ hiện khi giai đoạn «Chợ mở».
    </p>
  ) : listings.length === 0 ? (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm">
      <p className="font-medium text-foreground">Chưa có quầy niêm yết</p>
      <p className="mt-2 text-muted-foreground">
        Nhà sản xuất và trung gian đang đưa hàng lên chợ.
      </p>
    </div>
  ) : (
    <>
      <MarketplaceFilters value={filter} onChange={setFilter} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {listings.map((l) => {
          const affordable = (data.self?.balanceVnd ?? 0) >= l.askPriceVnd;
          const defaultOffer = Math.max(1000, l.askPriceVnd - 2000);
          return (
            <MarketListingCard
              key={l.id}
              listing={l}
              unitValueVnd={unitValue}
              affordable={affordable}
              pending={command.isPending}
              offerPrice={offerPrices[l.id] ?? defaultOffer}
              onOfferPriceChange={(price) =>
                setOfferPrices((prev) => ({ ...prev, [l.id]: price }))
              }
              onBuy={() =>
                command.mutate({ action: "buy", listingId: l.id, quantity: 1 })
              }
              onOffer={() =>
                command.mutate({
                  action: "offer",
                  listingId: l.id,
                  quantity: 1,
                  offerPriceVnd: offerPrices[l.id] ?? defaultOffer,
                })
              }
            />
          );
        })}
      </div>
    </>
  );

  return (
    <GameSessionLayout
      sessionId={sessionId}
      activeZone="market"
      title="Nhiệm vụ — Người tiêu dùng"
      subtitle={`Vòng ${data.currentRound} · ${phaseLabel}`}
      rightPanel={rightPanel}
    >
      <ZonePhaseGate
        sessionId={sessionId}
        activeZone="market"
        role={role}
        phase={data.phase}
        round={data.currentRound}
      >
        <div className="flex flex-col gap-4">
          <RoleKpiRow
            items={[
              {
                label: "Ví",
                value:
                  data.self.balanceVnd != null
                    ? formatThousandDong(data.self.balanceVnd)
                    : "—",
                hint: "Số dư hiện tại",
              },
              {
                label: "Nhu cầu mua",
                value: `${fulfilled}/${needTarget} thùng`,
                hint:
                  fulfilled < needTarget
                    ? `Cần mua thêm ${needTarget - fulfilled} thùng`
                    : "Đã đủ nhu cầu",
              },
              {
                label: "Giá TT tham chiếu",
                value: unitValue != null ? formatThousandDong(unitValue) : "—",
                hint: "Mỏ neo giá trị",
              },
            ]}
          />

          <Card className="border-amber-200/80 bg-amber-50/80 p-3 text-sm dark:border-amber-900/40 dark:bg-amber-950/30">
            Giá niêm yết chưa phải giá thị trường — chỉ giao dịch thực tế mới xác lập
            giá TT.
          </Card>

          {marketContent}

          {open ? (
            <OffersPanel
              sessionId={sessionId}
              stateVersion={data.stateVersion}
              incoming={data.self.incomingOffers}
              outgoing={data.self.outgoingOffers}
            />
          ) : null}
        </div>
      </ZonePhaseGate>
    </GameSessionLayout>
  );
}
