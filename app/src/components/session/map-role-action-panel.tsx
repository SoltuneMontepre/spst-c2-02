"use client";

import { useState } from "react";
import { AlertCircle, Hourglass, Inbox, Store } from "lucide-react";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useCommand } from "@/hooks/use-command";
import { ApiClientError } from "@/hooks/use-api";
import { ProducePanel } from "@/components/roles/produce-panel";
import { ProducerSalesPanel } from "@/components/roles/producer-sales-panel";
import { OffersPanel } from "@/components/roles/offers-panel";
import { SellPanel } from "@/components/roles/sell-panel";
import { WholesalePanel } from "@/components/roles/wholesale-panel";
import { PolicyCard } from "@/components/roles/policy-card";
import {
  MarketListingCard,
  MarketplaceFilters,
  filterListings,
  type MarketplaceFilter,
} from "@/components/roles/market-listing-card";
import { MarketTransactionDialog } from "@/components/roles/market-transaction-dialog";
import { IncomingOfferPopup } from "@/components/roles/incoming-offer-popup";
import { RoleActionCard } from "@/components/session/role-task-screen";
import { MarketActivityFeed } from "@/components/session/market-activity-feed";
import { MarketSnapshotPanel } from "@/components/session/market-snapshot-panel";
import { PriceValueChart } from "@/components/observatory/price-value-chart";
import { Button } from "@/components/ui/button";
import { getRoleQuest } from "@/lib/role-quest";
import { EVENT_COPY } from "@/lib/labels";
import { POLICIES } from "@/lib/scenario";
import { errorMessage } from "@/lib/error-messages";
import { formatThousandDong } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { PolicyType } from "@/generated/prisma/enums";
import type {
  ConsumerRoundState,
  GovernmentRoundState,
  ProducerRoundState,
} from "@/lib/role-state";
import type { ListingView, SessionSnapshot } from "@/lib/session-service";

/** Wallet + units sold — always visible for producer, regardless
 *  of quest/phase state, so "did I earn anything / is it selling" is never hidden. */
function ProducerStatusSummary({ data }: { data: SessionSnapshot }) {
  const soldUnits = data.recentTransactions
    .filter((t) => t.direction === "sell")
    .reduce((s, t) => s + t.quantity, 0);

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-[14px] border border-border bg-muted/25 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Ví
        </p>
        <p className="mt-0.5 font-mono text-xl font-black text-foreground">
          {formatThousandDong(data.self?.balanceVnd ?? 0)}
        </p>
      </div>
      <div className="rounded-[14px] border border-success/25 bg-success/10 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-success/80">
          Đã bán vòng này
        </p>
        <p className="mt-0.5 font-mono text-xl font-black text-success">
          {soldUnits} <span className="text-xs font-semibold">thùng</span>
        </p>
      </div>
    </div>
  );
}

/** Vốn + tồn kho + đã bán — always visible for the intermediary so
 *  margin progress stays legible regardless of quest/phase state. */
function IntermediaryStatusSummary({ data }: { data: SessionSnapshot }) {
  const inventoryUnits = (data.self?.inventory ?? []).reduce(
    (s, l) => s + l.availableQuantity,
    0,
  );
  const soldUnits = data.recentTransactions
    .filter((t) => t.direction === "sell")
    .reduce((s, t) => s + t.quantity, 0);

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-[14px] border border-border bg-muted/25 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Vốn
        </p>
        <p className="mt-0.5 font-mono text-xl font-black text-foreground">
          {formatThousandDong(data.self?.balanceVnd ?? 0)}
        </p>
      </div>
      <div className="rounded-[14px] border border-border bg-muted/25 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Tồn kho
        </p>
        <p className="mt-0.5 font-mono text-xl font-black text-foreground">
          {inventoryUnits} <span className="text-xs font-semibold">thùng</span>
        </p>
      </div>
      <div className="rounded-[14px] border border-success/25 bg-success/10 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-success/80">
          Đã bán vòng này
        </p>
        <p className="mt-0.5 font-mono text-xl font-black text-success">
          {soldUnits} <span className="text-xs font-semibold">thùng</span>
        </p>
      </div>
    </div>
  );
}

