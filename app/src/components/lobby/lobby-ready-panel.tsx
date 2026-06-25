"use client";

import type { RoleDistribution } from "@/lib/lobby-readiness";
import { RoleDistributionDots } from "@/components/lobby/role-distribution-dots";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LobbyReadyPanel({
  selfReady,
  readyPending,
  isParticipant,
  roleDistribution,
  onSetReady,
}: {
  selfReady: boolean;
  readyPending: boolean;
  isParticipant: boolean;
  roleDistribution: RoleDistribution[];
  onSetReady: (ready: boolean) => void;
}) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-amber-500" aria-hidden />
          <p className="text-sm font-semibold text-amber-900">
            Đang chờ host bắt đầu
          </p>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-amber-800/90">
          Nhấn nút bên dưới để báo hiệu bạn đã sẵn sàng tham gia phiên chợ.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground">
          Phân bổ vai trò
        </p>
        <div className="mt-3">
          <RoleDistributionDots roles={roleDistribution} compact />
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        className={cn(
          "mt-auto w-full rounded-xl",
          selfReady && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        )}
        variant={selfReady ? "secondary" : "primary"}
        disabled={readyPending || !isParticipant}
        onClick={() => onSetReady(!selfReady)}
      >
        {selfReady ? "Bỏ sẵn sàng" : "Tôi đã sẵn sàng"}
      </Button>
    </div>
  );
}
