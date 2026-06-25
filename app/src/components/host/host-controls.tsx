"use client";

import { Play, Pause, SkipForward, Plus, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HostAction } from "@/hooks/use-host-control";

export function HostControls({
  status,
  phase,
  paused,
  pending,
  autoHost,
  onAction,
}: {
  status: string;
  phase: string | null;
  paused: boolean;
  pending: boolean;
  autoHost?: boolean;
  onAction: (action: HostAction | { action: "setAutoHost"; autoHost: boolean }) => void;
}) {
  const inRound = status.startsWith("ROUND_");
  const canExtend = inRound && phase !== "SETTLEMENT" && phase !== "RECAP";

  return (
    <div className="flex min-h-[7.5rem] flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {status === "INTRO" ? (
          autoHost ? (
            <p className="text-sm text-muted-foreground">
              AI điều phối sẽ tự bắt đầu vòng 1…
            </p>
          ) : (
            <Button disabled={pending} onClick={() => onAction("next")}>
              <Play className="size-4" /> Bắt đầu vòng 1
            </Button>
          )
        ) : null}

        {inRound ? (
          <>
            <Button disabled={pending} onClick={() => onAction("next")}>
              <SkipForward className="size-4" />
              {phase === "RECAP" ? "Vòng tiếp theo" : "Giai đoạn tiếp"}
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => onAction(paused ? "resume" : "pause")}
            >
              {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
              {paused ? "Tiếp tục" : "Tạm dừng"}
            </Button>
            <Button
              variant="outline"
              disabled={pending || !canExtend}
              onClick={() => onAction("extend")}
            >
              <Plus className="size-4" /> Gia hạn 30s
            </Button>
          </>
        ) : null}

        {status === "DEBRIEF" ? (
          autoHost ? (
            <p className="text-sm text-muted-foreground">
              AI điều phối sẽ tự hoàn tất và lưu kết quả…
            </p>
          ) : (
            <Button disabled={pending} onClick={() => onAction("end")}>
              <Square className="size-4" /> Hoàn tất & lưu
            </Button>
          )
        ) : null}
      </div>

      <Button
        variant="destructive"
        className="mt-auto w-full sm:w-auto"
        disabled={pending}
        onClick={() => onAction("end")}
      >
        Kết thúc game
      </Button>
    </div>
  );
}