/** Ví + tiến độ nhu cầu — always visible for the consumer so "còn thiếu bao
 *  nhiêu" never requires scrolling into the listing grid to figure out. */
function ConsumerStatusSummary({
  data,
  state,
}: {
  data: SessionSnapshot;
  state: ConsumerRoundState | null;
}) {
  const needTarget = state?.needTarget ?? 0;
  const fulfilled = state?.fulfilledUnits ?? 0;
  const remaining = Math.max(0, needTarget - fulfilled);

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-[14px] border border-border bg-muted/25 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Ví
        </p>
        <p className="mt-0.5 font-mono text-xl font-black text-foreground">
          {formatThousandDong(data.self?.balanceVnd ?? 0)}
        </p>
      </div>
      <div className="rounded-[14px] border border-border bg-muted/25 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Cần mua
        </p>
        <p className="mt-0.5 font-mono text-xl font-black text-foreground">
          {remaining} <span className="text-xs font-semibold">thùng</span>
        </p>
      </div>
      <div className="rounded-[14px] border border-success/25 bg-success/10 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-success/80">
          Đã mua vòng này
        </p>
        <p className="mt-0.5 font-mono text-xl font-black text-success">
          {fulfilled} <span className="text-xs font-semibold">thùng</span>
        </p>
      </div>
    </div>
  );
}

/** Ngân sách + trạng thái chính sách — mirrors the other roles' summary
 *  strip so the government screen isn't the only one dropping straight
 *  into the action list with no at-a-glance state. */
function GovernmentStatusSummary({
  balanceVnd,
  used,
}: {
  balanceVnd: number | null;
  used: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-[14px] border border-border bg-muted/25 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Ngân sách
        </p>
        <p className="mt-0.5 font-mono text-xl font-black text-foreground">
          {formatThousandDong(balanceVnd ?? 0)}
        </p>
      </div>
      <div
        className={cn(
          "rounded-[14px] border px-3 py-2",
          used
            ? "border-success/25 bg-success/10"
            : "border-border bg-muted/25",
        )}
      >
        <p
          className={cn(
            "text-[10px] font-bold uppercase tracking-wide",
            used ? "text-success/80" : "text-muted-foreground",
          )}
        >
          Chính sách vòng này
        </p>
        <p
          className={cn(
            "mt-0.5 text-sm font-black",
            used ? "text-success" : "text-foreground",
          )}
        >
          {used ? "Đã áp dụng" : "Chưa chọn"}
        </p>
      </div>
    </div>
  );
}

function WaitingCard({
  title,
  body,
  footer,
  videoSrc,
}: {
  title: string;
  body: string;
  footer?: string;
  /** Plays on loop to fill the wait — e.g. during SETTLEMENT. */
  videoSrc?: string;
}) {
  return (
    <div className="flex h-full min-h-80 flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-border bg-surface/80 px-6 py-12 text-center">
      {videoSrc ? (
        <video
          src={videoSrc}
          className="mb-1 w-full max-w-md rounded-xl shadow-sm"
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        <span className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Hourglass className="size-5 text-muted-foreground" aria-hidden />
        </span>
      )}
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
      {footer ? (
        <p className="text-[11px] font-medium text-primary">{footer}</p>
      ) : null}
    </div>
  );
}

function QuestIdleCard({
  title,
  body,
  status,
}: {
  title: string;
  body: string;
  status: "waiting" | "done";
}) {
  return (
    <WaitingCard
      title={title}
      body={body}
      footer={
        status === "done"
          ? "Nhấn «Tôi đã sẵn sàng» ở thanh dưới để tiếp tục"
          : "Đã tự động sẵn sàng — chờ mọi người…"
      }
      videoSrc="/simlpy_remove_the_gco_fruit_f.mp4"
    />
  );
}

