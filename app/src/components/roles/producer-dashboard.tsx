"use client";

import { useSessionSnapshot } from "@/hooks/use-session-room";
import { GameSessionLayout } from "@/components/session/game-session-layout";
import { ZonePhaseGate } from "@/components/session/zone-phase-gate";
import { RoleKpiRow } from "@/components/session/role-kpi-row";
import { TransactionHistoryTable } from "@/components/session/transaction-history-table";
import { LaborValueCard } from "./labor-value-card";
import { ProducePanel } from "./produce-panel";
import { SellPanel } from "./sell-panel";
import { OffersPanel } from "./offers-panel";
import { WholesalePanel } from "./wholesale-panel";
import { unitValueVnd } from "@/lib/economy";
import { formatThousandDong } from "@/lib/money";
import { PHASE_LABELS } from "@/lib/labels";
import type { ProducerRoundState } from "@/lib/role-state";
import { Card } from "@/components/ui/card";

export function ProducerDashboard({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  if (!data?.self) return <p className="p-6 text-muted-foreground">Đang tải…</p>;

  const state = data.self.roleState as ProducerRoundState | null;
  const social = unitValueVnd(data.currentRound);
  const marketPrice = data.liveRoundStats?.marketPriceVnd;
  const inventoryUnits = data.self.inventory.reduce((s, l) => s + l.availableQuantity, 0);
  const phaseLabel = data.phase ? PHASE_LABELS[data.phase] : "";

  const rightPanel = state?.kind === "PRODUCER" ? (
    <>
      <Card className="p-4">
        <p className="text-sm font-semibold">Tóm tắt</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Ví</dt>
            <dd className="font-bold">
              {data.self.balanceVnd != null
                ? formatThousandDong(data.self.balanceVnd)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tồn kho</dt>
            <dd className="font-bold">{inventoryUnits}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Đã SX</dt>
            <dd className="font-bold">{state.producedQuantity}</dd>
          </div>
        </dl>
      </Card>
      <Card className="border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
        <p className="text-xs font-bold uppercase">Phân tích chi phí</p>
        <p className="mt-2 text-sm text-muted-foreground">
          TGLĐXH = {formatThousandDong(social)}. Chi phí cá biệt ={" "}
          {formatThousandDong(state.individualUnitCostVnd)}.
          {state.individualUnitCostVnd < social
            ? ` Lợi thế +${formatThousandDong(social - state.individualUnitCostVnd)}/thùng.`
            : null}
        </p>
      </Card>
    </>
  ) : null;

  return (
    <GameSessionLayout
      sessionId={sessionId}
      activeZone="task"
      title="Nhiệm vụ — Người sản xuất"
      subtitle={`Vòng ${data.currentRound} · ${phaseLabel}`}
      rightPanel={rightPanel}
    >
      <ZonePhaseGate
        sessionId={sessionId}
        activeZone="task"
        role={data.self.role}
        phase={data.phase}
        round={data.currentRound}
      >
        {state?.kind === "PRODUCER" ? (
          <div className="flex flex-col gap-4">
            <RoleKpiRow
              items={[
                {
                  label: "TGLĐ cá biệt",
                  value: formatThousandDong(state.individualUnitCostVnd),
                  hint: "Chi phí/thùng của bạn",
                },
                {
                  label: "TGLĐXH",
                  value: formatThousandDong(social),
                  hint: "Mỏ neo giá trị",
                },
                {
                  label: "Giá TT",
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

            {data.phase === "DECISION" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="p-4">
                  <p className="mb-3 font-semibold">Sản xuất</p>
                  <LaborValueCard state={state} round={data.currentRound} />
                  <div className="mt-3">
                    <ProducePanel
                      sessionId={sessionId}
                      state={state}
                      balanceVnd={data.self.balanceVnd ?? 0}
                      stateVersion={data.stateVersion}
                      currentRound={data.currentRound}
                    />
                  </div>
                </Card>
              </div>
            ) : null}

            {data.phase === "MARKET_OPEN" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="p-4">
                  <p className="mb-3 font-semibold">Bán hàng</p>
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
                </Card>
                <OffersPanel
                  sessionId={sessionId}
                  stateVersion={data.stateVersion}
                  incoming={data.self.incomingOffers}
                  outgoing={data.self.outgoingOffers}
                />
              </div>
            ) : null}

            {data.phase !== "DECISION" && data.phase !== "MARKET_OPEN" ? (
              <p className="rounded-xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
                Chờ giai đoạn ra quyết định hoặc chợ mở.
              </p>
            ) : null}

            <TransactionHistoryTable transactions={data.recentTransactions} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Vai trò sẽ sẵn sàng khi vào vòng chơi.
          </p>
        )}
      </ZonePhaseGate>
    </GameSessionLayout>
  );
}
