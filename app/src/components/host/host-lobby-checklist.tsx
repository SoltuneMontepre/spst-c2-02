"use client";

import { AlertTriangle, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ChecklistItem, RoleDistribution } from "@/lib/lobby-readiness";
import { RoleDistributionDots } from "@/components/lobby/role-distribution-dots";
import { getRoleTutorialContent } from "@/lib/role-tutorial";
import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABELS } from "@/lib/display-labels";
import { cn } from "@/lib/utils";

export function YourRolePanel({
  role,
  autoAssignRoles,
}: {
  role: Role | null;
  autoAssignRoles: boolean;
}) {
  if (autoAssignRoles) {
    return (
      <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Vai trò của bạn
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Hệ thống sẽ tự động gán vai khi phiên bắt đầu.
        </p>
      </Card>
    );
  }

  if (!role) {
    return (
      <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Vai trò của bạn
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground">Ngẫu nhiên</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Bạn sẽ được gán một vai còn trống khi phiên bắt đầu. Có thể chọn vai cụ
          thể trong danh sách Người chơi (theo số chỗ còn lại).
        </p>
      </Card>
    );
  }

  const content = getRoleTutorialContent(role);
  const Icon = content.steps[0].icon;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Vai trò của bạn
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {ROLE_LABELS[role]}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {content.steps[0].body}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function HostLobbyChecklist({
  items,
  completedCount,
  totalCount,
  roles,
}: {
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
  roles: RoleDistribution[];
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Danh sách kiểm tra</h3>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{totalCount} hoàn thành
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-success transition-all"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm",
              item.warning && !item.done && "bg-muted/40",
            )}
          >
            {item.done ? (
              <Check className="size-4 shrink-0 text-success" aria-hidden />
            ) : item.warning ? (
              <AlertTriangle className="size-4 shrink-0 text-primary" aria-hidden />
            ) : (
              <span className="size-4 shrink-0 rounded-full border border-border" />
            )}
            <span className={item.done ? "text-foreground" : "text-muted-foreground"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-border pt-4">
        <h4 className="text-xs font-semibold text-muted-foreground">Phân bổ vai trò</h4>
        <div className="mt-3">
          <RoleDistributionDots roles={roles} />
        </div>
      </div>
    </Card>
  );
}
