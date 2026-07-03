"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Package, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommand } from "@/hooks/use-command";
import { ApiClientError } from "@/hooks/use-api";
import { errorMessage } from "@/lib/error-messages";
import { cn } from "@/lib/utils";
import {
  allowedProductionQuantity,
  producerFundsCapacity,
  producerProductionCapacity,
  producerRemainingCapacity,
  producerUnitCostVnd,
  unitValueVnd,
} from "@/lib/economy";
import {
  isProducerInputLockedAt,
  producerInputLockRemainingSec,
} from "@/lib/producer-input-lock";
import { PRODUCTIVITY_PROFILES, UPGRADE_COSTS } from "@/lib/scenario";
import {
  formatCompactVnd,
  ProducerActionCard,
  ProducerQuantityControl,
} from "./producer-action-card";
import type { ProducerRoundState } from "@/lib/role-state";

export function ProducePanel({
  sessionId,
  state,
  balanceVnd,
  stateVersion,
  currentRound,
  phase,
  phaseEndsAt,
  paused,
  phaseReady,
}: {
  sessionId: string;
  state: ProducerRoundState;
  balanceVnd: number;
  stateVersion?: number;
  currentRound: number;
  phase: string | null;
  phaseEndsAt: string | null;
  paused: boolean;
  phaseReady: boolean;
}) {
  const command = useCommand(sessionId, stateVersion);
  const [qty, setQty] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (phase !== "DECISION" || paused || !phaseEndsAt) return;
    const tick = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(tick);
  }, [phase, paused, phaseEndsAt]);

  const inputLocked = isProducerInputLockedAt({
    phase,
    phaseEndsAt,
    paused,
    now,
  });
  const lockRemaining = producerInputLockRemainingSec({
    phase,
    phaseEndsAt,
    paused,
    now,
  });

  const unitCost = producerUnitCostVnd(state);
  const productionCapacity = producerProductionCapacity(state);
  const capacityRemaining = producerRemainingCapacity(state);
  const fundsRemaining = producerFundsCapacity(balanceVnd, unitCost);
  const remaining = allowedProductionQuantity({
    productionCapacity,
    producedQuantity: state.producedQuantity,
    balanceVnd,
    unitCostVnd: unitCost,
    availableLaborPoints: state.availableLaborPoints,
    individualLaborTime: state.individualLaborTime,
    productionCap: state.productionCap,
    individualUnitCostVnd: state.individualUnitCostVnd,
  });
  const cost = qty * unitCost;
  const expectedRevenue = qty * unitValueVnd(currentRound);
  const expectedProfit = expectedRevenue - cost;
  const canProduce =
    phase === "DECISION" && qty > 0 && qty <= remaining && !inputLocked && !phaseReady;
  const producedProgress =
    productionCapacity > 0
      ? `${state.producedQuantity}/${productionCapacity} thùng`
      : `${state.producedQuantity} thùng`;

  const upgradeCost =
    state.profile === "TRADITIONAL"
      ? UPGRADE_COSTS.TRADITIONAL_TO_SOCIAL_AVERAGE
      : state.profile === "SOCIAL_AVERAGE"
        ? UPGRADE_COSTS.SOCIAL_AVERAGE_TO_PIONEER
        : null;
  const discountedUpgrade =
    state.techSupportActive && upgradeCost
      ? Math.ceil(upgradeCost * 0.5)
      : upgradeCost;
  const canUpgrade =
    phase === "DECISION" &&
    currentRound < 4 &&
    Boolean(discountedUpgrade) &&
    !state.pendingUpgrade &&
    state.profile !== "PIONEER" &&
    balanceVnd >= (discountedUpgrade ?? 0) &&
    !inputLocked &&
    !phaseReady;

  useEffect(() => {
    setQty((current) => Math.min(current, remaining));
  }, [remaining]);

  const shortfallVnd =
    unitCost > 0 && balanceVnd < unitCost ? unitCost - balanceVnd : 0;
  const disabledReason =
    inputLocked
      ? errorMessage("PRODUCER_INPUT_LOCKED")
      : phase !== "DECISION"
        ? "Chỉ sản xuất ở giai đoạn ra quyết định."
        : remaining <= 0
          ? capacityRemaining <= 0
            ? "Bạn đã dùng hết sức sản xuất của vòng này."
            : shortfallVnd > 0
              ? `Ví còn ${formatCompactVnd(balanceVnd)} nhưng mỗi thùng cần ${formatCompactVnd(unitCost)} (thiếu ${formatCompactVnd(shortfallVnd)}). Hãy bán hàng ở giai đoạn chợ mở để có vốn.`
              : "Ví hiện không đủ để làm thêm thùng nào."
          : qty <= 0
            ? "Chọn số thùng muốn làm."
            : null;

  const commandError =
    command.isError && command.error instanceof ApiClientError
      ? errorMessage(command.error.code)
      : null;

  return (
    <ProducerActionCard icon={Package} title="Sản xuất">
      {phaseReady ? (
        <div className="mt-4 flex flex-col items-center gap-1.5 rounded-[14px] border border-success/25 bg-success/10 px-4 py-6 text-center">
          <CheckCircle2 className="size-6 text-success" aria-hidden />
          <p className="text-sm font-bold text-foreground">Đã ra quyết định xong</p>
          <p className="text-xs text-muted-foreground">
            Đã sản xuất {producedProgress}. Đang chờ những người chơi khác.
          </p>
        </div>
      ) : (
        <>
          <div className="flex h-[50.5px] items-center justify-between gap-2 pt-[17.5px]">
            <p className="text-[13px] leading-[19.5px] text-muted-foreground">
              Sản phẩm{" "}
              <span className="font-semibold text-foreground">
                ({formatCompactVnd(unitCost)})
              </span>
            </p>
            <div className="flex items-center gap-3">
              <ProducerQuantityControl
                value={qty}
                max={remaining}
                disabled={command.isPending || inputLocked || phase !== "DECISION"}
                onChange={setQty}
              />
              <span className="w-14 shrink-0 text-right font-mono text-sm font-bold text-foreground tabular-nums">
                {formatCompactVnd(cost)}
              </span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-[14px] border border-success/25 bg-success/10 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-success/80">
                Đã sản xuất vòng này
              </p>
              <p className="mt-0.5 font-mono text-base font-black text-success">
                {producedProgress}
              </p>
            </div>
            <div className="rounded-[14px] border border-border bg-muted/25 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Có thể làm thêm
              </p>
              <p className="mt-0.5 font-mono text-base font-black text-foreground">
                {remaining} <span className="text-xs font-semibold">thùng</span>
              </p>
            </div>
            <div className="rounded-[14px] border border-border bg-muted/25 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Sức sản xuất còn
              </p>
              <p className="mt-0.5 font-mono text-base font-black text-foreground">
                {capacityRemaining}/{productionCapacity} <span className="text-xs font-semibold">thùng</span>
              </p>
            </div>
            <div className="rounded-[14px] border border-border bg-muted/25 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Ví đủ làm
              </p>
              <p className="mt-0.5 font-mono text-base font-black text-foreground">
                {fundsRemaining} <span className="text-xs font-semibold">thùng</span>
              </p>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-[14px] border border-border">
            <div className="bg-muted/20 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Tóm tắt chi phí · {qty > 0 ? `${qty} thùng` : "chưa chọn số lượng"}
            </div>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 text-muted-foreground">Chi phí sản xuất</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-foreground">
                    {formatCompactVnd(cost)}
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 text-muted-foreground">Doanh thu kỳ vọng</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-price">
                    {formatCompactVnd(expectedRevenue)}
                  </td>
                </tr>
                <tr className="border-t border-border bg-muted/10">
                  <td className="px-3 py-2 font-semibold text-foreground">Lợi nhuận kỳ vọng</td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-mono font-bold",
                      expectedProfit >= 0 ? "text-success" : "text-danger",
                    )}
                  >
                    {formatCompactVnd(expectedProfit, { signed: true })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 pt-3.5">
            {state.pendingUpgrade ? (
              <p className="text-xs text-primary">
                Nâng cấp chờ áp dụng từ vòng sau:{" "}
                {PRODUCTIVITY_PROFILES[state.pendingUpgrade].label}
              </p>
            ) : null}
            {disabledReason ? (
              <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                {disabledReason}
                {inputLocked && lockRemaining != null && lockRemaining > 0
                  ? ` Còn ~${lockRemaining}s.`
                  : null}
              </p>
            ) : null}
            <Button
              className="h-[37px] rounded-[14.5px] bg-success text-[13px] font-bold hover:bg-success/90"
              disabled={!canProduce || command.isPending}
              onClick={() =>
                command.mutate(
                  { action: "produce", quantity: qty },
                  { onSuccess: () => setQty(0) },
                )
              }
            >
              <Package className="size-3.5" aria-hidden />
              Sản xuất {qty > 0 ? `${qty} thùng` : ""}
            </Button>
            {commandError ? (
              <p className="text-sm text-danger" role="alert">
                {commandError}
              </p>
            ) : null}
            {state.producedQuantity > 0 ? (
              <Button
                variant="outline"
                size="sm"
                disabled={command.isPending || inputLocked || phase !== "DECISION"}
                onClick={() => command.mutate({ action: "cancelProduction" })}
              >
                Hủy sản xuất vòng này
              </Button>
            ) : null}
            {phase === "DECISION" && state.profile !== "PIONEER" && currentRound < 4 ? (
              <Button
                variant="outline"
                className="h-11 gap-2 border-2 border-primary/30 bg-primary/5 font-bold text-primary hover:bg-primary/10"
                disabled={!canUpgrade || command.isPending}
                onClick={() => command.mutate({ action: "invest" })}
              >
                <Zap className="size-4" aria-hidden />
                Nâng cấp công nghệ
                {discountedUpgrade ? ` (−${formatCompactVnd(discountedUpgrade)})` : ""}
              </Button>
            ) : null}
          </div>
        </>
      )}
    </ProducerActionCard>
  );
}
