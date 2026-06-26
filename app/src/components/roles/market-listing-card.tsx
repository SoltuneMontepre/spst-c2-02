"use client";

import type { ListingView } from "@/lib/session-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

const SELLER_LABELS: Record<string, string> = {
  PRODUCER: "Người SX",
  INTERMEDIARY: "Trung gian",
};

export function MarketListingCard({
  listing,
  unitValueVnd,
  affordable,
  pending,
  offerPrice,
  onOfferPriceChange,
  onBuy,
  onOffer,
}: {
  listing: ListingView;
  unitValueVnd?: number | null;
  affordable: boolean;
  pending: boolean;
  offerPrice: number;
  onOfferPriceChange: (price: number) => void;
  onBuy: () => void;
  onOffer: () => void;
}) {
  const delta =
    unitValueVnd != null ? listing.askPriceVnd - unitValueVnd : null;
  const sellerLabel = SELLER_LABELS[listing.sellerType] ?? listing.sellerType;
  const priceK = (listing.askPriceVnd / 1000).toFixed(0);

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{listing.sellerName}</p>
          <span className="mt-1 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold">
            {sellerLabel}
          </span>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl font-bold leading-none text-primary">
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
              delta < 0 ? "text-success" : delta > 0 ? "text-primary" : "",
            )}
          >
            {delta < 0
              ? `↓ ${(Math.abs(delta) / 1000).toFixed(0)}k dưới GT`
              : delta > 0
                ? `↑ ${(delta / 1000).toFixed(0)}k trên GT`
                : "≈ GT"}
          </span>
        ) : null}
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2">
        <Button disabled={!affordable || pending} onClick={onBuy} size="sm">
          Mua ngay
        </Button>
        {affordable && listing.askPriceVnd > 1000 ? (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={onOffer}
          >
            Trả giá
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Trả giá
          </Button>
        )}
      </div>
      {affordable && listing.askPriceVnd > 1000 ? (
        <Input
          type="number"
          step={1000}
          min={1000}
          max={listing.askPriceVnd}
          value={offerPrice}
          onChange={(e) => onOfferPriceChange(Number(e.target.value))}
          className="h-8 text-xs"
          aria-label={`Giá đề nghị cho ${listing.sellerName}`}
        />
      ) : null}
    </div>
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
    { id: "producer", label: "Người SX" },
    { id: "intermediary", label: "Trung gian" },
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
