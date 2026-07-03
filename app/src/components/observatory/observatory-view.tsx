"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  LineChart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useSessionCancelledRedirect } from "@/hooks/use-session-cancelled-redirect";
import { GameSessionLayout } from "@/components/session/game-session-layout";
import { Card } from "@/components/ui/card";
import { ChartLegend } from "@/components/observatory/chart-legend";
import { PriceValueChart } from "@/components/observatory/price-value-chart";
import { PHASE_LABELS } from "@/lib/labels";
import { unitValueVnd } from "@/lib/economy";
import type { SessionSnapshot, TransactionView } from "@/lib/session-service";
import { cn } from "@/lib/utils";

const ENDED = ["COMPLETED", "INCOMPLETE"];

type ObservatoryStats = {
  number: number;
  unitValueVnd: number;
  marketPriceVnd: number | null;
  supplyQuantity: number;
  demandQuantity: number;
  expectedInventory: number;
  retailSoldQuantity: number;
  source: "live" | "final" | "planned";
};

function compactVnd(amountVnd: number | null | undefined, options?: { signed?: boolean }) {
  if (amountVnd == null) return "—";
  const sign = options?.signed && amountVnd > 0 ? "+" : amountVnd < 0 ? "-" : "";
  const thousands = Math.abs(amountVnd) / 1000;
  const text = Number.isInteger(thousands) ? thousands.toString() : thousands.toFixed(1);
  return `${sign}${text}k Đ`;
}

function deriveStats(data: SessionSnapshot): ObservatoryStats {
  if (data.liveRoundStats) {
    return {
      number: data.currentRound,
      unitValueVnd: data.liveRoundStats.unitValueVnd,
      marketPriceVnd: data.liveRoundStats.marketPriceVnd,
      supplyQuantity: data.liveRoundStats.supplyQuantity,
      demandQuantity: data.liveRoundStats.demandQuantity,
      expectedInventory: data.liveRoundStats.expectedInventory,
      retailSoldQuantity: 0,
      source: "live",
    };
  }

  const latest = data.analytics[data.analytics.length - 1];
  if (latest) {
    return {
      number: latest.number,
      unitValueVnd: latest.unitValueVnd,
      marketPriceVnd: latest.marketPriceVnd,
      supplyQuantity: latest.supplyQuantity,
      demandQuantity: latest.demandQuantity,
      expectedInventory: Math.max(0, latest.spoiledQuantity),
      retailSoldQuantity: latest.retailSoldQuantity,
      source: "final",
    };
  }

  const round = Math.max(1, data.currentRound || 1);
  return {
    number: round,
    unitValueVnd: unitValueVnd(round),
    marketPriceVnd: null,
    supplyQuantity: 0,
    demandQuantity: 0,
    expectedInventory: 0,
    retailSoldQuantity: 0,
    source: "planned",
  };
}

function roundBadge(data: SessionSnapshot, stats: ObservatoryStats): string {
  if (stats.source === "final") return `Vòng ${stats.number} · Đã chốt`;
  const phaseLabel = data.phase ? PHASE_LABELS[data.phase] ?? data.phase : "Đang chờ";
  if (data.phase === "MARKET_OPEN") return `Vòng ${data.currentRound} · Đang diễn ra`;
  return `Vòng ${data.currentRound || 1} · ${phaseLabel}`;
}

function relationText(stats: ObservatoryStats) {
  if (stats.source === "planned") return "Chờ dữ liệu";
  if (stats.supplyQuantity > stats.demandQuantity) return "Cung > Cầu";
  if (stats.supplyQuantity < stats.demandQuantity) return "Cung < Cầu";
  return "Cung = Cầu";
}

function marketGapText(stats: ObservatoryStats): string {
  if (stats.marketPriceVnd == null) return "Giá TT chưa hình thành";
  const diff = stats.marketPriceVnd - stats.unitValueVnd;
  if (diff === 0) return `Giá TT = ${compactVnd(stats.marketPriceVnd)}`;
  return `Giá TT = ${compactVnd(stats.marketPriceVnd)} (${diff > 0 ? "↑" : "↓"} ${compactVnd(Math.abs(diff))})`;
}

function marketGapCopy(stats: ObservatoryStats): string {
  if (stats.marketPriceVnd == null) {
    return "Chưa có giao dịch để so sánh giá thị trường với giá trị.";
  }

  const gap = Math.abs(stats.supplyQuantity - stats.demandQuantity);
  if (stats.supplyQuantity > stats.demandQuantity) {
    return `Cung dư ${gap} thùng có thể đẩy giá TT xuống dưới giá trị.`;
  }
  if (stats.supplyQuantity < stats.demandQuantity) {
    return `Cầu dư ${gap} thùng có thể đẩy giá TT lên trên giá trị.`;
  }
  return "Cung-cầu cân bằng giữ giá TT quanh giá trị.";
}

function ObservatoryPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("min-h-[286px] p-[18.5px]", className)}>
      <p className="text-[11px] font-bold uppercase leading-[16.5px] tracking-[0.275px] text-muted-foreground">
        {title}
      </p>
      {children}
    </Card>
  );
}

function SupplyDemandStatus({ stats }: { stats: ObservatoryStats }) {
  const max = Math.max(stats.supplyQuantity, stats.demandQuantity, 1);
  const supplyWidth = `${Math.max(6, (stats.supplyQuantity / max) * 100)}%`;
  const demandWidth = `${Math.max(6, (stats.demandQuantity / max) * 100)}%`;
  const PriceIcon = stats.supplyQuantity > stats.demandQuantity ? TrendingDown : TrendingUp;

  return (
    <ObservatoryPanel title="Trạng thái cung-cầu">
      <div className="mt-5 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
          <PriceIcon className="size-4" aria-hidden />
          {relationText(stats)}
        </div>
      </div>

      <div className="mt-6 space-y-3 text-xs">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-muted-foreground">Cung</span>
            <span className="font-mono font-bold text-primary">
              {stats.source === "planned" ? "—" : `${stats.supplyQuantity} thùng`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: supplyWidth }} />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-muted-foreground">Cầu</span>
            <span className="font-mono font-bold text-price">
              {stats.source === "planned" ? "—" : `${stats.demandQuantity} thùng`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-full rounded-full bg-price" style={{ width: demandWidth }} />
          </div>
        </div>
      </div>

      {stats.source === "planned" ? (
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          Cung-cầu cập nhật khi chợ mở và người chơi bắt đầu giao dịch.
        </p>
      ) : null}
    </ObservatoryPanel>
  );
}

function TransactionRows({ transactions }: { transactions: TransactionView[] }) {
  if (transactions.length === 0) {
    return (
      <p className="mt-6 text-sm leading-6 text-muted-foreground">
        Giao dịch sẽ xuất hiện sau khi lệnh mua bán hoàn tất.
      </p>
    );
  }

  return (
    <div className="mt-4 divide-y divide-border/70">
      {transactions.slice(0, 3).map((transaction) => (
        <div key={transaction.id} className="flex items-start justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{transaction.counterpartyName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {transaction.quantity}t × {compactVnd(transaction.unitPriceVnd)}
            </p>
          </div>
          <p className="shrink-0 font-mono text-xs font-bold text-primary">
            {compactVnd(transaction.totalPriceVnd)}
          </p>
        </div>
      ))}
    </div>
  );
}

function EconomicAnalysis({ stats }: { stats: ObservatoryStats }) {
  return (
    <ObservatoryPanel title="Phân tích kinh tế">
      <div className="mt-5 rounded-[14.5px] bg-muted/25 p-3">
        <p className="text-sm font-bold leading-5">
          Giá trị = {compactVnd(stats.unitValueVnd)} (cố định)
        </p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Cung-cầu thay đổi nhưng giá trị không thay đổi.
        </p>
      </div>

      <div className="mt-3 rounded-[14.5px] border border-amber-200 bg-amber-50 p-3">
        <p className="text-sm font-bold leading-5 text-amber-900">
          {marketGapText(stats)}
        </p>
        <p className="mt-1 text-sm leading-6 text-amber-800">
          {marketGapCopy(stats)}
        </p>
      </div>
    </ObservatoryPanel>
  );
}

function InsightLabel({ children }: { children: ReactNode }) {
  return (
    <p className="pt-1 text-[9px] font-bold uppercase leading-[13.5px] tracking-[1.35px] text-muted-foreground">
      {children}
    </p>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[36.5px] items-center justify-between gap-3 border-b border-border/70 px-2.5 py-2 last:border-b-0">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-right font-mono text-xs font-bold text-foreground">
        {value}
      </span>
    </div>
  );
}

