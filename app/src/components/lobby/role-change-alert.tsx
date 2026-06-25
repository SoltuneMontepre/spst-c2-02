"use client";

import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { Button } from "@/components/ui/button";
import { roleTutorialIcon } from "@/lib/role-tutorial";
import type { RoleChangeNotice } from "@/hooks/use-self-role-change";
import { cn } from "@/lib/utils";

function roleLabel(role: Role | null): string {
  return role ? ROLE_LABELS[role] : "Chưa phân vai";
}

function noticeMessage({ previousRole, newRole }: RoleChangeNotice): string {
  if (previousRole && newRole && previousRole !== newRole) {
    return `Từ ${roleLabel(previousRole)} → ${roleLabel(newRole)}`;
  }
  if (!previousRole && newRole) {
    return `Host đã gán bạn vai trò: ${roleLabel(newRole)}`;
  }
  if (previousRole && !newRole) {
    return "Host đã gỡ vai trò của bạn";
  }
  return `Vai trò mới: ${roleLabel(newRole)}`;
}

export function RoleChangeAlert({
  notice,
  onDismiss,
  onOpenTutorial,
}: {
  notice: RoleChangeNotice;
  onDismiss: () => void;
  onOpenTutorial?: () => void;
}) {
  const { newRole } = notice;
  const Icon = newRole ? roleTutorialIcon(newRole) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
      role="dialog"
      aria-modal
      aria-labelledby="role-change-title"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {Icon ? (
          <div
            className={cn(
              "mx-auto flex size-14 items-center justify-center rounded-2xl border bg-primary/10",
            )}
          >
            <Icon className="size-7 text-primary" aria-hidden />
          </div>
        ) : null}
        <h2
          id="role-change-title"
          className={cn("text-center text-lg font-bold tracking-tight", Icon && "mt-4")}
        >
          Vai trò của bạn đã được cập nhật
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {noticeMessage(notice)}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {newRole && onOpenTutorial ? (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onOpenTutorial();
                onDismiss();
              }}
            >
              Xem hướng dẫn vai trò
            </Button>
          ) : null}
          <Button className="flex-1" onClick={onDismiss}>
            Đã hiểu
          </Button>
        </div>
      </div>
    </div>
  );
}
