"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useCommand } from "@/hooks/use-command";
import { formatThousandDong } from "@/lib/money";
import type { OfferView } from "@/lib/session-service";

/** Centered alert when a seller responds with a new offer (UI-MARKET-OFFER-ALERT). */
export function IncomingOfferPopup({
  sessionId,
  stateVersion,
  offers,
}: {
  sessionId: string;
  stateVersion?: number;
  offers: OfferView[];
}) {
  const command = useCommand(sessionId, stateVersion);
  const seenIds = useRef<Set<string>>(new Set());
  const dismissedIds = useRef<Set<string>>(new Set());
  const [activeOffer, setActiveOffer] = useState<OfferView | null>(null);

  useEffect(() => {
    for (const offer of offers) {
      if (seenIds.current.has(offer.id)) continue;
      seenIds.current.add(offer.id);
      if (!dismissedIds.current.has(offer.id)) {
        setActiveOffer(offer);
      }
    }
    setActiveOffer((current) =>
      current && !offers.some((o) => o.id === current.id) ? null : current,
    );
  }, [offers]);

  if (!activeOffer) return null;

  const dismiss = () => {
    dismissedIds.current.add(activeOffer.id);
    setActiveOffer(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-foreground/60 px-4 py-[6vh]">
      <div className="relative w-full max-w-[380px] rounded-[21px] bg-surface p-5 text-center shadow-2xl">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Đóng"
        >
          <X className="size-4" />
        </button>

        <p className="text-xs font-bold uppercase tracking-wide text-primary">
          Phản đề nghị giá
        </p>
        <p className="mt-2 text-lg font-bold">
          {activeOffer.fromName} gửi phản giá
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Người bán trả giá lại đề nghị của bạn:{" "}
          <span className="font-semibold text-foreground">
            {activeOffer.quantity} thùng ·{" "}
            {formatThousandDong(activeOffer.offerPriceVnd)}/thùng
          </span>
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={command.isPending}
            onClick={() => {
              command.mutate({
                action: "respondOffer",
                offerId: activeOffer.id,
                decision: "REJECT",
              });
              dismiss();
            }}
            className="flex-1 rounded-[14px] border border-border bg-surface py-3 text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50"
          >
            Từ chối
          </button>
          <button
            type="button"
            disabled={command.isPending}
            onClick={() => {
              command.mutate({
                action: "respondOffer",
                offerId: activeOffer.id,
                decision: "ACCEPT",
              });
              dismiss();
            }}
            className="flex-[2] rounded-[14px] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
            style={{ background: "linear-gradient(172deg, #c94a2d, #a03020)" }}
          >
            Chấp nhận giá này
          </button>
        </div>
      </div>
    </div>
  );
}
