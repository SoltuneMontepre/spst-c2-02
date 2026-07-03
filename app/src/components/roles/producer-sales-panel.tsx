"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, Store, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommand } from "@/hooks/use-command";
import { ApiClientError } from "@/hooks/use-api";
import { errorMessage } from "@/lib/error-messages";
import { producerUnitCostVnd, unitValueVnd } from "@/lib/economy";
import { MIN_PRICE_VND } from "@/lib/money";
import { UPGRADE_COSTS } from "@/lib/scenario";
import {
  formatCompactVnd,
  ProducerActionCard,
  ProducerQuantityControl,
} from "./producer-action-card";
import type { InventoryView } from "@/lib/session-service";
import type { ProducerRoundState } from "@/lib/role-state";

export function ProducerSalesPanel({
  sessionId,
  state,
  balanceVnd,
  stateVersion,
  currentRound,
  phase,
  inventory,
}: {
  sessionId: string;
  state: ProducerRoundState;
  balanceVnd: number;
  stateVersion?: number;
  currentRound: number;
  phase: string | null;
  inventory: InventoryView[];
}) {
  const command = useCommand(sessionId, stateVersion);
  const [qty, setQty] = useState(0);

  const activeLot = useMemo(
    () =>
      [...inventory]
        .filter((lot) => lot.availableQuantity > 0)
        .sort((a, b) => b.availableQuantity - a.availableQuantity)[0],
    [inventory],
  );
  const maxQty = activeLot?.availableQuantity ?? 0;

  useEffect(() => {
    setQty((current) => Math.min(current, maxQty));
  }, [maxQty]);

  const retailPrice = unitValueVnd(currentRound);
  const unitCost = producerUnitCostVnd(state);
  const wholesalePrice = Math.max(MIN_PRICE_VND, unitCost);
  const canSell = phase === "MARKET_OPEN" && Boolean(activeLot) && qty > 0;

  const upgradeCost =
    state.profile === "TRADITIONAL"
      ? UPGRADE_COSTS.TRADITIONAL_TO_SOCIAL_AVERAGE
      : state.profile === "SOCIAL_AVERAGE"
        ? UPGRADE_COSTS.SOCIAL_AVERAGE_TO_PIONEER
        : null;
  const discountedUpgrade =
    state.techSupportActive && upgradeCost ? Math.ceil(upgradeCost * 0.5) : upgradeCost;
  const canUpgrade =
    phase === "DECISION" &&
    currentRound < 4 &&
    Boolean(discountedUpgrade) &&
    !state.pendingUpgrade &&
    state.profile !== "PIONEER" &&
    balanceVnd >= (discountedUpgrade ?? 0);
  const sellDisabledReason =
    phase !== "MARKET_OPEN"
      ? "Chỉ đưa hàng ra chợ ở giai đoạn chợ mở."
      : !activeLot
        ? "Chưa có hàng trong kho. Hãy sản xuất trước."
        : qty <= 0
          ? "Chọn số thùng muốn đưa ra chợ."
          : null;
  const upgradeDisabledReason =
    phase !== "DECISION"
      ? "Chỉ nâng cấp ở giai đoạn ra quyết định."
      : currentRound >= 4 || state.profile === "PIONEER"
        ? "Bạn đang ở mức công nghệ cao nhất của vòng này."
        : state.pendingUpgrade
          ? "Nâng cấp đã được đặt, sẽ áp dụng từ vòng sau."
          : discountedUpgrade && balanceVnd < discountedUpgrade
            ? `Ví cần thêm ${formatCompactVnd(discountedUpgrade - balanceVnd)} để nâng cấp.`
            : null;

  const commandError =
    command.isError && command.error instanceof ApiClientError
      ? errorMessage(command.error.code)
      : null;

  return (
    <ProducerActionCard icon={Store} title="Bán hàng">
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-[14px] border border-success/25 bg-success/10 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-success/80">
            Tồn kho chờ bán
          </p>
          <p className="mt-0.5 font-mono text-xl font-black text-success">
            {maxQty} <span className="text-xs font-semibold">thùng</span>
          </p>
        </div>
        <div className="rounded-[14px] border border-border bg-muted/25 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Đã sản xuất
          </p>
          <p className="mt-0.5 font-mono text-xl font-black text-foreground">
            {state.producedQuantity} <span className="text-xs font-semibold">thùng</span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-[14px] bg-muted/25 px-4 py-3">
        <p className="text-sm font-bold text-foreground">Số lượng đưa ra chợ</p>
        <ProducerQuantityControl
          value={qty}
          max={maxQty}
          disabled={command.isPending || !activeLot || phase !== "MARKET_OPEN"}
          onChange={setQty}
        />
      </div>

      <div className="mt-3 flex flex-col gap-2.5">
        <Button
          className="h-14 gap-3 rounded-2xl bg-danger text-base font-extrabold uppercase tracking-wide text-white shadow-md shadow-danger/25 transition-transform hover:bg-danger/90 active:scale-[0.98] disabled:shadow-none"
          disabled={!canSell || command.isPending}
          onClick={() => {
            if (!activeLot) return;
            command.mutate({
              action: "list",
              inventoryLotId: activeLot.id,
              quantity: qty,
              askPriceVnd: retailPrice,
            });
          }}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Store className="size-4" aria-hidden />
          </span>
          Bán lẻ ra chợ
        </Button>

        <Button
          className="h-14 gap-3 rounded-2xl bg-violet-600 text-base font-extrabold uppercase tracking-wide text-white shadow-md shadow-violet-600/25 transition-transform hover:bg-violet-700 active:scale-[0.98] disabled:shadow-none"
          disabled={!canSell || command.isPending}
          onClick={() => {
            if (!activeLot) return;
            command.mutate({
              action: "wholesale",
              inventoryLotId: activeLot.id,
              quantity: qty,
              minimumPriceVnd: wholesalePrice,
            });
          }}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Truck className="size-4" aria-hidden />
          </span>
          Bán sỉ cho đại lý
        </Button>

        <Button
          variant="outline"
          className="h-11 gap-2.5 rounded-2xl border-2 border-primary/30 bg-primary/5 text-sm font-bold text-primary hover:bg-primary/10 disabled:border-border disabled:bg-transparent disabled:text-muted-foreground"
          disabled={!canUpgrade || command.isPending}
          onClick={() => command.mutate({ action: "invest" })}
        >
          <Zap className="size-4" aria-hidden />
          Nâng cấp công nghệ
          {discountedUpgrade ? ` (−${formatCompactVnd(discountedUpgrade)})` : ""}
        </Button>
      </div>

      {sellDisabledReason || upgradeDisabledReason ? (
        <div className="mt-3 space-y-1 rounded-xl bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
          {sellDisabledReason ? <p>{sellDisabledReason}</p> : null}
          {upgradeDisabledReason ? <p>{upgradeDisabledReason}</p> : null}
        </div>
      ) : null}

      {state.pendingUpgrade ? (
        <p className="mt-2 text-xs font-semibold text-primary">
          Nâng cấp chờ áp dụng từ vòng sau.
        </p>
      ) : null}
      {!activeLot && phase === "MARKET_OPEN" ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Package className="size-3.5" aria-hidden />
          Chưa có hàng khả dụng để đưa ra chợ.
        </p>
      ) : null}
      {commandError ? (
        <p className="mt-2 text-sm font-semibold text-danger" role="alert">
          {commandError}
        </p>
      ) : null}
    </ProducerActionCard>
  );
}
