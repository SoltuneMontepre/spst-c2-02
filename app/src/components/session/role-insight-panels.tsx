"use client";

import { Landmark, Link2, ShoppingCart, Sprout } from "lucide-react";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { InsightSectionLabel } from "@/components/session/event-panel";
import { formatThousandDong } from "@/lib/money";
import type { ProducerRoundState } from "@/lib/role-state";
import { unitValueVnd } from "@/lib/economy";

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
  const advantage = social - state.individualUnitCostVnd;

  return (
    <div className="flex h-full flex-col gap-2.5 overflow-y-auto px-[15px] py-3.5">
      <InsightSectionLabel>Người sản xuất</InsightSectionLabel>
      <InsightRoleCard role="Người sản xuất" icon={Sprout}>
        <InsightStatGrid
          items={[
            {
              value:
                balanceVnd != null
                  ? formatThousandDong(balanceVnd).replace(" nghìn Đồng", "k")
                  : "—",
              label: "Ví",
            },
            { value: String(inventoryUnits), label: "Tồn kho" },
            { value: String(producedQuantity), label: "Đã SX" },
            { value: String(soldUnits), label: "Đã bán" },
          ]}
        />
      </InsightRoleCard>

      <InsightSectionLabel>Phân tích chi phí</InsightSectionLabel>
      <InsightRowList
        rows={[
          {
            label: "Chi phí cá biệt",
            value: formatThousandDong(state.individualUnitCostVnd).replace(
              " nghìn Đồng",
              "k",
            ),
          },
          {
            label: "TGLĐXHCT (GT)",
            value: formatThousandDong(social).replace(" nghìn Đồng", "k"),
          },
          {
            label: "Giá thị trường",
            value: "—",
          },
        ]}
      />

      <InsightCallout
        title="Giá trị hàng hóa"
        body={`TGLĐXHCT = ${formatThousandDong(social)}. Chi phí cá biệt = ${formatThousandDong(state.individualUnitCostVnd)}.${
          advantage > 0
            ? ` Bạn có lợi thế ${formatThousandDong(advantage)}/thùng so với giá trị xã hội.`
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

  return (
    <div className="flex h-full flex-col gap-2.5 overflow-y-auto px-[15px] py-3.5">
      <InsightSectionLabel>Người tiêu dùng</InsightSectionLabel>
      <InsightRoleCard role="Người tiêu dùng" icon={ShoppingCart}>
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
      <InsightSectionLabel>Trung gian</InsightSectionLabel>
      <InsightRoleCard role="Trung gian" icon={Link2}>
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
        title="Vai trò trung gian"
        body="Trung gian kết nối cung và cầu, tạo tiện ích thời gian và địa điểm cho thị trường."
      />
    </div>
  );
}

export function GovernmentInsightPanel({ budgetVnd }: { budgetVnd: number }) {
  return (
    <div className="flex h-full flex-col gap-2.5 overflow-y-auto px-[15px] py-3.5">
      <InsightSectionLabel>Nhà nước</InsightSectionLabel>
      <InsightRoleCard role={ROLE_LABELS.GOVERNMENT} icon={Landmark}>
        <div className="rounded-[10.5px] border border-stone-200/80 bg-stone-50/80 py-3 text-center">
          <p className="font-mono text-lg font-bold text-primary">
            {formatThousandDong(budgetVnd)}
          </p>
          <p className="text-[10px] text-stone-500">Ngân sách chính sách</p>
        </div>
      </InsightRoleCard>

      <InsightInfoCard
        title="Quyền hạn Nhà nước"
        body="Không trực tiếp ấn định giá TT. Chính sách chỉ tác động gián tiếp lên cung-cầu."
      />

      <InsightCallout
        title="Quy luật giá trị"
        body="Nhà nước tác động gián tiếp cung-cầu nhưng không thay đổi giá trị xã hội của hàng hóa."
      />
    </div>
  );
}
