"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommand } from "@/hooks/use-command";
import { ApiClientError } from "@/hooks/use-api";
import { errorMessage } from "@/lib/error-messages";
import { unitValueVnd } from "@/lib/economy";
import {
  isProducerInputLockedAt,
  producerInputLockRemainingSec,
} from "@/lib/producer-input-lock";
import {
  formatCompactVnd,
  ProducerActionCard,
  ProducerQuantityControl,
  ProducerValueRow,
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
}: {
  sessionId: string;
  state: ProducerRoundState;
  balanceVnd: number;
  stateVersion?: number;
  currentRound: number;
  phase: string | null;
  phaseEndsAt: string | null;
  paused: boolean;
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

  const capLabor = Math.floor(state.availableLaborPoints / state.individualLaborTime);
  const remaining = Math.max(
    0,
    Math.min(
      capLabor - state.producedQuantity,
      state.productionCap - state.producedQuantity,
      Math.floor(balanceVnd / state.individualUnitCostVnd),
    ),
  );
  const cost = qty * state.individualUnitCostVnd;
  const expectedRevenue = qty * unitValueVnd(currentRound);
  const expectedProfit = expectedRevenue - cost;
  const canProduce = phase === "DECISION" && qty > 0 && !inputLocked;

  const commandError =
    command.isError && command.error instanceof ApiClientError
      ? errorMessage(command.error.code)
      : null;

  return (
    <ProducerActionCard icon={Package} title="Sản xuất">
      <div className="flex h-[50.5px] items-center justify-between pt-[17.5px]">
        <p className="text-[13px] leading-[19.5px] text-muted-foreground">
          Số lượng sản xuất
        </p>
        <ProducerQuantityControl
          value={qty}
          max={remaining}
          disabled={command.isPending || inputLocked || phase !== "DECISION"}
          onChange={setQty}
        />
      </div>

      <div className="pt-[17.5px]">
        <div className="border-b border-muted pb-[15px]">
          <ProducerValueRow label="Chi phí SX:" value={formatCompactVnd(cost)} />
          <ProducerValueRow
            label="Doanh thu kỳ vọng:"
            value={formatCompactVnd(expectedRevenue)}
            valueClassName="text-price"
          />
          <ProducerValueRow
            label="Lợi nhuận kỳ vọng:"
            value={formatCompactVnd(expectedProfit, { signed: true })}
            valueClassName={expectedProfit >= 0 ? "text-success" : "text-danger"}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-3.5">
        {inputLocked ? (
          <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
            {errorMessage("PRODUCER_INPUT_LOCKED")}
            {lockRemaining != null && lockRemaining > 0 ? ` Còn ~${lockRemaining}s.` : null}
          </p>
        ) : null}
        {state.pendingUpgrade ? (
          <p className="text-xs text-primary">
            Nâng cấp chờ áp dụng từ vòng sau: {state.pendingUpgrade}
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
      </div>
    </ProducerActionCard>
  );
}
