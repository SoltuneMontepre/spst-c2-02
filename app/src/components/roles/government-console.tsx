"use client";

import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useCommand } from "@/hooks/use-command";
import { GameBentoShell } from "@/components/session/game-bento-shell";
import { SupplyDemandMeter } from "@/components/learning/supply-demand-meter";
import { Button } from "@/components/ui/button";
import { POLICIES } from "@/lib/scenario";
import { formatThousandDong } from "@/lib/money";
import type { GovernmentRoundState } from "@/lib/role-state";
import type { PolicyType } from "@/generated/prisma/enums";

const DECISION_POLICIES: {
  type: PolicyType;
  title: string;
  description: string;
  costLabel: string;
  rounds?: number[];
}[] = [
  {
    type: "INFO_DISCLOSURE",
    title: "Công bố thông tin",
    description: "Hiện chính xác tổng cầu mục tiêu của vòng.",
    costLabel: formatThousandDong(POLICIES.INFO_DISCLOSURE.fixedCostVnd),
  },
  {
    type: "COLD_STORAGE",
    title: "Kho lạnh",
    description: "Bảo quản tối đa 3 thùng — giảm hàng hỏng cuối vòng.",
    costLabel: `${formatThousandDong(POLICIES.COLD_STORAGE.perUnitCostVnd)}/thùng`,
  },
  {
    type: "TECH_SUPPORT",
    title: "Hỗ trợ công nghệ",
    description: "Giảm 50% chi phí nâng cấp cho một nhà sản xuất (vòng 2–3).",
    costLabel: formatThousandDong(POLICIES.TECH_SUPPORT.fixedCostVnd),
    rounds: [2, 3],
  },
  {
    type: "NONE",
    title: "Không can thiệp",
    description: "Giữ ngân sách; thị trường tự điều chỉnh.",
    costLabel: "0",
  },
];

export function GovernmentConsole({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  const command = useCommand(sessionId, data?.stateVersion);
  if (!data?.self) return <p className="p-6 text-muted-foreground">Đang tải…</p>;

  const state = data.self.roleState as GovernmentRoundState | null;
  const used = state?.policyUsed ?? false;
  const latest = data.analytics[data.analytics.length - 1];
  const decisionOpen = data.phase === "DECISION" && data.currentRound >= 2;
  const exportOpen = data.phase === "MARKET_OPEN" && data.currentRound >= 2 && !used;

  return (
    <GameBentoShell
      sessionId={sessionId}
      activeZone="task"
      guidanceContext={{
        screen: "government",
        phase: data.phase,
        round: data.currentRound,
      }}
    >
      <div className="flex flex-col gap-4">
        {latest ? (
          <SupplyDemandMeter
            embedded
            supply={latest.supplyQuantity}
            demand={latest.demandQuantity}
            theoryTrend={
              data.currentRound === 2 ? "down" : data.currentRound === 3 ? "up" : "neutral"
            }
          />
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
        <div className="rounded-xl border border-border bg-muted/10 p-4 text-sm">
          <p className="font-medium">Xúc tiến xuất khẩu</p>
          <p className="mt-1 text-muted-foreground">
            15 giây đầu chợ mở: mua ~25% cung bán lẻ, giá tối đa bằng giá trị xã hội.
          </p>
          <Button
            className="mt-3"
            size="sm"
            disabled={command.isPending}
            onClick={() =>
              command.mutate({ action: "applyPolicy", policyType: "EXPORT_PROMOTION" })
            }
          >
            Kích hoạt xuất khẩu
          </Button>
        </div>
      ) : decisionOpen ? (
        <ul className="flex flex-col gap-2">
          {DECISION_POLICIES.filter(
            (p) => !p.rounds || p.rounds.includes(data.currentRound),
          ).map((p) => (
            <li
              key={p.type}
              className="rounded-xl border border-border bg-muted/10 p-4 text-sm"
            >
              <p className="font-medium">{p.title}</p>
              <p className="mt-1 text-muted-foreground">{p.description}</p>
              <p className="mt-1 font-medium">Chi phí: {p.costLabel}</p>
              <Button
                className="mt-2"
                size="sm"
                disabled={command.isPending}
                onClick={() =>
                  command.mutate({
                    action: "applyPolicy",
                    policyType: p.type,
                    targetIds:
                      p.type === "TECH_SUPPORT"
                        ? data.participants
                            .filter((x) => x.role === "PRODUCER")
                            .slice(0, 1)
                            .map((x) => x.id)
                        : undefined,
                  })
                }
              >
                Áp dụng
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
          Chờ giai đoạn ra quyết định hoặc 15 giây đầu chợ mở (xuất khẩu).
        </p>
      )}
      </div>
    </GameBentoShell>
  );
}
