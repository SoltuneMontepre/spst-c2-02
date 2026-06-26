"use client";

import { Factory, Store } from "lucide-react";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { ZonePhaseGate } from "@/components/session/zone-phase-gate";
import { RoleKpiRow } from "@/components/session/role-kpi-row";
import { TransactionHistoryTable } from "@/components/session/transaction-history-table";
import { RoleTaskScreen, RoleActionCard } from "@/components/session/role-task-screen";
import { ProducerInsightPanel } from "@/components/session/role-insight-panels";
import { ProducePanel } from "./produce-panel";
import { SellPanel } from "./sell-panel";
import { OffersPanel } from "./offers-panel";
import { WholesalePanel } from "./wholesale-panel";
import { unitValueVnd } from "@/lib/economy";
import { formatThousandDong } from "@/lib/money";
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
              items={[
                {
                  label: "TGLĐ cá biệt",
                  value: formatThousandDong(state.individualUnitCostVnd),
                  hint: "Chi phí/thùng của bạn",
                },
                {
                  label: "TGLĐXHCT (GT)",
                  value: formatThousandDong(social),
                  hint: "Mỏ neo giá trị",
                },
                {
                  label: "Giá thị trường",
                  value: marketPrice != null ? formatThousandDong(marketPrice) : "—",
                  hint:
                    marketPrice != null && marketPrice < social
                      ? `Thấp hơn GT ${formatThousandDong(social - marketPrice)}`
                      : "Giá thị trường",
                  valueClassName: "text-primary",
                },
                {
                  label: "Chi phí SX",
                  value: formatThousandDong(state.individualUnitCostVnd),
                  hint: "Nguyên liệu/thùng",
                },
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              {data.phase === "DECISION" || data.phase === "MARKET_OPEN" ? (
                <RoleActionCard title="Sản xuất" icon={Factory}>
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
                </RoleActionCard>
              ) : null}

              {data.phase === "MARKET_OPEN" ? (
                <RoleActionCard title="Bán hàng" icon={Store}>
                  <WholesalePanel
                    sessionId={sessionId}
                    stateVersion={data.stateVersion}
                    inventory={data.self.inventory}
                    offers={data.market?.wholesaleOffers ?? []}
                    role="PRODUCER"
                  />
                  <div className="mt-3">
                    <SellPanel
                      sessionId={sessionId}
                      stateVersion={data.stateVersion}
                      inventory={data.self.inventory}
                      listings={data.self.listings}
                    />
                  </div>
                </RoleActionCard>
              ) : null}
            </div>

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
