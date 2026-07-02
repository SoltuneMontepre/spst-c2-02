"use client";

import { Landmark, Link2, ShoppingCart, Sprout } from "lucide-react";
import { ECONOMY_LABELS, ROLE_LABELS } from "@/lib/display-labels";
import { InsightSectionLabel } from "@/components/session/event-panel";
import { formatThousandDong } from "@/lib/money";
import type { ProducerRoundState } from "@/lib/role-state";
import {
  allowedProductionQuantity,
  producerFundsCapacity,
  producerProductionCapacity,
  producerRemainingCapacity,
  producerUnitCostVnd,
  unitValueVnd,
} from "@/lib/economy";

function InsightStatGrid({
  items,
}: {
  items: { value: string; label: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[10.5px] border border-stone-200/80 bg-stone-50/80 p-2 text-center"
        >
          <p className="font-mono text-sm font-bold text-stone-900">{item.value}</p>
          <p className="text-[10px] text-stone-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

function InsightRoleCard({
  role,
  icon: Icon,
  children,
}: {
  role: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[14.5px] border border-stone-200/80 bg-white p-[13px]">
      <div className="flex items-center gap-2">
        <Icon className="size-[18px] text-primary" aria-hidden />
        <p className="text-xs font-bold">{role}</p>
      </div>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

function InsightCallout({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[14.5px] border border-[#fee685] bg-[#fffbeb] p-[15px]">
      <p className="text-xs font-bold text-[#7b3306]">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-[#bb4d00]">{body}</p>
    </div>
  );
}

function InsightInfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[14.5px] border border-stone-200/80 bg-white p-3">
      <p className="text-xs font-bold text-stone-800">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-stone-600">{body}</p>
    </div>
  );
}

function InsightRowList({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-[14.5px] border border-stone-200/80 bg-white">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex items-center justify-between px-2.5 py-2 text-[11px] ${
            i < rows.length - 1 ? "border-b border-stone-100" : ""
          }`}
        >
          <span className="text-stone-500">{row.label}</span>
          <span className="font-mono font-bold text-stone-900">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ProducerInsightPanel({
  balanceVnd,
  inventoryUnits,
  producedQuantity,
  soldUnits,
  state,
  round,
}: {
  balanceVnd: number | null;
  inventoryUnits: number;
  producedQuantity: number;
  soldUnits: number;
  state: ProducerRoundState;
  round: number;
}) {
  const social = unitValueVnd(round);
  const unitCost = producerUnitCostVnd(state);
  const advantage = social - unitCost;
  const productionCapacity = producerProductionCapacity(state);
  const capacityRemaining = producerRemainingCapacity(state);
  const walletCapacity = producerFundsCapacity(balanceVnd ?? 0, unitCost);
  const maxCanProduce = allowedProductionQuantity({
    productionCapacity,
    producedQuantity: state.producedQuantity,
    balanceVnd: balanceVnd ?? 0,
    unitCostVnd: unitCost,
    availableLaborPoints: state.availableLaborPoints,
    individualLaborTime: state.individualLaborTime,
    productionCap: state.productionCap,
    individualUnitCostVnd: state.individualUnitCostVnd,
  });

  return (
    <div className="flex h-full flex-col gap-2.5 overflow-y-auto px-[15px] py-3.5">
      <InsightSectionLabel>{ROLE_LABELS.PRODUCER}</InsightSectionLabel>
      <InsightRoleCard role={ROLE_LABELS.PRODUCER} icon={Sprout}>
        <InsightStatGrid
          items={[
            {
              value:
                balanceVnd != null
                  ? formatThousandDong(balanceVnd).replace(" nghìn Đồng", "k")
                  : "—",
              label: "Ví",
            },
            {
              value: `${capacityRemaining}/${productionCapacity}`,
              label: "Sức SX",
            },
            {
              value: String(maxCanProduce),
              label: "Có thể làm",
            },
            { value: String(inventoryUnits), label: "Tồn kho" },
            { value: String(producedQuantity), label: "Đã làm" },
            { value: String(soldUnits), label: "Đã bán" },
          ]}
        />
      </InsightRoleCard>

      <InsightSectionLabel>Phân tích chi phí</InsightSectionLabel>
      <InsightRowList
        rows={[
          {
            label: "Chi phí mỗi thùng",
            value: formatThousandDong(unitCost).replace(
              " nghìn Đồng",
              "k",
            ),
          },
          {
            label: "Ví đủ làm",
            value: `${walletCapacity} thùng`,
          },
          {
            label: ECONOMY_LABELS.standardValue,
            value: formatThousandDong(social).replace(" nghìn Đồng", "k"),
          },
        ]}
      />

      <InsightCallout
        title="Vì sao chỉ làm được từng đó?"
        body={`Bạn còn ${capacityRemaining} thùng sức sản xuất. Ví hiện đủ ${walletCapacity} thùng với chi phí ${formatThousandDong(unitCost)}/thùng. Vì vậy tối đa có thể làm là ${maxCanProduce} thùng.`}
      />

      <InsightCallout
        title="Giải thích bài học"
        body={`Giá trị chuẩn là ${formatThousandDong(social)}/thùng. Trong bài học, giá trị chuẩn tương ứng với TGLĐXHCT. Chi phí riêng của bạn là ${formatThousandDong(unitCost)}/thùng.${
          advantage > 0
            ? ` Bạn có lợi thế ${formatThousandDong(advantage)}/thùng so với giá trị chuẩn.`
            : ""
        }`}
      />
    </div>
  );
}

export function ConsumerInsightPanel({
  balanceVnd,
  fulfilled,
  needTarget,
}: {
  balanceVnd: number | null;
  fulfilled: number;
  needTarget: number;
}) {
  const pct = needTarget > 0 ? Math.round((fulfilled / needTarget) * 100) : 0;
  const missing = Math.max(0, needTarget - fulfilled);

  return (
    <div className="flex h-full flex-col gap-2.5 overflow-y-auto px-[15px] py-3.5">
      <InsightSectionLabel>{ROLE_LABELS.CONSUMER}</InsightSectionLabel>
      <InsightRoleCard role={ROLE_LABELS.CONSUMER} icon={ShoppingCart}>
        <InsightStatGrid
          items={[
            {
              value:
                balanceVnd != null
                  ? formatThousandDong(balanceVnd).replace(" nghìn Đồng", "k")
                  : "—",
              label: "Ví",
            },
            {
              value: `${fulfilled}/${needTarget}`,
              label: "Nhu cầu",
            },
          ]}
        />
      </InsightRoleCard>

      <InsightInfoCard
        title="Nên làm gì tiếp?"
        body={
          missing > 0
            ? `Bạn còn cần mua ${missing} thùng. Khi chợ mở, chọn quầy có giá phù hợp rồi mua ngay hoặc trả giá.`
            : "Bạn đã mua đủ nhu cầu vòng này. Có thể quan sát giá hoặc chờ tổng kết."
        }
      />

      <InsightSectionLabel>Nhu cầu mua</InsightSectionLabel>
      <div className="rounded-[14.5px] border border-stone-200/80 bg-white p-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-stone-500">Tiến độ</span>
          <span className="font-mono font-bold">
            {fulfilled}/{needTarget}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <InsightCallout
        title="Giá niêm yết ≠ Giá TT"
        body="Giá niêm yết là đề xuất của người bán. Giá thị trường chỉ hình thành khi có giao dịch thực tế."
      />
    </div>
  );
}

export function IntermediaryInsightPanel({
  balanceVnd,
  inventoryUnits,
  soldUnits,
  marginK,
}: {
  balanceVnd: number | null;
  inventoryUnits: number;
  soldUnits: number;
  marginK: number;
}) {
  return (
    <div className="flex h-full flex-col gap-2.5 overflow-y-auto px-[15px] py-3.5">
      <InsightSectionLabel>{ROLE_LABELS.INTERMEDIARY}</InsightSectionLabel>
      <InsightRoleCard role={ROLE_LABELS.INTERMEDIARY} icon={Link2}>
        <InsightStatGrid
          items={[
            {
              value:
                balanceVnd != null
                  ? formatThousandDong(balanceVnd).replace(" nghìn Đồng", "k")
                  : "—",
              label: "Vốn",
            },
            { value: String(inventoryUnits), label: "Tồn kho" },
            { value: String(soldUnits), label: "Đã bán" },
            { value: `${marginK}k`, label: "Biên lợi nhuận" },
          ]}
        />
      </InsightRoleCard>

      {inventoryUnits > 0 ? (
        <InsightInfoCard
          title="Cảnh báo rủi ro"
          body={`Tồn kho ${inventoryUnits} thùng sẽ giảm điểm nếu không bán hết vòng này.`}
        />
      ) : null}

      <InsightCallout
        title="Luồng đại lý"
        body="Mua sỉ từ nhà cung cấp, đưa hàng ra chợ bán lẻ cho khách hàng, rồi xem lãi/lỗ từ chênh lệch giá."
      />
    </div>
  );
}

export function GovernmentInsightPanel({ budgetVnd }: { budgetVnd: number }) {
  return (
    <div className="flex h-full flex-col gap-2.5 overflow-y-auto px-[15px] py-3.5">
      <InsightSectionLabel>{ROLE_LABELS.GOVERNMENT}</InsightSectionLabel>
      <InsightRoleCard role={ROLE_LABELS.GOVERNMENT} icon={Landmark}>
        <div className="rounded-[10.5px] border border-stone-200/80 bg-stone-50/80 py-3 text-center">
          <p className="font-mono text-lg font-bold text-primary">
            {formatThousandDong(budgetVnd)}
          </p>
          <p className="text-[10px] text-stone-500">Ngân sách chính sách</p>
        </div>
      </InsightRoleCard>

      <InsightInfoCard
        title="Vấn đề → công cụ → tác động"
        body="Xem cung-cầu đang lệch ở đâu, chọn một công cụ quản lý, rồi theo dõi giá và tồn kho thay đổi thế nào."
      />

      <InsightCallout
        title="Quy luật giá trị"
        body="Cơ quan quản lý tác động gián tiếp cung-cầu nhưng không thay đổi giá trị chuẩn của hàng hóa."
      />
    </div>
  );
}