function ObservatoryInsightPanel({
  sessionId,
  stats,
  transactions,
  className,
}: {
  sessionId: string;
  stats: ObservatoryStats;
  transactions: TransactionView[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="rounded-[14.5px] border border-amber-200 bg-amber-50 p-[15px]">
        <div className="flex items-center gap-1.5">
          <BookOpen className="size-3.5 text-amber-800" aria-hidden />
          <p className="text-[11px] font-bold uppercase tracking-[0.275px] text-amber-900">
            Giá trị = Mỏ neo
          </p>
        </div>
        <p className="mt-1.5 text-xs leading-[19.5px] text-amber-900">
          Dù cung-cầu biến động mạnh, giá trị vẫn cố định ở{" "}
          {compactVnd(stats.unitValueVnd)}. Giá TT dao động xung quanh neo này.
        </p>
      </div>

      <InsightLabel>Tóm tắt vòng {stats.number}</InsightLabel>

      <div className="rounded-[14.5px] border border-border/80 bg-surface">
        <SummaryRow label="Giao dịch thành công" value={`${transactions.length}`} />
        <SummaryRow
          label="Hàng tồn chưa bán"
          value={stats.source === "planned" ? "—" : `${stats.expectedInventory} thùng`}
        />
        <SummaryRow label="Giá GD trung bình" value={compactVnd(stats.marketPriceVnd)} />
      </div>

      <Link
        href={`/session/${sessionId}/game`}
        className="inline-flex items-center justify-center gap-2 rounded-[14.5px] bg-foreground px-4 py-2.5 text-xs font-bold text-background transition-colors hover:bg-foreground/90"
      >
        Xem tổng kết
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </div>
  );
}

function DashboardHeader({
  data,
  stats,
}: {
  data: SessionSnapshot;
  stats: ObservatoryStats;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2.5">
        <LineChart className="size-5 text-muted-foreground" aria-hidden />
        <h1 className="text-xl font-black tracking-tight text-foreground">
          Quan sát thị trường
        </h1>
      </div>
      <div className="inline-flex w-fit items-center gap-2 rounded-[14.5px] border border-price/25 bg-price/10 px-4 py-2 text-xs font-bold text-price">
        <span className="size-2 rounded-full bg-price" aria-hidden />
        {roundBadge(data, stats)}
      </div>
    </div>
  );
}

function ObservatoryDashboard({
  data,
  stats,
}: {
  data: SessionSnapshot;
  stats: ObservatoryStats;
}) {
  return (
    <div className="flex w-full flex-col gap-3.5">
      <DashboardHeader data={data} stats={stats} />

      <Card className="p-[18.5px]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-base font-bold tracking-tight">
            Giá trị vs Giá thị trường
          </h2>
          <ChartLegend />
        </div>
        <div className="mt-3 h-[210px]">
          <PriceValueChart
            rounds={data.analytics}
            liveStats={data.liveRoundStats}
            currentRound={data.currentRound}
          />
        </div>
        {stats.marketPriceVnd == null && stats.source !== "planned" ? (
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Chưa có giao dịch thành công nên chưa có đường giá thị trường. Mũi tên chỉ
            áp lực cung-cầu: cầu vượt cung có xu hướng đẩy giá lên, nhưng không tự tạo
            ra một mức giá.
          </p>
        ) : null}
      </Card>

      <div className="grid gap-3.5 md:grid-cols-3">
        <SupplyDemandStatus stats={stats} />
        <ObservatoryPanel title="Giao dịch đã xác lập">
          <TransactionRows transactions={data.recentTransactions} />
        </ObservatoryPanel>
        <EconomicAnalysis stats={stats} />
      </div>
    </div>
  );
}

export function ObservatoryView({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { data, isLoading } = useSessionSnapshot(sessionId);

  useSessionCancelledRedirect(data?.status, "solo_timeout");

  useEffect(() => {
    if (!data) return;
    if (data.status === "LOBBY") router.replace(`/session/${sessionId}/lobby`);
    else if (ENDED.includes(data.status) || data.status === "DEBRIEF") {
      router.replace(`/session/${sessionId}/debrief`);
    }
  }, [data, router, sessionId]);

  if (isLoading || !data) {
    return <p className="p-6 text-muted-foreground">Đang tải phiên…</p>;
  }

  const stats = deriveStats(data);
  const rightPanel = (
    <ObservatoryInsightPanel
      sessionId={sessionId}
      stats={stats}
      transactions={data.recentTransactions}
    />
  );

  return (
    <GameSessionLayout
      sessionId={sessionId}
      activeZone="observatory"
      variant="focused"
      rightPanel={rightPanel}
    >
      <ObservatoryDashboard data={data} stats={stats} />
      <ObservatoryInsightPanel
        sessionId={sessionId}
        stats={stats}
        transactions={data.recentTransactions}
        className="lg:hidden"
      />
    </GameSessionLayout>
  );
}
