"use client";

import Link from "next/link";
import { Wifi, X } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button, buttonVariants } from "@/components/ui/button";
import { connectionLabel } from "@/components/session/game-top-bar";
import type { SessionStreamState } from "@/hooks/use-session-stream";
import { cn } from "@/lib/utils";

export function LobbyRoomHeader({
  subtitle,
  isHost,
  onLeave,
  leavePending,
  streamState,
}: {
  subtitle: string;
  isHost: boolean;
  onLeave?: () => void;
  leavePending?: boolean;
  streamState?: SessionStreamState;
}) {
  const connected = streamState === "connected";
  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-border bg-surface/95 backdrop-blur">
      <div className="flex h-14 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          {isHost ? (
            <Link
              href="/home"
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "size-7 rounded-xl",
              )}
              aria-label="Đóng"
            >
              <X className="size-3.5" />
            </Link>
          ) : (
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
          )}
          <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
          <Brand className="shrink-0" />
          <span className="truncate text-sm font-semibold">Phòng chờ</span>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          {streamState && streamState !== "connected" ? (
            <span
              className={cn(
                "hidden items-center gap-1 text-[11px] font-semibold sm:flex",
                streamState === "disconnected" ? "text-danger" : "text-muted-foreground",
              )}
            >
              <Wifi className="size-[13px]" aria-hidden />
              {connectionLabel(streamState)}
            </span>
          ) : null}
          <p className="hidden max-w-[220px] truncate text-right text-xs text-muted-foreground lg:block">
            {subtitle}
          </p>
        </div>
      </div>
    </header>
  );
}
