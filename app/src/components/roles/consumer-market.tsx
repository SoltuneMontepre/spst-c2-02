"use client";

import { AlertCircle } from "lucide-react";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useCommand } from "@/hooks/use-command";
import { useState } from "react";
import { ZonePhaseGate } from "@/components/session/zone-phase-gate";
import { RoleKpiRow } from "@/components/session/role-kpi-row";
import { RoleTaskScreen } from "@/components/session/role-task-screen";
import { ConsumerInsightPanel } from "@/components/session/role-insight-panels";
import {
  MarketListingCard,
  MarketplaceFilters,
  filterListings,
  type MarketplaceFilter,
} from "./market-listing-card";
import { MarketTransactionDialog } from "./market-transaction-dialog";
import { OffersPanel } from "./offers-panel";
import { formatThousandDong } from "@/lib/money";
import type { ConsumerRoundState } from "@/lib/role-state";
import type { ListingView } from "@/lib/session-service";

function priceRangeLabel(listings: { askPriceVnd: number }[]): string {
  if (listings.length === 0) return "—";
  const prices = listings.map((l) => l.askPriceVnd);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return `${(min / 1000).toFixed(0)}k–${(max / 1000).toFixed(0)}k`;
}

export function ConsumerMarket({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  const command = useCommand(sessionId, data?.stateVersion);
  const [filter, setFilter] = useState<MarketplaceFilter>("all");
  const [selectedListing, setSelectedListing] = useState<ListingView | null>(
    null,
  );

  if (!data?.self) return <p className="p-6 text-muted-foreground">Đang tải…</p>;

  const state = data.self.roleState as ConsumerRoundState | null;
  const allListings = data.market?.listings ?? [];
  const listings = filterListings(allListings, filter);
  const open = data.phase === "MARKET_OPEN";
  const role = data.self.role;
  const unitValue = data.liveRoundStats?.unitValueVnd;
  const needTarget = state?.needTarget ?? 0;
  const fulfilled = state?.fulfilledUnits ?? 0;

  const marketContent = !open ? (
    <p className="rounded-[14px] bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
      Danh sách quầy sẽ hiện khi giai đoạn «Chợ mở».
    </p>
  ) : listings.length === 0 ? (
    <div className="rounded-[14px] border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm">
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
          return (
            <MarketListingCard
              key={l.id}
              listing={l}
              unitValueVnd={unitValue}
              onClick={() => setSelectedListing(l)}
            />
          );
        })}
      </div>
    </>
  );

  return (
    <RoleTaskScreen
      sessionId={sessionId}
      activeZone="market"
      role="CONSUMER"
      round={data.currentRound}
      phase={data.phase}
      insight={
        <ConsumerInsightPanel
          balanceVnd={data.self.balanceVnd}
          fulfilled={fulfilled}
          needTarget={needTarget}
        />
      }
    >
      <ZonePhaseGate
        sessionId={sessionId}
        activeZone="market"
        role={role}
        phase={data.phase}
        round={data.currentRound}
      >
        <RoleKpiRow
          cols={3}
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
              value:
                allListings.length > 0
                  ? priceRangeLabel(allListings)
                  : unitValue != null
                    ? formatThousandDong(unitValue)
                    : "—",
              hint: "Khoảng giá niêm yết",
            },
          ]}
        />

        <div className="flex items-center gap-2 rounded-[10.5px] border border-[#fee685] bg-[#fffbeb] px-3 py-2.5 text-xs text-[#7b3306]">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          <span>
            Giá niêm yết chưa phải giá thị trường — chỉ giao dịch thực tế mới xác lập
            giá TT.
          </span>
        </div>

        {marketContent}

        {open ? (
          <OffersPanel
            sessionId={sessionId}
            stateVersion={data.stateVersion}
            incoming={data.self.incomingOffers}
            outgoing={data.self.outgoingOffers}
          />
        ) : null}
      </ZonePhaseGate>

      {selectedListing ? (
        <MarketTransactionDialog
          listing={selectedListing}
          unitValueVnd={unitValue}
          affordable={(data.self?.balanceVnd ?? 0) >= selectedListing.askPriceVnd}
          pending={command.isPending}
          balanceVnd={data.self?.balanceVnd ?? 0}
          onBuy={(quantity) => {
            command.mutate({
              action: "buy",
              listingId: selectedListing.id,
              quantity,
            });
            setSelectedListing(null);
          }}
          onOffer={(quantity, offerPriceVnd) => {
            command.mutate({
              action: "offer",
              listingId: selectedListing.id,
              quantity,
              offerPriceVnd,
            });
            setSelectedListing(null);
          }}
          onClose={() => setSelectedListing(null)}
        />
      ) : null}
    </RoleTaskScreen>
  );
}
