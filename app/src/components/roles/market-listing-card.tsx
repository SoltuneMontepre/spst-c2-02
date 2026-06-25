"use client";

import type { ListingView } from "@/lib/session-service";
import { formatThousandDong } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SELLER_LABELS: Record<string, string> = {
  PRODUCER: "Người sản xuất",
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

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{listing.sellerName}</p>
          <span className="mt-1 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium">
            {sellerLabel}
          </span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">
            {(listing.askPriceVnd / 1000).toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground">nghìn Đ/thùng</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {listing.availableQuantity} thùng còn
        {delta != null ? (
          <span
            className={cn(
              "ml-2 font-medium",
              delta < 0 ? "text-success" : delta > 0 ? "text-primary" : "",
            )}
          >
            {delta < 0
              ? `↓ ${formatThousandDong(Math.abs(delta))} dưới GT`
              : delta > 0
                ? `↑ ${formatThousandDong(delta)} trên GT`
                : "≈ GT"}
          </span>
        ) : null}
      </p>
      <div className="mt-auto flex flex-col gap-2">
        <Button disabled={!affordable || pending} onClick={onBuy}>
          Mua ngay
        </Button>
        {affordable && listing.askPriceVnd > 1000 ? (
          <div className="flex gap-2">
            <Input
              type="number"
              step={1000}
              min={1000}
              max={listing.askPriceVnd}
              value={offerPrice}
              onChange={(e) => onOfferPriceChange(Number(e.target.value))}
              className="h-9 text-sm"
              aria-label="Giá đề nghị"
            />
            <Button variant="outline" disabled={pending} onClick={onOffer}>
              Trả giá
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
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
    { id: "producer", label: "Người sản xuất" },
    { id: "intermediary", label: "Trung gian" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            value === tab.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
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
