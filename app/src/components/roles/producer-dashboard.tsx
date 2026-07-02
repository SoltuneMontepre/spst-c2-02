"use client";

import { useSessionSnapshot } from "@/hooks/use-session-room";
import { ZonePhaseGate } from "@/components/session/zone-phase-gate";
import { RoleKpiRow } from "@/components/session/role-kpi-row";
import { TransactionHistoryTable } from "@/components/session/transaction-history-table";
import { RoleTaskScreen } from "@/components/session/role-task-screen";
import { ProducerInsightPanel } from "@/components/session/role-insight-panels";
import { ProducePanel } from "./produce-panel";
import { OffersPanel } from "./offers-panel";
import { ProducerSalesPanel } from "./producer-sales-panel";
import {
  allowedProductionQuantity,
  producerFundsCapacity,
  producerProductionCapacity,
  producerRemainingCapacity,
  producerUnitCostVnd,
  unitValueVnd,
} from "@/lib/economy";
import { formatThousandDong } from "@/lib/money";
import { ECONOMY_LABELS } from "@/lib/display-labels";
import type { ProducerRoundState } from "@/lib/role-state";

export function ProducerDashboard({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  if (!data?.self) return <p className="p-6 text-muted-foreground">Đang tải…</p>;

  const state = data.self.roleState as ProducerRoundState | null;
  const social = unitValueVnd(data.currentRound);
  const marketPrice = data.liveRoundStats?.marketPriceVnd;
  const inventoryUnits = data.self.inventory.reduce((s, l) => s + l.availableQuantity, 0);
  const soldUnits = data.recentTransactions
    .filter((t) => t.direction === "sell")
    .reduce((s, t) => s + t.quantity, 0);
  const balance = data.self.balanceVnd ?? 0;
  const unitCost = state?.kind === "PRODUCER" ? producerUnitCostVnd(state) : 0;
  const productionCapacity =
    state?.kind === "PRODUCER" ? producerProductionCapacity(state) : 0;
  const capacityRemaining =
    state?.kind === "PRODUCER" ? producerRemainingCapacity(state) : 0;
  const fundsCapacity =
    state?.kind === "PRODUCER" ? producerFundsCapacity(balance, unitCost) : 0;
  const maxCanProduce =
    state?.kind === "PRODUCER"
      ? allowedProductionQuantity({
          productionCapacity,
          producedQuantity: state.producedQuantity,
          balanceVnd: balance,
          unitCostVnd: unitCost,
          availableLaborPoints: state.availableLaborPoints,
          individualLaborTime: state.individualLaborTime,
          productionCap: state.productionCap,
          individualUnitCostVnd: state.individualUnitCostVnd,
        })
      : 0;

  return (
    <RoleTaskScreen
      sessionId={sessionId}
      activeZone="task"
      role="PRODUCER"
      round={data.currentRound}
      phase={data.phase}
      insight={
        state?.kind === "PRODUCER" ? (
          <ProducerInsightPanel
            balanceVnd={data.self.balanceVnd}
            inventoryUnits={inventoryUnits}
            producedQuantity={state.producedQuantity}
            soldUnits={soldUnits}
            state={state}
            round={data.currentRound}
          />
        ) : null
      }
    >
      <ZonePhaseGate
        sessionId={sessionId}
        activeZone="task"
        role={data.self.role}
        phase={data.phase}
        round={data.currentRound}
      >
        {state?.kind === "PRODUCER" ? (
          <>
            <RoleKpiRow
              cols={5}
              items={[
                {
                  label: "Ví",
                  value:
                    data.self.balanceVnd != null
                      ? formatThousandDong(data.self.balanceVnd)
                      : "—",
                  hint: "Tiền còn lại",
                },
                {
                  label: "Chi phí mỗi thùng",
                  value: formatThousandDong(unitCost),
                  hint: "Tiền để làm 1 thùng",
                },
                {
                  label: "Sức sản xuất còn",
                  value: `${capacityRemaining} thùng`,
                  hint: `Tổng vòng: ${productionCapacity} thùng`,
                  valueClassName: "text-success",
                },
                {
                  label: "Có thể làm tối đa",
                  value: `${maxCanProduce} thùng`,
                  hint: `Ví đủ ${fundsCapacity} thùng`,
                  valueClassName: "text-success",
                },
                {
                  label: "Giá thị trường",
                  value: marketPrice != null ? formatThousandDong(marketPrice) : "—",
                  hint: `${ECONOMY_LABELS.standardValue}: ${formatThousandDong(social)}`,
                  valueClassName: "text-primary",
                },
              ]}
            />

            {data.phase === "DECISION" || data.phase === "MARKET_OPEN" ? (
              <div className="grid gap-4 sm:grid-cols-[repeat(2,277px)]">
                  <ProducePanel
                    sessionId={sessionId}
                    state={state}
                    balanceVnd={data.self.balanceVnd ?? 0}
                    stateVersion={data.stateVersion}
                    currentRound={data.currentRound}
                    phase={data.phase}
                    phaseEndsAt={data.phaseEndsAt}
                    paused={data.paused}
                  />
                  <ProducerSalesPanel
                    sessionId={sessionId}
                    state={state}
                    balanceVnd={data.self.balanceVnd ?? 0}
                    stateVersion={data.stateVersion}
                    currentRound={data.currentRound}
                    phase={data.phase}
                    inventory={data.self.inventory}
                  />
              </div>
            ) : null}

            {data.phase === "MARKET_OPEN" ? (
              <OffersPanel
                sessionId={sessionId}
                stateVersion={data.stateVersion}
                incoming={data.self.incomingOffers}
                outgoing={data.self.outgoingOffers}
              />
            ) : null}

            {data.phase !== "DECISION" && data.phase !== "MARKET_OPEN" ? (
              <p className="rounded-xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
                Chờ giai đoạn ra quyết định hoặc chợ mở.
              </p>
            ) : null}

            <TransactionHistoryTable transactions={data.recentTransactions} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Vai trò sẽ sẵn sàng khi vào vòng chơi.
          </p>
        )}
      </ZonePhaseGate>
    </RoleTaskScreen>
  );
}
