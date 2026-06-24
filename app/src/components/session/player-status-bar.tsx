import { Wallet } from "lucide-react";
import type { SelfState } from "@/lib/session-service";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { formatThousandDong } from "@/lib/money";

export function PlayerStatusBar({ self }: { self: SelfState | null }) {
  if (!self) return null;
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-2.5 text-sm">
      <span className="font-medium">
        {self.role ? ROLE_LABELS[self.role] : "Quan sát viên"}
      </span>
      {self.balanceVnd !== null ? (
        <span className="flex items-center gap-1.5 font-semibold text-primary">
          <Wallet className="size-4" />
          {formatThousandDong(self.balanceVnd)}
        </span>
      ) : null}
    </div>
  );
}
