"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import type { LiveRoundStats } from "@/lib/session-service";
import { formatThousandDong } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function InsightSnapshotRows({ stats }: { stats: LiveRoundStats }) {
  const supplyExceeds = stats.supplyQuantity > stats.demandQuantity;
  const priceBelowValue =
    stats.marketPriceVnd != null && stats.marketPriceVnd < stats.unitValueVnd;
  const priceAboveValue =
    stats.marketPriceVnd != null && stats.marketPriceVnd > stats.unitValueVnd;

  return (
    <>
      <div className="rounded-[14.5px] border border-stone-200/80 bg-white">
        <div className="flex items-center justify-between border-b border-stone-100 px-2.5 py-2">
          <span className="text-[11px] text-stone-500">Giá trị</span>
          <div className="text-right">
            <p className="font-mono text-xs font-bold text-stone-900">
              {formatThousandDong(stats.unitValueVnd)}
            </p>
            <p className="text-[10px] text-stone-400">Neo cố định</p>
          </div>
        </div>
        <div className="flex items-center justify-between border-b border-stone-100 px-2.5 py-2">
          <span className="text-[11px] text-stone-500">Giá thị trường</span>
          <div className="text-right">
            <p className="font-mono text-xs font-bold text-stone-900">
              {stats.marketPriceVnd != null
                ? formatThousandDong(stats.marketPriceVnd)
                : "—"}
            </p>
            {stats.marketPriceVnd != null ? (
              <p
                className={cn(
                  "text-[10px]",
                  priceBelowValue
                    ? "text-amber-700"
                    : priceAboveValue
                      ? "text-emerald-700"
                      : "text-stone-400",
                )}
              >
                {priceBelowValue ? "↓ Đang giảm" : priceAboveValue ? "↑ Đang tăng" : "—"}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-between border-b border-stone-100 px-2.5 py-2">
          <span className="text-[11px] text-stone-500">Cung</span>
          <p className="font-mono text-xs font-bold text-violet-700">
            {stats.supplyQuantity} thùng
          </p>
        </div>
        <div className="flex items-center justify-between px-2.5 py-2">
          <span className="text-[11px] text-stone-500">Cầu</span>
          <p className="font-mono text-xs font-bold text-sky-700">
            {stats.demandQuantity} thùng
          </p>
        </div>
      </div>

      {supplyExceeds ? (
        <div className="rounded-[14.5px] border border-[#fee685] bg-[#fffbeb] p-[15px]">
          <p className="flex items-center gap-1 text-xs font-bold text-[#7b3306]">
            Cung &gt; Cầu
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#bb4d00]">
            Cung vượt cầu → giá TT có xu hướng giảm. Tác động lên giá cả, không lên
            giá trị.
          </p>
        </div>
      ) : null}
    </>
  );
}

export function MarketSnapshotPanel({
  stats,
  variant = "default",
}: {
  stats: LiveRoundStats | null;
  variant?: "default" | "insight";
}) {
  if (!stats) {
    if (variant === "insight") {
      return (
        <div className="rounded-[14.5px] border border-stone-200/80 bg-white p-3">
          <p className="text-[11px] text-stone-500">
            Dữ liệu cập nhật khi chợ mở.
          </p>
        </div>
      );
    }

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

  if (variant === "insight") {
    return <InsightSnapshotRows stats={stats} />;
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
