"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { useCommand } from "@/hooks/use-command";
import { formatThousandDong } from "@/lib/money";
import { UPGRADE_COSTS } from "@/lib/scenario";
import type { ProducerRoundState } from "@/lib/role-state";

export function ProducePanel({
  sessionId,
  state,
  balanceVnd,
  stateVersion,
  currentRound,
}: {
  sessionId: string;
  state: ProducerRoundState;
  balanceVnd: number;
  stateVersion?: number;
  currentRound: number;
}) {
  const command = useCommand(sessionId, stateVersion);
  const [qty, setQty] = useState(0);

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

  const upgradeCost =
    state.profile === "TRADITIONAL"
      ? UPGRADE_COSTS.TRADITIONAL_TO_SOCIAL_AVERAGE
      : state.profile === "SOCIAL_AVERAGE"
        ? UPGRADE_COSTS.SOCIAL_AVERAGE_TO_PIONEER
        : null;
  const discountedUpgrade = state.techSupportActive && upgradeCost
    ? Math.ceil(upgradeCost * 0.5)
    : upgradeCost;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sản xuất</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Đã sản xuất vòng này: {state.producedQuantity} thùng · Còn có thể làm: {remaining}
          </p>
          {state.pendingUpgrade ? (
            <p className="text-xs text-primary">
              Nâng cấp chờ áp dụng từ vòng sau: {state.pendingUpgrade}
            </p>
          ) : null}
          <div className="flex items-center justify-between">
            <Stepper value={qty} max={remaining} onChange={setQty} />
            <span className="text-sm font-medium">{formatThousandDong(cost)}</span>
          </div>
          <Button
            disabled={qty < 1 || command.isPending}
            onClick={() =>
              command.mutate({ action: "produce", quantity: qty }, { onSuccess: () => setQty(0) })
            }
          >
            Sản xuất {qty > 0 ? `${qty} thùng` : ""}
          </Button>
          {state.producedQuantity > 0 ? (
            <Button
              variant="outline"
              size="sm"
              disabled={command.isPending}
              onClick={() => command.mutate({ action: "cancelProduction" })}
            >
              Hủy sản xuất vòng này
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {currentRound < 4 && discountedUpgrade && !state.pendingUpgrade && state.profile !== "PIONEER" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Đầu tư công nghệ</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p className="text-muted-foreground">
              Giảm hao phí cá biệt từ vòng kế tiếp. Không đổi TGLĐXHCT xã hội.
            </p>
            <p className="font-medium">Chi phí: {formatThousandDong(discountedUpgrade)}</p>
            <Button
              size="sm"
              variant="secondary"
              disabled={balanceVnd < discountedUpgrade || command.isPending}
              onClick={() => command.mutate({ action: "invest" })}
            >
              Đầu tư nâng cấp
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
