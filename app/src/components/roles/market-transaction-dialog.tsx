"use client";

import { useState } from "react";
import { AlertTriangle, Minus, Plus, X } from "lucide-react";
import { ROLE_SHORT_LABELS } from "@/lib/display-labels";
import { cn } from "@/lib/utils";
import { Stepper } from "@/components/ui/stepper";
import type { ListingView } from "@/lib/session-service";

const SELLER_LABELS: Record<string, string> = {
  PRODUCER: ROLE_SHORT_LABELS.PRODUCER,
  INTERMEDIARY: ROLE_SHORT_LABELS.INTERMEDIARY,
};

export function MarketTransactionDialog({
  listing,
  unitValueVnd,
  affordable,
  pending,
  balanceVnd,
  onBuy,
  onOffer,
  onClose,
}: {
  listing: ListingView;
  unitValueVnd?: number | null;
  affordable: boolean;
  pending: boolean;
  balanceVnd: number;
  onBuy: (quantity: number) => void;
  onOffer: (quantity: number, offerPriceVnd: number) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"buy" | "offer">("buy");
  const [quantity, setQuantity] = useState(1);
  const [offerPriceK, setOfferPriceK] = useState(
    Math.max(1, Math.round((listing.askPriceVnd - 2000) / 1000)),
  );

  const askPriceK = Math.round(listing.askPriceVnd / 1000);
  const sellerLabel = SELLER_LABELS[listing.sellerType] ?? listing.sellerType;

  const delta =
    unitValueVnd != null ? listing.askPriceVnd - unitValueVnd : null;

  const totalBuy = quantity * listing.askPriceVnd;
  const totalOffer = quantity * offerPriceK * 1000;

  const handlePrimary = () => {
    if (mode === "buy") {
      onBuy(quantity);
    } else {
      onOffer(quantity, offerPriceK * 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/60 pt-[10vh]">
      <div className="relative w-full max-w-[420px] rounded-[21px] bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-sm font-semibold">Xác nhận giao dịch</p>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Đóng"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {/* Seller info */}
          <div className="flex items-center gap-3 rounded-[14px] border border-border bg-muted/20 px-4 py-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
              {listing.sellerName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold">{listing.sellerName}</p>
              <span className="inline-block rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                {sellerLabel}
              </span>
            </div>
            <div className="ml-auto text-right">
              <p className="font-mono text-[22px] font-bold text-[#c94a2d]">
                {askPriceK}k
              </p>
              <p className="text-[10px] text-muted-foreground">nghìn Đ/thùng</p>
            </div>
          </div>

          {/* Warning banner */}
          <div className="flex items-start gap-2 rounded-[10.5px] border border-[#fee685] bg-[#fffbeb] px-3 py-2.5 text-xs text-[#7b3306]">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              Giá niêm yết chưa phải giá thị trường — chỉ giao dịch thực tế mới xác
              lập giá TT.
            </span>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-[10.5px] border border-border bg-muted/20 p-1">
            <button
              type="button"
              onClick={() => setMode("buy")}
              className={cn(
                "flex-1 rounded-lg py-2 text-center text-xs font-semibold transition-colors",
                mode === "buy"
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Mua ngay
            </button>
            <button
              type="button"
              onClick={() => setMode("offer")}
              className={cn(
                "flex-1 rounded-lg py-2 text-center text-xs font-semibold transition-colors",
                mode === "offer"
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Trả giá
            </button>
          </div>

          {/* Quantity stepper */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Số lượng</span>
            <Stepper
              value={quantity}
              min={1}
              max={listing.availableQuantity}
              onChange={setQuantity}
              size="lg"
            />
          </div>

          {/* Price stepper (offer mode only) */}
          {mode === "offer" ? (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Giá đề nghị</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOfferPriceK((p) => Math.max(1, p - 5))}
                  className="flex size-[35px] items-center justify-center rounded-[14px] border border-border bg-surface hover:bg-muted transition-colors"
                  aria-label="Giảm 5k"
                >
                  <Minus className="size-4" />
                </button>
                <span className="min-w-[60px] text-center text-[22px] font-bold tabular-nums">
                  {offerPriceK}k
                </span>
                <button
                  type="button"
                  onClick={() => setOfferPriceK((p) => p + 5)}
                  className="flex size-[35px] items-center justify-center rounded-[14px] border border-border bg-surface hover:bg-muted transition-colors"
                  aria-label="Tăng 5k"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          ) : null}

          {/* Delta badge */}
          {delta != null ? (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">So với chuẩn</span>
              <span
                className={cn(
                  "font-medium",
                  delta < 0 ? "text-success" : delta > 0 ? "text-[#c94a2d]" : "",
                )}
              >
                {delta < 0
                  ? `↓ ${(Math.abs(delta) / 1000).toFixed(0)}k dưới chuẩn`
                  : delta > 0
                    ? `↑ ${(delta / 1000).toFixed(0)}k trên chuẩn`
                    : "≈ chuẩn"}
              </span>
            </div>
          ) : null}

          {/* Summary box */}
          <div className="rounded-[14px] border border-border bg-muted/20 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tổng cộng</span>
              <span className="font-mono text-lg font-bold">
                {formatThousandDong(mode === "buy" ? totalBuy : totalOffer)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Số dư ví</span>
              <span>{formatThousandDong(balanceVnd)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[14px] border border-border bg-surface py-3 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={
                pending ||
                !affordable ||
                quantity > listing.availableQuantity ||
                (mode === "offer" && offerPriceK * 1000 >= listing.askPriceVnd)
              }
              onClick={handlePrimary}
              className="flex-[2] rounded-[14px] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
              style={{
                background: "linear-gradient(172deg, #c94a2d, #a03020)",
              }}
            >
              {mode === "buy" ? "Mua ngay" : "Gửi đề nghị"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatThousandDong(vnd: number): string {
  return `${(vnd / 1000).toFixed(0)}k Đ`;
}
