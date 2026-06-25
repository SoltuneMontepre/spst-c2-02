"use client";

import { useSessionSnapshot } from "@/hooks/use-session-room";
import { GameSessionLayout } from "@/components/session/game-session-layout";
import { ZonePhaseGate } from "@/components/session/zone-phase-gate";
import { RoleKpiRow } from "@/components/session/role-kpi-row";
import { TransactionHistoryTable } from "@/components/session/transaction-history-table";
import { SellPanel } from "./sell-panel";
import { OffersPanel } from "./offers-panel";
import { WholesalePanel } from "./wholesale-panel";
import { formatThousandDong } from "@/lib/money";
import { PHASE_LABELS } from "@/lib/labels";
import { Card } from "@/components/ui/card";

export function IntermediaryDashboard({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  if (!data?.self) return <p className="p-6 text-muted-foreground">Đang tải…</p>;

  const open = data.phase === "MARKET_OPEN";
  const inventoryUnits = data.self.inventory.reduce((s, l) => s + l.availableQuantity, 0);
  const listedUnits = data.self.listings.reduce((s, l) => s + l.availableQuantity, 0);
  const soldUnits = data.recentTransactions
    .filter((t) => t.direction === "sell")
    .reduce((s, t) => s + t.quantity, 0);
  const revenue = data.recentTransactions
    .filter((t) => t.direction === "sell")
    .reduce((s, t) => s + t.totalPriceVnd, 0);
  const phaseLabel = data.phase ? PHASE_LABELS[data.phase] : "";

  const rightPanel = (
    <>
      <Card className="p-4">
        <p className="text-sm font-semibold">Trung gian</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Vốn</dt>
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
            <dt className="text-muted-foreground">Đã bán</dt>
            <dd className="font-bold">{soldUnits}</dd>
          </div>
        </dl>
      </Card>
      {inventoryUnits > 0 ? (
        <Card className="border-danger/30 bg-danger/5 p-4">
          <p className="text-xs font-bold uppercase text-danger">Cảnh báo tồn kho</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tồn kho {inventoryUnits} thùng chưa bán sẽ giảm điểm lợi nhuận cuối vòng.
          </p>
        </Card>
      ) : null}
      <Card className="border-sky-200/80 bg-sky-50/80 p-4 dark:border-sky-900/40 dark:bg-sky-950/30">
        <p className="text-xs font-bold uppercase">Vai trò trung gian</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Kết nối cung và cầu — mua buôn từ NSX, bán lẻ cho NTD.
        </p>
      </Card>
    </>
  );

  return (
    <GameSessionLayout
      sessionId={sessionId}
      activeZone="task"
      title="Nhiệm vụ — Trung gian"
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
        {open ? (
          <div className="flex flex-col gap-4">
            <RoleKpiRow
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
              <Card className="p-4">
                <p className="mb-3 font-semibold">Đề nghị bán sỉ nhận được</p>
                <WholesalePanel
                  sessionId={sessionId}
                  stateVersion={data.stateVersion}
                  inventory={data.self.inventory}
                  offers={data.market?.wholesaleOffers ?? []}
                  role="INTERMEDIARY"
                />
              </Card>
              <Card className="p-4">
                <p className="mb-3 font-semibold">Niêm yết bán lẻ</p>
                {listedUnits > 0 ? (
                  <p className="mb-2 text-sm text-muted-foreground">
                    {listedUnits} thùng đang niêm yết
                  </p>
                ) : null}
                <SellPanel
                  sessionId={sessionId}
                  stateVersion={data.stateVersion}
                  inventory={data.self.inventory}
                  listings={data.self.listings}
                />
              </Card>
            </div>

            <OffersPanel
              sessionId={sessionId}
              stateVersion={data.stateVersion}
              incoming={data.self.incomingOffers}
              outgoing={data.self.outgoingOffers}
            />

            <TransactionHistoryTable
              transactions={data.recentTransactions}
              title="Lịch sử giao dịch trung gian"
            />
          </div>
        ) : (
          <p className="rounded-xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
            Chờ giai đoạn chợ mở để mua buôn và bán lẻ.
          </p>
        )}
      </ZonePhaseGate>
    </GameSessionLayout>
  );
}
