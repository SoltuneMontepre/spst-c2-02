"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LobbyShell({
  mode,
  sessionCode,
  subtitle,
  onLeave,
  leavePending,
  headerExtra,
  children,
}: {
  mode: "lobby" | "tutorial";
  sessionCode: string;
  subtitle: string;
  onLeave?: () => void;
  leavePending?: boolean;
  headerExtra?: ReactNode;
  children: ReactNode;
}) {
  const title = mode === "tutorial" ? "Hướng dẫn vai trò" : "Phòng chờ";

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="shrink-0 border-b border-border bg-surface">
        <div className="flex h-[52px] w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            {onLeave ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-7 shrink-0 rounded-xl"
                disabled={leavePending}
                onClick={onLeave}
                aria-label="Rời phòng"
              >
                <X className="size-3.5" />
              </Button>
            ) : null}
            <div className="hidden h-4 w-px bg-border sm:block" aria-hidden />
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-5 shrink-0 items-center justify-center rounded-lg bg-primary">
                <Brand size={12} withText={false} className="[&_img]:brightness-0 [&_img]:invert" />
              </div>
              <span className="truncate text-sm font-bold">{title}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {headerExtra}
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            <span className="font-mono text-xs font-semibold text-success">{sessionCode}</span>
            <span className="text-xs text-muted-foreground">· Đang mở</span>
          </div>

          <p className="hidden max-w-[200px] truncate text-right text-xs text-muted-foreground sm:block">{subtitle}</p>
        </div>
        <p className="truncate px-4 pb-2 text-center text-xs text-muted-foreground sm:hidden">{subtitle}</p>
      </header>

      <main className={cn("w-full flex-1 px-4 py-7 sm:px-6 lg:px-8")}>{children}</main>
    </div>
  );
}
