"use client";

import { useState } from "react";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useCommand } from "@/hooks/use-command";
import { GameSessionLayout } from "@/components/session/game-session-layout";
import { PolicyCard } from "./policy-card";
import { Button } from "@/components/ui/button";
import { POLICIES } from "@/lib/scenario";
import { formatThousandDong } from "@/lib/money";
import type { GovernmentRoundState } from "@/lib/role-state";
import type { PolicyType } from "@/generated/prisma/enums";
import { Card } from "@/components/ui/card";
import { PHASE_LABELS } from "@/lib/labels";

const DECISION_POLICIES: {
  type: PolicyType;
  title: string;
  description: string;
  costLabel: string;
  footer?: string;
  rounds?: number[];
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
    description: "Nhà nước mua 20 thùng để giảm dư cung.",
    costLabel: formatThousandDong(POLICIES.COLD_STORAGE.perUnitCostVnd * 20),
    footer: "Tốn ngân sách",
  },
  {
    type: "TECH_SUPPORT",
    title: "Hỗ trợ công nghệ",
    description: "Giảm TGLĐ cá biệt cho NSX được chọn.",
    costLabel: formatThousandDong(POLICIES.TECH_SUPPORT.fixedCostVnd),
    footer: "Tốn ngân sách",
    rounds: [2, 3],
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
  if (!data?.self) return <p className="p-6 text-muted-foreground">Đang tải…</p>;

  const state = data.self.roleState as GovernmentRoundState | null;
  const used = state?.policyUsed ?? false;
  const stats = data.liveRoundStats;
  const decisionOpen = data.phase === "DECISION" && data.currentRound >= 2;
  const exportOpen = data.phase === "MARKET_OPEN" && data.currentRound >= 2 && !used;
  const phaseLabel = data.phase ? PHASE_LABELS[data.phase] : "";
  const budget = data.self.balanceVnd ?? 0;

  const rightPanel = (
    <>
      <Card className="p-4 text-center">
        <p className="text-3xl font-bold text-primary">{formatThousandDong(budget)}</p>
        <p className="mt-1 text-sm text-muted-foreground">Ngân sách chính sách</p>
      </Card>
      <Card className="border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
        <p className="text-xs font-bold uppercase">Quyền hạn nhà nước</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Nhà nước chỉ tác động gián tiếp qua cung, cầu và thông tin — không ấn định giá TT.
        </p>
      </Card>
      <Card className="border-sky-200/80 bg-sky-50/80 p-4 dark:border-sky-900/40 dark:bg-sky-950/30">
        <p className="text-xs font-bold uppercase">Quy luật giá trị</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Can thiệp cung-cầu không thay đổi giá trị xã hội của hàng hóa.
        </p>
      </Card>
    </>
  );

  return (
    <GameSessionLayout
      sessionId={sessionId}
      activeZone="task"
      title="Nhiệm vụ — Nhà nước"
      subtitle={`Vòng ${data.currentRound} · ${phaseLabel}`}
      rightPanel={rightPanel}
    >
      <div className="flex flex-col gap-4">
        {stats ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard label="Cung" value={`${stats.supplyQuantity} thùng`} tone="violet" />
            <StatCard label="Cầu" value={`${stats.demandQuantity} thùng`} tone="sky" />
            <StatCard
              label="Tồn dự kiến"
              value={`${stats.expectedInventory} thùng`}
              tone="amber"
            />
            <StatCard
              label="Giá trị GT"
              value={formatThousandDong(stats.unitValueVnd)}
              tone="muted"
            />
            <StatCard
              label="Giá TT"
              value={
                stats.marketPriceVnd != null
                  ? formatThousandDong(stats.marketPriceVnd)
                  : "—"
              }
              tone="primary"
            />
          </div>
        ) : null}

        {used ? (
          <p className="rounded-xl bg-muted px-4 py-8 text-center text-sm">
            Đã áp dụng chính sách vòng này.
          </p>
        ) : data.currentRound < 2 ? (
          <p className="text-sm text-muted-foreground">
            Chính sách Nhà nước có hiệu lực từ vòng 2.
          </p>
        ) : exportOpen ? (
          <Card className="p-4">
            <p className="font-medium">Xúc tiến xuất khẩu</p>
            <p className="mt-1 text-sm text-muted-foreground">
              15 giây đầu chợ mở: mua ~25% cung bán lẻ.
            </p>
            <Button
              className="mt-3"
              disabled={command.isPending}
              onClick={() =>
                command.mutate({ action: "applyPolicy", policyType: "EXPORT_PROMOTION" })
              }
            >
              Kích hoạt xuất khẩu
            </Button>
          </Card>
        ) : decisionOpen ? (
          <>
            <p className="text-sm font-semibold">
              Chọn chính sách điều tiết cho vòng này
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {DECISION_POLICIES.filter(
                (p) => !p.rounds || p.rounds.includes(data.currentRound),
              ).map((p) => (
                <PolicyCard
                  key={p.type}
                  title={p.title}
                  description={p.description}
                  costLabel={p.costLabel}
                  footer={p.footer}
                  selected={selected === p.type}
                  onSelect={() => setSelected(p.type)}
                  disabled={command.isPending}
                />
              ))}
            </div>
            <Card className="border-amber-200/80 bg-amber-50/80 p-3 text-sm dark:border-amber-900/40 dark:bg-amber-950/30">
              Nhà nước không trực tiếp ấn định giá thị trường.
            </Card>
            <Button
              size="lg"
              className="w-full sm:w-auto"
              disabled={command.isPending}
              onClick={() =>
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
                })
              }
            >
              Áp dụng chính sách
            </Button>
          </>
        ) : (
          <p className="rounded-xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
            Chờ giai đoạn ra quyết định hoặc 15 giây đầu chợ mở (xuất khẩu).
          </p>
        )}
      </div>
    </GameSessionLayout>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "violet" | "sky" | "amber" | "muted" | "primary";
}) {
  const tones = {
    violet: "border-violet-200/80 bg-violet-50/50",
    sky: "border-sky-200/80 bg-sky-50/50",
    amber: "border-amber-200/80 bg-amber-50/50",
    muted: "border-border bg-muted/20",
    primary: "border-primary/30 bg-primary/5",
  };
  return (
    <Card className={`p-3 ${tones[tone]}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </Card>
  );
}
