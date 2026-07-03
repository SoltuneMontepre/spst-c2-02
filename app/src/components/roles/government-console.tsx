"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useCommand } from "@/hooks/use-command";
import { ApiClientError } from "@/hooks/use-api";
import { RoleTaskScreen } from "@/components/session/role-task-screen";
import { GovernmentInsightPanel } from "@/components/session/role-insight-panels";
import { PolicyCard } from "./policy-card";
import { Button } from "@/components/ui/button";
import { POLICIES } from "@/lib/scenario";
import { errorMessage } from "@/lib/error-messages";
import { formatThousandDong } from "@/lib/money";
import type { GovernmentRoundState } from "@/lib/role-state";
import type { PolicyType } from "@/generated/prisma/enums";
import { PageLoading } from "@/components/ui/page-loading";

const DECISION_POLICIES: {
  type: PolicyType;
  title: string;
  description: string;
  costLabel: string;
  footer?: string;
  rounds?: number[];
  marketOpenOnly?: boolean;
}[] = [
  {
    type: "INFO_DISCLOSURE",
    title: "Công bố thông tin",
    description: "Công khai dữ liệu cung-cầu cho mọi người chơi.",
    costLabel: formatThousandDong(POLICIES.INFO_DISCLOSURE.fixedCostVnd),
    footer: "Tăng minh bạch",
  },
  {
    type: "COLD_STORAGE",
    title: "Kho lạnh dự trữ",
    description: `Bảo vệ tối đa ${POLICIES.COLD_STORAGE.maxUnits} thùng khỏi hư hỏng khi dư hàng.`,
    costLabel: `${formatThousandDong(POLICIES.COLD_STORAGE.perUnitCostVnd)}/thùng`,
    footer: "Tốn ngân sách",
  },
  {
    type: "TECH_SUPPORT",
    title: "Hỗ trợ công nghệ",
    description: "Giảm chi phí riêng cho nhà cung cấp được chọn.",
    costLabel: formatThousandDong(POLICIES.TECH_SUPPORT.fixedCostVnd),
    footer: "Tốn ngân sách",
    rounds: [2, 3],
  },
  {
    type: "EXPORT_PROMOTION",
    title: "Xúc tiến xuất khẩu",
    description: "15 giây đầu chợ mở: mua ~25% cung bán lẻ.",
    costLabel: "120k Đ",
    footer: "Chi phí cao, tác động dài hạn",
    marketOpenOnly: true,
  },
  {
    type: "NONE",
    title: "Không can thiệp",
    description: "Thị trường tự điều chỉnh qua cung-cầu.",
    costLabel: "Miễn phí",
    footer: "Không tốn ngân sách",
  },
];

export function GovernmentConsole({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  const command = useCommand(sessionId, data?.stateVersion);
  const [selected, setSelected] = useState<PolicyType>("NONE");
  if (!data?.self) return <PageLoading />;

  const state = data.self.roleState as GovernmentRoundState | null;
  const used = state?.policyUsed ?? false;
  const stats = data.liveRoundStats;
  const decisionOpen = data.phase === "DECISION" && data.currentRound >= 2;
  const exportOpen = data.phase === "MARKET_OPEN" && data.currentRound >= 2 && !used;
  const budget = data.self.balanceVnd ?? 0;
  const commandError =
    command.isError && command.error instanceof ApiClientError
      ? errorMessage(command.error.code, command.error.message)
      : null;

  const visiblePolicies = DECISION_POLICIES.filter(
    (p) => !p.rounds || p.rounds.includes(data.currentRound),
  );

  const applyPolicy = () => {
    if (selected === "EXPORT_PROMOTION") {
      command.mutate({ action: "applyPolicy", policyType: "EXPORT_PROMOTION" });
      return;
    }
    command.mutate({
      action: "applyPolicy",
      policyType: selected,
      targetIds:
        selected === "TECH_SUPPORT"
          ? data.participants
              .filter((x) => x.role === "PRODUCER")
              .slice(0, 1)
              .map((x) => x.id)
          : undefined,
    });
  };

  return (
    <RoleTaskScreen
      sessionId={sessionId}
      activeZone="task"
      role="GOVERNMENT"
      round={data.currentRound}
      phase={data.phase}
      insight={
        <GovernmentInsightPanel
          budgetVnd={budget}
          marketActivity={data.marketActivity}
        />
      }
    >
      <div className="flex flex-col gap-4">
        {stats ? (
          <div className="rounded-[14px] border border-border bg-surface p-4 shadow-sm">
            <p className="text-sm font-semibold">
              Dữ liệu thị trường tổng hợp — Vòng {data.currentRound}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-5">
              <StatTile label="Cung" value={`${stats.supplyQuantity}`} sub="thùng" />
              <StatTile label="Cầu" value={`${stats.demandQuantity}`} sub="thùng" />
              <StatTile
                label="Tồn dự kiến"
                value={`${stats.expectedInventory}`}
                sub="thùng"
              />
              <StatTile
                label="Giá trị chuẩn"
                value={formatThousandDong(stats.unitValueVnd)}
                sub="giá trị chuẩn"
              />
              <StatTile
                label="Giá TT"
                value={
                  stats.marketPriceVnd != null
                    ? formatThousandDong(stats.marketPriceVnd)
                    : "—"
                }
                sub="thị trường"
                highlight
              />
            </div>
          </div>
        ) : null}

        <div className="rounded-[10.5px] border border-border bg-surface px-3 py-2.5 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Cách chơi:</span>{" "}
          xem cung-cầu đang lệch ở đâu → chọn một công cụ quản lý → quan sát giá,
          tồn kho và nhu cầu thay đổi.
        </div>

        {used ? (
          <p className="rounded-xl bg-muted px-4 py-8 text-center text-sm">
            Đã áp dụng chính sách vòng này.
          </p>
        ) : data.currentRound < 2 ? (
          <p className="text-sm text-muted-foreground">
            Chính sách quản lý thị trường có hiệu lực từ vòng 2.
          </p>
        ) : decisionOpen || exportOpen ? (
          <>
            <p className="text-sm font-semibold">
              Chọn chính sách điều tiết cho vòng này
            </p>
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {visiblePolicies.map((p) => {
                const cardDisabled =
                  command.isPending ||
                  (p.marketOpenOnly ? !exportOpen : !decisionOpen);
                return (
                  <PolicyCard
                    key={p.type}
                    policyType={p.type}
                    title={p.title}
                    description={p.description}
                    costLabel={p.costLabel}
                    footer={p.footer}
                    selected={selected === p.type}
                    onSelect={() => setSelected(p.type)}
                    disabled={cardDisabled}
                  />
                );
              })}
            </div>

            <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                <span>Cơ quan quản lý không trực tiếp ấn định giá thị trường.</span>
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                <Button
                  disabled={
                    command.isPending ||
                    (selected === "EXPORT_PROMOTION" ? !exportOpen : !decisionOpen)
                  }
                  onClick={applyPolicy}
                >
                  {command.isPending ? "Đang áp dụng…" : "Áp dụng chính sách"}
                </Button>
                {commandError ? (
                  <p className="max-w-xs text-xs text-danger" role="alert">
                    {commandError}
                  </p>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <p className="rounded-xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
            Chờ giai đoạn ra quyết định hoặc 15 giây đầu chợ mở (xuất khẩu).
          </p>
        )}
      </div>
    </RoleTaskScreen>
  );
}

function StatTile({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-[10.5px] border border-border bg-muted/10 px-3 py-2.5 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p
        className={`mt-0.5 font-mono text-xl font-bold ${highlight ? "text-primary" : ""}`}
      >
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}
