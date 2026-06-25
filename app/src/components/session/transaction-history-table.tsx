"use client";

import type { TransactionView } from "@/lib/session-service";
import { formatThousandDong } from "@/lib/money";
import { Card } from "@/components/ui/card";

export function TransactionHistoryTable({
  transactions,
  title = "Lịch sử giao dịch",
}: {
  transactions: TransactionView[];
  title?: string;
}) {
  if (transactions.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-2 text-sm text-muted-foreground">Chưa có giao dịch trong vòng này.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Thời gian</th>
              <th className="px-4 py-2 font-medium">Đối tác</th>
              <th className="px-4 py-2 font-medium">SL</th>
              <th className="px-4 py-2 font-medium">Đơn giá</th>
              <th className="px-4 py-2 font-medium">Tổng</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(tx.completedAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-2">{tx.counterpartyName}</td>
                <td className="px-4 py-2 tabular-nums">{tx.quantity}</td>
                <td className="px-4 py-2 tabular-nums text-primary">
                  {formatThousandDong(tx.unitPriceVnd)}
                </td>
                <td className="px-4 py-2 tabular-nums font-medium text-success">
                  {tx.direction === "sell" ? "+" : "-"}
                  {formatThousandDong(tx.totalPriceVnd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
