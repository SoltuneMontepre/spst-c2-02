import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatThousandDong } from "@/lib/money";
import { ROUND_NAMES } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { RoundAnalytics } from "@/lib/session-service";

/** Actual-vs-expected recap shown during the RECAP phase (UI-RECAP-01). */
export function RoundRecapCard({
  sessionId,
  round,
}: {
  sessionId: string;
  round: RoundAnalytics;
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
        <Link
          href={`/session/${sessionId}/observatory`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Xem tháp quan sát
        </Link>
      </CardContent>
    </Card>
  );
}
