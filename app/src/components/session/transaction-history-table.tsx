"use client";

import type { TransactionView } from "@/lib/session-service";
import { formatThousandDong } from "@/lib/money";
import { cn } from "@/lib/utils";

const CHANNEL_LABELS: Record<string, string> = {
  WHOLESALE: "Bán sỉ",
  RETAIL: "Bán lẻ",
  EXPORT: "Xuất khẩu",
};

export function TransactionHistoryTable({
  transactions,
  title = "Lịch sử giao dịch",
  variant = "default",
}: {
  transactions: TransactionView[];
  title?: string;
  variant?: "default" | "intermediary";
}) {
  const isIntermediary = variant === "intermediary";

  if (transactions.length === 0) {
    return (
      <div className="overflow-hidden rounded-[14px] border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">{title}</p>
        </div>
        <p className="px-4 py-6 text-sm text-muted-foreground">
          Chưa có giao dịch trong vòng này.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-semibold">Thời gian</th>
              {isIntermediary ? (
                <>
                  <th className="px-4 py-2.5 font-semibold">Loại</th>
                  <th className="px-4 py-2.5 font-semibold">Đối tác</th>
                </>
              ) : (
                <th className="px-4 py-2.5 font-semibold">Người mua</th>
              )}
              <th className="px-4 py-2.5 font-semibold">Số lượng</th>
              <th className="px-4 py-2.5 font-semibold">Giá giao dịch</th>
              {isIntermediary ? (
                <th className="px-4 py-2.5 font-semibold">Chênh lệch</th>
              ) : null}
              <th className="px-4 py-2.5 font-semibold">Tổng thu</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="h-[46px] border-b border-border/60 last:border-0"
              >
                <td className="px-4 text-xs text-muted-foreground">
                  {new Date(tx.completedAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                {isIntermediary ? (
                  <>
                    <td className="px-4 text-xs">
                      {CHANNEL_LABELS[tx.channel] ?? tx.channel}
                    </td>
                    <td className="px-4">{tx.counterpartyName}</td>
                  </>
                ) : (
                  <td className="px-4">{tx.counterpartyName}</td>
                )}
                <td className="px-4 font-mono tabular-nums">{tx.quantity}</td>
                <td className="px-4 font-mono tabular-nums text-primary">
                  {formatThousandDong(tx.unitPriceVnd)}
                </td>
                {isIntermediary ? (
                  <td className="px-4 font-mono text-xs tabular-nums text-muted-foreground">
                    —
                  </td>
                ) : null}
                <td
                  className={cn(
                    "px-4 font-mono font-semibold tabular-nums",
                    tx.direction === "sell" ? "text-success" : "text-foreground",
                  )}
                >
                  {tx.direction === "sell" ? "+" : "-"}
                  {formatThousandDong(tx.totalPriceVnd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
