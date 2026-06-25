"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import type { LiveRoundStats } from "@/lib/session-service";
import { formatThousandDong } from "@/lib/money";
import { Card } from "@/components/ui/card";

export function MarketSnapshotPanel({ stats }: { stats: LiveRoundStats | null }) {
  if (!stats) {
    return (
      <Card className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Snapshot thị trường
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Dữ liệu cập nhật khi chợ mở.
        </p>
      </Card>
    );
  }

  const supplyExceeds = stats.supplyQuantity > stats.demandQuantity;
  const priceBelowValue =
    stats.marketPriceVnd != null && stats.marketPriceVnd < stats.unitValueVnd;

  return (
    <div className="flex flex-col gap-3">
      <Card className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Snapshot thị trường
        </p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Giá trị</dt>
            <dd className="font-semibold">{formatThousandDong(stats.unitValueVnd)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Giá thị trường</dt>
            <dd className="flex items-center gap-1 font-semibold text-primary">
              {stats.marketPriceVnd != null
                ? formatThousandDong(stats.marketPriceVnd)
                : "—"}
              {priceBelowValue ? (
                <TrendingDown className="size-3.5" aria-hidden />
              ) : stats.marketPriceVnd != null ? (
                <TrendingUp className="size-3.5 text-success" aria-hidden />
              ) : null}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Cung</dt>
            <dd className="font-semibold text-violet-700 dark:text-violet-300">
              {stats.supplyQuantity} thùng
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Cầu</dt>
            <dd className="font-semibold text-sky-700 dark:text-sky-300">
              {stats.demandQuantity} thùng
            </dd>
          </div>
        </dl>
      </Card>

      {supplyExceeds ? (
        <Card className="border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
          <p className="text-xs font-bold uppercase text-amber-900 dark:text-amber-100">
            Cung &gt; Cầu
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cung vượt cầu → giá TT có xu hướng giảm. Tác động lên giá cả, không lên giá trị.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
