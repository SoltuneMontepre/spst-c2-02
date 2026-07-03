import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartLegend } from "@/components/observatory/chart-legend";
import { PriceValueChart } from "@/components/observatory/price-value-chart";
import { formatThousandDong } from "@/lib/money";
import { ROUND_NAMES } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { RoundAnalytics, TransactionView } from "@/lib/session-service";

/** Net cash flow for `self` from this round's completed trades. */
function selfRoundGainLossVnd(transactions: TransactionView[]): number {
  return transactions.reduce(
    (sum, t) => sum + (t.direction === "sell" ? t.totalPriceVnd : -t.totalPriceVnd),
    0,
  );
}

function SelfRoundStatus({ transactions }: { transactions: TransactionView[] }) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-[14px] border border-border/80 bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
        Bạn chưa có giao dịch nào hoàn tất trong vòng này.
      </div>
    );
  }

  const netVnd = selfRoundGainLossVnd(transactions);
  const gained = netVnd >= 0;
  const Icon = gained ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[14px] border px-4 py-3",
        gained
          ? "border-success/25 bg-success/10 text-success"
          : "border-danger/25 bg-danger/10 text-danger",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <p className="text-sm font-bold">
        {gained ? "Bạn được" : "Bạn mất"} {formatThousandDong(Math.abs(netVnd))} vòng này
      </p>
    </div>
  );
}

/** Actual-vs-expected recap shown during the RECAP phase (UI-RECAP-01). */
export function RoundRecapCard({
  round,
  analytics,
  selfTransactions,
}: {
  sessionId: string;
  round: RoundAnalytics;
  analytics: RoundAnalytics[];
  selfTransactions: TransactionView[];
}) {
  const expected =
    round.number === 2
      ? "Dư cung có xu hướng kéo giá xuống dưới giá trị."
      : round.number === 3
        ? "Cầu vượt cung có xu hướng đẩy giá lên trên giá trị."
        : round.number === 4
          ? "Năng suất tăng kéo giá trị chuẩn xuống."
          : "Cung cân cầu, giá xấp xỉ giá trị.";

  const actual =
    round.marketPriceVnd === null
      ? "Không hình thành giá (không có giao dịch bán lẻ)."
      : `Giá thị trường ${formatThousandDong(round.marketPriceVnd)} so với giá trị ${formatThousandDong(round.unitValueVnd)}.`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Tổng kết vòng {round.number} · {ROUND_NAMES[round.number]}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <SelfRoundStatus transactions={selfTransactions} />

        <div>
          <p className="text-xs font-medium text-muted-foreground">Xu hướng lý thuyết</p>
          <p>{expected}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Dữ liệu phiên</p>
          <p>{actual}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Cung {round.supplyQuantity} · Cầu {round.demandQuantity} · Bán lẻ{" "}
          {round.retailSoldQuantity} · Hỏng {round.spoiledQuantity}
        </p>

        <div className="rounded-[14px] border border-border/80 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Giá trị vs Giá thị trường
            </p>
            <ChartLegend />
          </div>
          <div className="mt-2 h-[190px]">
            <PriceValueChart rounds={analytics} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
