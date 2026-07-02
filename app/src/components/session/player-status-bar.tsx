"use client";

import { Wallet } from "lucide-react";
import type { SelfState } from "@/lib/session-service";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { WalletDisplay } from "@/components/learning/wallet-display";
import { HelpHint } from "@/components/learning/help-hint";

export function PlayerStatusBar({ self }: { self: SelfState | null }) {
  if (!self) return null;
  return (
    <div className="flex items-center justify-between rounded-[14px] border border-border bg-surface px-4 py-2.5 text-sm">
      <span className="font-medium">
        {self.role ? ROLE_LABELS[self.role] : "Quan sát viên"}
        <HelpHint text="Mỗi vai có mục tiêu điểm khác nhau: lợi nhuận, hiệu ích, hay điểm xã hội." />
      </span>
      {self.balanceVnd !== null ? (
        <span className="flex items-center gap-1.5 font-semibold text-primary">
          <Wallet className="size-4" />
          <WalletDisplay balanceVnd={self.balanceVnd} />
          <HelpHint text="Tiền là thước đo giá trị và phương tiện lưu thông; giá trị biểu hiện thành giá cả khi giao dịch." />
        </span>
      ) : null}
    </div>
  );
}