/** Replaces the idle-video card while a role has nothing left to do this
 *  phase — the cơ quan quản lý spends most rounds only observing, so this
 *  keeps the wait screen useful instead of blank. */
function LiveMarketWatch({
  title,
  body,
  data,
}: {
  title: string;
  body: string;
  data: SessionSnapshot;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[14px] border border-dashed border-border bg-surface/80 px-4 py-3 text-center">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
        <p className="mt-2 text-[11px] font-medium text-primary">
          Đã tự động sẵn sàng — chờ mọi người…
        </p>
      </div>

      <div className="rounded-[14px] border border-border bg-surface p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Giá trị & giá thị trường
        </p>
        <PriceValueChart
          rounds={data.analytics}
          liveStats={data.liveRoundStats}
          currentRound={data.currentRound}
        />
      </div>

      <MarketSnapshotPanel stats={data.liveRoundStats} />

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Diễn biến chợ
        </p>
        <MarketActivityFeed activity={data.marketActivity} />
      </div>
    </div>
  );
}

function ProducerActions({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  if (!data?.self) return null;

  const state = data.self.roleState as ProducerRoundState | null;
  if (state?.kind !== "PRODUCER") {
    return (
      <WaitingCard
        title="Đang chuẩn bị vai trò"
        body="Vai trò nhà cung cấp sẽ sẵn sàng khi vào vòng chơi."
        videoSrc="/simlpy_remove_the_gco_fruit_f.mp4"
      />
    );
  }

  const phaseReady = data.participants.find((p) => p.isSelf)?.phaseReady ?? false;

  const quest = getRoleQuest({
    role: "PRODUCER",
    phase: data.phase,
    round: data.currentRound,
    roleState: state,
    marketListingCount: data.market?.listings.length ?? 0,
  });

  if (quest.status !== "active") {
    return (
      <div className="flex flex-col gap-4">
        <ProducerStatusSummary data={data} />
        <QuestIdleCard title={quest.title} body={quest.action} status={quest.status} />
      </div>
    );
  }

  // DECISION = sản xuất only; MARKET_OPEN = bán hàng / chợ only.
  if (data.phase === "DECISION") {
    return (
      <div className="flex flex-col gap-4">
        <ProducerStatusSummary data={data} />
        <ProducePanel
          sessionId={sessionId}
          state={state}
          balanceVnd={data.self.balanceVnd ?? 0}
          stateVersion={data.stateVersion}
          currentRound={data.currentRound}
          phase={data.phase}
          phaseEndsAt={data.phaseEndsAt}
          paused={data.paused}
          phaseReady={phaseReady}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ProducerStatusSummary data={data} />

      <ProducerSalesPanel
        sessionId={sessionId}
        state={state}
        balanceVnd={data.self.balanceVnd ?? 0}
        stateVersion={data.stateVersion}
        currentRound={data.currentRound}
        phase={data.phase}
        inventory={data.self.inventory}
        listings={data.self.listings}
        phaseReady={phaseReady}
      />

      {data.phase === "MARKET_OPEN" ? (
        <WholesalePanel
          sessionId={sessionId}
          stateVersion={data.stateVersion}
          inventory={data.self.inventory}
          offers={data.market?.wholesaleOffers ?? []}
          role="PRODUCER"
          balanceVnd={data.self.balanceVnd}
          showCreate={false}
        />
      ) : null}

      {data.phase === "MARKET_OPEN" ? (
        <OffersPanel
          sessionId={sessionId}
          stateVersion={data.stateVersion}
          incoming={data.self.incomingOffers}
          outgoing={data.self.outgoingOffers}
        />
      ) : null}
    </div>
  );
}

function ConsumerActions({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  const command = useCommand(sessionId, data?.stateVersion);
  const [filter, setFilter] = useState<MarketplaceFilter>("all");
  const [selectedListing, setSelectedListing] = useState<ListingView | null>(null);

  if (!data?.self) return null;

  const state = data.self.roleState as ConsumerRoundState | null;
  const quest = getRoleQuest({
    role: "CONSUMER",
    phase: data.phase,
    round: data.currentRound,
    roleState: state,
    marketListingCount: data.market?.listings.length ?? 0,
  });

  // "done" only means the need target is met — consumers can keep shopping
  // past it, so only the genuinely idle "waiting" phases show the idle card.
  if (quest.status === "waiting") {
    return (
      <div className="flex flex-col gap-4">
        <ConsumerStatusSummary data={data} state={state} />
        <QuestIdleCard title={quest.title} body={quest.action} status={quest.status} />
      </div>
    );
  }

  const allListings = data.market?.listings ?? [];
  const listings = filterListings(allListings, filter);
  const unitValue = data.liveRoundStats?.unitValueVnd;

  return (
    <div className="flex flex-col gap-4">
      <ConsumerStatusSummary data={data} state={state} />

      <div className="flex items-center gap-2 rounded-[10.5px] border border-[#fee685] bg-[#fffbeb] px-3 py-2.5 text-xs text-[#7b3306]">
        <AlertCircle className="size-3.5 shrink-0" aria-hidden />
        <span>
          Giá niêm yết chưa phải giá thị trường — chỉ giao dịch thực tế mới xác lập giá
          TT.
        </span>
      </div>

      {allListings.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm">
          <p className="font-medium text-foreground">Chưa có quầy niêm yết</p>
          <p className="mt-2 text-muted-foreground">
            Nhà cung cấp và đại lý đang đưa hàng lên chợ.
          </p>
        </div>
      ) : (
        <>
          <MarketplaceFilters value={filter} onChange={setFilter} />
          {listings.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm">
              <p className="font-medium text-foreground">Không có quầy phù hợp bộ lọc</p>
              <p className="mt-2 text-muted-foreground">Thử chọn bộ lọc khác.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {listings.map((l) => (
                <MarketListingCard
                  key={l.id}
                  listing={l}
                  unitValueVnd={unitValue}
                  onClick={() => setSelectedListing(l)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <OffersPanel
        sessionId={sessionId}
        stateVersion={data.stateVersion}
        incoming={data.self.incomingOffers}
        outgoing={data.self.outgoingOffers}
        canCounter={false}
      />

      {selectedListing ? (
        <MarketTransactionDialog
          listing={selectedListing}
          unitValueVnd={unitValue}
          pending={command.isPending}
          balanceVnd={data.self.balanceVnd ?? 0}
          reservedOfferVnd={state?.reservedOfferVnd ?? 0}
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

      <IncomingOfferPopup
        sessionId={sessionId}
        stateVersion={data.stateVersion}
        offers={data.self.incomingOffers}
      />
    </div>
  );
}

function IntermediaryActions({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  if (!data?.self) return null;

  const quest = getRoleQuest({
    role: "INTERMEDIARY",
    phase: data.phase,
    round: data.currentRound,
    roleState: data.self.roleState,
    marketListingCount: data.market?.listings.length ?? 0,
  });

  if (quest.status !== "active") {
    return (
      <div className="flex flex-col gap-4">
        <IntermediaryStatusSummary data={data} />
        <QuestIdleCard title={quest.title} body={quest.action} status={quest.status} />
      </div>
    );
  }

  const inventoryUnits = data.self.inventory.reduce((s, l) => s + l.availableQuantity, 0);
  const listedUnits = data.self.listings.reduce((s, l) => s + l.availableQuantity, 0);

  return (
    <div className="flex flex-col gap-4">
      <IntermediaryStatusSummary data={data} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RoleActionCard title="Đề nghị bán sỉ nhận được" icon={Inbox}>
          <WholesalePanel
            sessionId={sessionId}
            stateVersion={data.stateVersion}
            inventory={data.self.inventory}
            offers={data.market?.wholesaleOffers ?? []}
            role="INTERMEDIARY"
            balanceVnd={data.self.balanceVnd}
          />
        </RoleActionCard>

        <RoleActionCard title="Niêm yết bán lẻ" icon={Store}>
          {listedUnits > 0 ? (
            <p className="mb-2 text-xs font-semibold text-primary">
              {listedUnits} thùng đang niêm yết
            </p>
          ) : null}
          <SellPanel
            sessionId={sessionId}
            stateVersion={data.stateVersion}
            inventory={data.self.inventory}
            listings={data.self.listings}
          />
        </RoleActionCard>
      </div>

      {inventoryUnits > 0 ? (
        <p className="flex items-center gap-1.5 rounded-[10.5px] border border-[#fee685] bg-[#fffbeb] px-3 py-2.5 text-xs text-[#7b3306]">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          Tồn kho {inventoryUnits} thùng chưa bán sẽ mang sang vòng sau.
        </p>
      ) : null}

      <OffersPanel
        sessionId={sessionId}
        stateVersion={data.stateVersion}
        incoming={data.self.incomingOffers}
        outgoing={data.self.outgoingOffers}
      />
    </div>
  );
}

const DECISION_POLICIES: {
  type: PolicyType;
  title: string;
  description: string;
  costLabel: string;
  footer?: string;
  rounds?: number[];
  marketOpenOnly?: boolean;
}[] = [
  {
    type: "INFO_DISCLOSURE",
    title: "Công bố thông tin",
    description: "Công khai dữ liệu cung-cầu cho mọi người chơi.",
    costLabel: formatThousandDong(POLICIES.INFO_DISCLOSURE.fixedCostVnd),
    footer: "Tăng minh bạch",
  },
  {
    type: "COLD_STORAGE",
    title: "Kho lạnh dự trữ",
    description: `Bảo vệ tối đa ${POLICIES.COLD_STORAGE.maxUnits} thùng khỏi hư hỏng khi dư hàng.`,
    costLabel: `${formatThousandDong(POLICIES.COLD_STORAGE.perUnitCostVnd)}/thùng`,
    footer: "Tốn ngân sách",
  },
  {
    type: "TECH_SUPPORT",
    title: "Hỗ trợ công nghệ",
    description: "Giảm chi phí riêng cho nhà cung cấp được chọn.",
    costLabel: formatThousandDong(POLICIES.TECH_SUPPORT.fixedCostVnd),
    footer: "Tốn ngân sách",
    rounds: [2, 3],
  },
  {
    type: "EXPORT_PROMOTION",
    title: "Xúc tiến xuất khẩu",
    description: "15 giây đầu chợ mở: mua ~25% cung bán lẻ.",
    costLabel: "120k Đ",
    footer: "Chi phí cao, tác động dài hạn",
    marketOpenOnly: true,
  },
  {
    type: "NONE",
    title: "Không can thiệp",
    description: "Thị trường tự điều chỉnh qua cung-cầu.",
    costLabel: "Miễn phí",
    footer: "Không tốn ngân sách",
  },
];

function GovernmentActions({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  const command = useCommand(sessionId, data?.stateVersion);
  const [selected, setSelected] = useState<PolicyType>("NONE");

  if (!data?.self) return null;

  const state = data.self.roleState as GovernmentRoundState | null;
  const quest = getRoleQuest({
    role: "GOVERNMENT",
    phase: data.phase,
    round: data.currentRound,
    roleState: state,
    marketListingCount: data.market?.listings.length ?? 0,
  });

  const used = state?.policyUsed ?? false;

  if (quest.status !== "active") {
    return (
      <div className="flex flex-col gap-4">
        <GovernmentStatusSummary balanceVnd={data.self.balanceVnd} used={used} />
        <LiveMarketWatch title={quest.title} body={quest.action} data={data} />
      </div>
    );
  }

  const decisionOpen = data.phase === "DECISION" && data.currentRound >= 2;
  const exportOpen =
    data.phase === "MARKET_OPEN" && data.currentRound >= 2 && !used;
  const visiblePolicies = DECISION_POLICIES.filter(
    (p) => !p.rounds || p.rounds.includes(data.currentRound),
  );
  const commandError =
    command.isError && command.error instanceof ApiClientError
      ? errorMessage(command.error.code, command.error.message)
      : null;

  const applyPolicy = () => {
    if (selected === "EXPORT_PROMOTION") {
      command.mutate({ action: "applyPolicy", policyType: "EXPORT_PROMOTION" });
      return;
    }
    command.mutate({
      action: "applyPolicy",
      policyType: selected,
      targetIds:
        selected === "TECH_SUPPORT"
          ? data.participants
              .filter((x) => x.role === "PRODUCER")
              .slice(0, 1)
              .map((x) => x.id)
          : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <GovernmentStatusSummary balanceVnd={data.self.balanceVnd} used={used} />

      <p className="text-sm font-semibold">Chọn chính sách điều tiết cho vòng này</p>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {visiblePolicies.map((p) => {
          const cardDisabled =
            command.isPending || (p.marketOpenOnly ? !exportOpen : !decisionOpen);
          return (
            <PolicyCard
              key={p.type}
              policyType={p.type}
              title={p.title}
              description={p.description}
              costLabel={p.costLabel}
              footer={p.footer}
              selected={selected === p.type}
              onSelect={() => setSelected(p.type)}
              disabled={cardDisabled}
            />
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          <span>Cơ quan quản lý không trực tiếp ấn định giá thị trường.</span>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <Button
            disabled={
              command.isPending ||
              (selected === "EXPORT_PROMOTION" ? !exportOpen : !decisionOpen)
            }
            onClick={applyPolicy}
          >
            {command.isPending ? "Đang áp dụng…" : "Áp dụng chính sách"}
          </Button>
          {commandError ? (
            <p className="max-w-xs text-xs text-danger" role="alert">
              {commandError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function MapRoleActionPanel({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  if (!data) return null;

  if (data.status === "INTRO") {
    return (
      <WaitingCard
        title="Phiên sắp bắt đầu"
        body="Đọc biến cố trên banner — nhiệm vụ sẽ mở khi vòng 1 bắt đầu."
        videoSrc="/simlpy_remove_the_gco_fruit_f.mp4"
      />
    );
  }

  if (data.phase === "EVENT") {
    const event = EVENT_COPY[data.currentRound];
    return (
      <WaitingCard
        title={event?.title ?? "Biến cố thị trường"}
        body={
          event
            ? "Đọc biến cố trên banner (hoặc popup), rồi nhấn «Tôi đã sẵn sàng» khi đã hiểu."
            : "Một sự kiện bất ngờ vừa xảy ra — chờ giai đoạn tiếp theo."
        }
        videoSrc="/simlpy_remove_the_gco_fruit_f.mp4"
      />
    );
  }

  if (data.phase === "SETTLEMENT") {
    return (
      <WaitingCard
        title="Đang chốt sổ"
        body="Hệ thống đang tính toán kết quả vòng — chờ tổng kết."
        videoSrc="/simlpy_remove_the_gco_fruit_f.mp4"
      />
    );
  }

  if (!data.self?.role) {
    return (
      <WaitingCard
        title="Chưa có vai trò"
        body="Bạn sẽ nhận nhiệm vụ khi phiên bắt đầu."
        videoSrc="/simlpy_remove_the_gco_fruit_f.mp4"
      />
    );
  }

  switch (data.self.role) {
    case "PRODUCER":
      return <ProducerActions sessionId={sessionId} />;
    case "CONSUMER":
      return <ConsumerActions sessionId={sessionId} />;
    case "INTERMEDIARY":
      return <IntermediaryActions sessionId={sessionId} />;
    case "GOVERNMENT":
      return <GovernmentActions sessionId={sessionId} />;
    default:
      return (
        <WaitingCard
          title="Đang chờ"
          body="Theo dõi danh sách người chơi và chờ giai đoạn tiếp theo."
          videoSrc="/simlpy_remove_the_gco_fruit_f.mp4"
        />
      );
  }
}
