"use client";

import { AlertTriangle, Inbox, Store } from "lucide-react";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { ZonePhaseGate } from "@/components/session/zone-phase-gate";
import { RoleKpiRow } from "@/components/session/role-kpi-row";
import { TransactionHistoryTable } from "@/components/session/transaction-history-table";
import { RoleTaskScreen, RoleActionCard } from "@/components/session/role-task-screen";
import { IntermediaryInsightPanel } from "@/components/session/role-insight-panels";
import { SellPanel } from "./sell-panel";
import { OffersPanel } from "./offers-panel";
import { WholesalePanel } from "./wholesale-panel";
import { formatThousandDong } from "@/lib/money";

export function IntermediaryDashboard({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  if (!data?.self) return <p className="p-6 text-muted-foreground">Đang tải…</p>;

  const open = data.phase === "MARKET_OPEN";
  const inventoryUnits = data.self.inventory.reduce((s, l) => s + l.availableQuantity, 0);
  const listedUnits = data.self.listings.reduce((s, l) => s + l.availableQuantity, 0);
  const sellTxs = data.recentTransactions.filter((t) => t.direction === "sell");
  const soldUnits = sellTxs.reduce((s, t) => s + t.quantity, 0);
  const revenue = sellTxs.reduce((s, t) => s + t.totalPriceVnd, 0);
  const marginK =
    soldUnits > 0 ? Math.round(revenue / soldUnits / 1000) : 0;

  return (
    <RoleTaskScreen
      sessionId={sessionId}
      activeZone="task"
      role="INTERMEDIARY"
      round={data.currentRound}
      phase={data.phase}
      insight={
        <IntermediaryInsightPanel
          balanceVnd={data.self.balanceVnd}
          inventoryUnits={inventoryUnits}
          soldUnits={soldUnits}
          marginK={marginK}
        />
      }
    >
      <ZonePhaseGate
        sessionId={sessionId}
        activeZone="task"
        role={data.self.role}
        phase={data.phase}
        round={data.currentRound}
      >
        {open ? (
          <>
            <RoleKpiRow
              cols={3}
              items={[
                {
                  label: "Vốn",
                  value:
                    data.self.balanceVnd != null
                      ? formatThousandDong(data.self.balanceVnd)
                      : "—",
                  hint: "Khả dụng",
                },
                {
                  label: "Tồn kho",
                  value: `${inventoryUnits} thùng`,
                  hint: "Cần bán hết trong vòng này",
                },
                {
                  label: "Đã bán vòng này",
                  value: `${soldUnits} thùng`,
                  hint: revenue > 0 ? `Doanh thu: ${formatThousandDong(revenue)}` : undefined,
                },
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <RoleActionCard title="Đề nghị bán sỉ nhận được" icon={Inbox}>
                <WholesalePanel
                  sessionId={sessionId}
                  stateVersion={data.stateVersion}
                  inventory={data.self.inventory}
                  offers={data.market?.wholesaleOffers ?? []}
                  role="INTERMEDIARY"
                />
              </RoleActionCard>

              <RoleActionCard title="Niêm yết bán lẻ" icon={Store}>
                {listedUnits > 0 ? (
                  <p className="mb-2 text-xs text-muted-foreground">
                    {listedUnits} thùng đang niêm yết
                  </p>
                ) : null}
                <SellPanel
                  sessionId={sessionId}
                  stateVersion={data.stateVersion}
                  inventory={data.self.inventory}
                  listings={data.self.listings}
                />
              </RoleActionCard>
            </div>

            {inventoryUnits > 0 ? (
              <div className="flex items-start gap-2 rounded-[10.5px] border border-[#fee685] bg-[#fffbeb] px-3 py-2.5 text-xs text-[#7b3306]">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  Tồn kho {inventoryUnits} thùng chưa bán sẽ giảm điểm lợi nhuận cuối vòng.
                </span>
              </div>
            ) : null}

            <OffersPanel
              sessionId={sessionId}
              stateVersion={data.stateVersion}
              incoming={data.self.incomingOffers}
              outgoing={data.self.outgoingOffers}
            />

            <TransactionHistoryTable
              transactions={data.recentTransactions}
              title="Lịch sử giao dịch trung gian"
              variant="intermediary"
            />
          </>
        ) : (
          <p className="rounded-xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
            Chờ giai đoạn chợ mở để mua buôn và bán lẻ.
          </p>
        )}
      </ZonePhaseGate>
    </RoleTaskScreen>
  );
}
