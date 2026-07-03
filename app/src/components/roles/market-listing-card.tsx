"use client";

import type { ListingView } from "@/lib/session-service";
import { Package } from "lucide-react";
import { ROLE_SHORT_LABELS } from "@/lib/display-labels";
import { cn } from "@/lib/utils";

const SELLER_LABELS: Record<string, string> = {
  PRODUCER: ROLE_SHORT_LABELS.PRODUCER,
  INTERMEDIARY: ROLE_SHORT_LABELS.INTERMEDIARY,
};

export function MarketListingCard({
  listing,
  unitValueVnd,
  pendingOfferVnd,
  onClick,
}: {
  listing: ListingView;
  unitValueVnd?: number | null;
  /** Price of this consumer's own pending (awaiting response) offer on this listing, if any. */
  pendingOfferVnd?: number | null;
  onClick?: () => void;
}) {
  const delta =
    unitValueVnd != null ? listing.askPriceVnd - unitValueVnd : null;
  const sellerLabel = SELLER_LABELS[listing.sellerType] ?? listing.sellerType;
  const priceK = (listing.askPriceVnd / 1000).toFixed(0);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-4 shadow-sm text-left hover:border-primary/30 transition-colors w-full"
    >
      {pendingOfferVnd != null ? (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800">
          Đã trả giá {(pendingOfferVnd / 1000).toFixed(0)}k Đ · đang chờ phản hồi
        </span>
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">{listing.sellerName}</p>
          <span className="mt-1 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
            {sellerLabel}
          </span>
        </div>
        <div className="text-right">
          <p className="font-mono text-[22px] font-bold leading-none text-[#c94a2d]">
            {priceK}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">nghìn Đ/thùng</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Package className="size-3.5 shrink-0" aria-hidden />
        <span>{listing.availableQuantity} thùng còn</span>
        {delta != null ? (
          <span
            className={cn(
              "ml-auto font-medium",
              delta < 0 ? "text-success" : delta > 0 ? "text-[#c94a2d]" : "",
            )}
          >
            {delta < 0
              ? `↓ ${(Math.abs(delta) / 1000).toFixed(0)}k dưới chuẩn`
              : delta > 0
                ? `↑ ${(delta / 1000).toFixed(0)}k trên chuẩn`
                : "≈ chuẩn"}
          </span>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          Nhấn để giao dịch
        </span>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
          Mua / Trả giá
        </span>
      </div>
    </button>
  );
}

export type MarketplaceFilter = "all" | "lowest" | "producer" | "intermediary";

export function MarketplaceFilters({
  value,
  onChange,
}: {
  value: MarketplaceFilter;
  onChange: (v: MarketplaceFilter) => void;
}) {
  const tabs: { id: MarketplaceFilter; label: string }[] = [
    { id: "all", label: "Tất cả" },
    { id: "lowest", label: "Giá thấp nhất" },
    { id: "producer", label: ROLE_SHORT_LABELS.PRODUCER },
    { id: "intermediary", label: ROLE_SHORT_LABELS.INTERMEDIARY },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-1.5 rounded-[10.5px] border border-border bg-surface p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
            value === tab.id
              ? "bg-secondary text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function filterListings(
  listings: ListingView[],
  filter: MarketplaceFilter,
): ListingView[] {
  let result = [...listings];
  if (filter === "lowest") {
    result.sort((a, b) => a.askPriceVnd - b.askPriceVnd);
  }
  if (filter === "producer") {
    result = result.filter((l) => l.sellerType === "PRODUCER");
  }
  if (filter === "intermediary") {
    result = result.filter((l) => l.sellerType === "INTERMEDIARY");
  }
  return result;
}
