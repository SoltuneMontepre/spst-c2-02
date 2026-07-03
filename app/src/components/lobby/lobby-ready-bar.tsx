"use client";

import Link from "next/link";
import { LogOut, Timer } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LobbyReadyBar({
  statusText,
  selfReady,
  readyPending,
  isParticipant,
  onSetReady,
  showAutoStart,
  startCountdown,
  isHost,
  onLeave,
  leavePending,
}: {
  statusText: string;
  selfReady: boolean;
  readyPending: boolean;
  isParticipant: boolean;
  onSetReady: (ready: boolean) => void;
  showAutoStart: boolean;
  startCountdown: number | null;
  isHost: boolean;
  onLeave: () => void;
  leavePending: boolean;
}) {
  const leaveButtonClass =
    "gap-1.5 rounded-[4px] border border-danger px-4 py-1.5 text-sm font-medium uppercase tracking-[0.02em] text-danger shadow-none transition-colors hover:bg-danger/[0.04] active:bg-danger/[0.12]";

  return (
    <div className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="hidden flex-1 text-sm font-semibold tabular-nums text-muted-foreground sm:block">
          {statusText}
        </p>

        <Button
          type="button"
          size="lg"
          className={cn(
            "w-full max-w-xl gap-2 rounded-xl px-14 py-6 text-base shadow-lg sm:w-auto",
            selfReady && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          )}
          variant={selfReady ? "secondary" : "primary"}
          disabled={readyPending || !isParticipant}
          onClick={() => onSetReady(!selfReady)}
        >
          {selfReady ? "Bỏ sẵn sàng" : "Tôi đã sẵn sàng"}
        </Button>

        <div className="flex flex-1 flex-wrap items-center justify-center gap-3 sm:justify-end">
          {showAutoStart ? (
            startCountdown !== null ? (
              <div
                className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary"
                role="status"
                aria-live="polite"
              >
                <Timer className="size-4 animate-pulse" aria-hidden />
                Bắt đầu sau {startCountdown}s
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Tự động bắt đầu khi mọi người sẵn sàng
              </p>
            )
          ) : null}

          {isHost ? (
            <Link
              href="/home"
              className={cn(buttonVariants({ variant: "outline" }), leaveButtonClass)}
            >
              <LogOut className="size-4" aria-hidden />
              Rời phòng
            </Link>
          ) : (
            <Button
              type="button"
              variant="outline"
              className={leaveButtonClass}
              disabled={leavePending}
              onClick={onLeave}
            >
              <LogOut className="size-4" aria-hidden />
              Rời phòng
            </Button>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground sm:hidden">{statusText}</p>
    </div>
  );
}
