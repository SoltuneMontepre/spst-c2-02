"use client";

import { formatThousandDong } from "@/lib/money";

/** UI-WALLET-01 — wallet with money theory tooltip (LT-06). */
export function WalletDisplay({
  balanceVnd,
  className,
}: {
  balanceVnd: number;
  className?: string;
}) {
  return (
    <span
      className={className}
      title="Tiền là thước đo giá trị và phương tiện lưu thông; giá trị biểu hiện thành giá cả (LT-06)."
      aria-label={`${balanceVnd.toLocaleString("vi-VN")} Đồng`}
    >
      {formatThousandDong(balanceVnd)}
    </span>
  );
}
