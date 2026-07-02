"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, Store, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommand } from "@/hooks/use-command";
import { ApiClientError } from "@/hooks/use-api";
import { errorMessage } from "@/lib/error-messages";
import { unitValueVnd } from "@/lib/economy";
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
  const wholesalePrice = Math.max(MIN_PRICE_VND, state.individualUnitCostVnd);
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

  const commandError =
    command.isError && command.error instanceof ApiClientError
      ? errorMessage(command.error.code)
      : null;

  return (
    <ProducerActionCard icon={Store} title="Bán hàng">
      <div className="flex h-[50.5px] items-center justify-between pt-[17.5px]">
        <p className="text-[13px] leading-[19.5px] text-muted-foreground">
          Đưa ra chợ
        </p>
        <ProducerQuantityControl
          value={qty}
          max={maxQty}
          disabled={command.isPending || !activeLot || phase !== "MARKET_OPEN"}
          onChange={setQty}
        />
      </div>

      <div className="flex flex-col gap-[8.75px] pt-[17.5px]">
        <Button
          className="h-[37px] rounded-[14.5px] bg-danger text-[13px] font-bold hover:bg-danger/90"
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
          <Store className="size-3.5" aria-hidden />
          Đưa ra chợ bán lẻ
        </Button>

        <Button
          className="h-[37px] rounded-[14.5px] bg-violet-600 text-[13px] font-semibold text-white hover:bg-violet-700"
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
          <Truck className="size-3.5" aria-hidden />
          Bán sỉ cho trung gian
        </Button>

        <Button
          variant="outline"
          className="h-[37.5px] rounded-[14.5px] text-xs font-semibold text-muted-foreground"
          disabled={!canUpgrade || command.isPending}
          onClick={() => command.mutate({ action: "invest" })}
        >
          <Zap className="size-[13px]" aria-hidden />
          Nâng cấp công nghệ
          {discountedUpgrade ? ` (−${formatCompactVnd(discountedUpgrade)})` : ""}
        </Button>
      </div>

      {state.pendingUpgrade ? (
        <p className="mt-2 text-xs text-primary">
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
        <p className="mt-2 text-sm text-danger" role="alert">
          {commandError}
        </p>
      ) : null}
    </ProducerActionCard>
  );
}
