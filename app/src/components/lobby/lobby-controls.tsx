"use client";

import { Button } from "@/components/ui/button";
import { START_MIN_HUMANS } from "@/lib/scenario";
import { Sparkles, Play, Users } from "lucide-react";

function lobbyPresenceText({
  isHost,
  autoHost,
  humanCount,
  minHumans,
  allReady,
  selfReady,
}: {
  isHost: boolean;
  autoHost: boolean;
  humanCount: number;
  minHumans: number;
  allReady: boolean;
  selfReady: boolean;
}): string {
  if (isHost) {
    if (autoHost) {
      if (humanCount === 0) {
        return "Đang thiết lập ghế của bạn trong phòng…";
      }
      if (humanCount === 1) {
        return selfReady
          ? "Bạn (host) đã sẵn sàng — AI sẽ tự bắt đầu"
          : "Bạn là host — bấm sẵn sàng để AI bắt đầu";
      }
      if (allReady) {
        return `${humanCount} người · mọi người đã sẵn sàng`;
      }
      return `${humanCount} người · chờ mọi người (kể cả bạn) sẵn sàng`;
    }
    if (humanCount < minHumans) {
      return `${humanCount}/${minHumans} người chơi · cần thêm người`;
    }
    if (allReady) {
      return `${humanCount} người · bạn có thể bắt đầu phiên`;
    }
    return `${humanCount} người · chờ mọi người sẵn sàng`;
  }

  if (autoHost) {
    if (selfReady) {
      return allReady
        ? "Bạn đã sẵn sàng · AI sắp bắt đầu"
        : "Bạn đã sẵn sàng · chờ người khác";
    }
    return "Bấm sẵn sàng — AI sẽ tự bắt đầu khi đủ người";
  }

  if (selfReady) {
    return "Bạn đã sẵn sàng · chờ host bắt đầu";
  }
  return "Báo host khi bạn sẵn sàng chơi";
}

function autoHostStatusText({
  isHost,
  humanCount,
  minHumans,
  allReady,
  manualComplete,
  waitingAi,
}: {
  isHost: boolean;
  humanCount: number;
  minHumans: number;
  allReady: boolean;
  manualComplete: boolean;
  waitingAi: boolean;
}): string {
  if (waitingAi) return "AI đang khởi động phiên…";

  if (isHost) {
    if (humanCount < minHumans) {
      return `Cần ít nhất ${minHumans} người trong phòng.`;
    }
    if (!manualComplete) {
      return "Hoàn tất gán vai cho người chơi và bot trước.";
    }
    if (!allReady) {
      return humanCount === 1
        ? "Gán vai cho bot (nếu cần), rồi bấm «Tôi đã sẵn sàng»."
        : "Chờ mọi người (kể cả bạn) bấm sẵn sàng.";
    }
    return "Đủ điều kiện — AI sẽ bắt đầu ngay.";
  }

  if (humanCount < minHumans) {
    return `Chờ đủ ${minHumans} người trong phòng.`;
  }
  if (!allReady) {
    return "Chờ mọi người bấm sẵn sàng.";
  }
  return "Đủ điều kiện — AI sẽ bắt đầu ngay.";
}

export function LobbyControls({
  isHost,
  autoHost,
  autoHostPending,
  hostPending,
  allReady,
  manualComplete,
  humanCount,
  minHumans,
  selfReady,
  isParticipant,
  readyPending,
  onSetReady,
  onSetAutoHost,
  onStart,
}: {
  isHost: boolean;
  autoHost: boolean;
  autoHostPending: boolean;
  hostPending: boolean;
  allReady: boolean;
  manualComplete: boolean;
  humanCount: number;
  minHumans: number;
  selfReady: boolean;
  isParticipant: boolean;
  readyPending: boolean;
  onSetReady: (ready: boolean) => void;
  onSetAutoHost: (enabled: boolean) => void;
  onStart: () => void;
}) {
  const canStart =
    allReady && manualComplete && humanCount >= minHumans && !hostPending;
  const waitingAi =
    autoHost && allReady && manualComplete && humanCount >= minHumans;

  const presenceText = lobbyPresenceText({
    isHost,
    autoHost,
    humanCount,
    minHumans,
    allReady,
    selfReady,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <Users className="mt-0.5 size-4 shrink-0" />
        <span>{presenceText}</span>
      </div>

      {isHost ? (
        <>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-primary"
              checked={autoHost}
              disabled={autoHostPending}
              onChange={(e) => onSetAutoHost(e.target.checked)}
            />
            <span>
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Sparkles className="size-4 text-primary" />
                AI điều phối
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                {autoHost
                  ? "Bạn bật chế độ này — phiên tự chuyển giai đoạn khi mọi người sẵn sàng."
                  : "Để AI tự điều phối timer và lời dẫn; bạn vẫn là host phòng."}
              </span>
            </span>
          </label>

          {isParticipant ? (
            <Button
              size="lg"
              className="w-full"
              variant={selfReady ? "secondary" : "primary"}
              disabled={readyPending}
              onClick={() => onSetReady(!selfReady)}
            >
              {selfReady ? "Bỏ sẵn sàng" : "Tôi đã sẵn sàng"}
            </Button>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Đang thiết lập ghế của bạn trong phòng…
            </p>
          )}

          {autoHost ? (
            <div
              className={`rounded-xl border px-4 py-3 text-center text-sm ${
                waitingAi
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-muted/20 text-muted-foreground"
              }`}
            >
              <span className={waitingAi ? "font-medium" : undefined}>
                {autoHostStatusText({
                  isHost: true,
                  humanCount,
                  minHumans,
                  allReady,
                  manualComplete,
                  waitingAi,
                })}
              </span>
            </div>
          ) : (
            <>
              <Button
                size="lg"
                className="w-full"
                disabled={!canStart}
                onClick={onStart}
              >
                <Play className="size-4" />
                Bắt đầu phiên
              </Button>
              {humanCount < minHumans ? (
                <p className="text-center text-xs text-muted-foreground">
                  Bạn cần ít nhất {minHumans} người chơi để bắt đầu.
                </p>
              ) : !allReady ? (
                <p className="text-center text-xs text-muted-foreground">
                  Chờ mọi người chơi (kể cả bạn) bấm sẵn sàng.
                </p>
              ) : !manualComplete ? (
                <p className="text-center text-xs text-muted-foreground">
                  Hoàn tất gán vai cho người chơi và bot.
                </p>
              ) : null}
            </>
          )}
        </>
      ) : (
        <>
          <Button
            size="lg"
            className="w-full"
            variant={selfReady ? "secondary" : "primary"}
            disabled={readyPending || !isParticipant}
            onClick={() => onSetReady(!selfReady)}
          >
            {selfReady ? "Bỏ sẵn sàng" : "Tôi đã sẵn sàng"}
          </Button>
          {autoHost ? (
            <p className="text-center text-xs text-muted-foreground">
              {autoHostStatusText({
                isHost: false,
                humanCount,
                minHumans,
                allReady,
                manualComplete,
                waitingAi,
              })}
            </p>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Host sẽ bắt đầu khi đủ {minHumans} người và mọi người sẵn sàng.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function lobbyMinHumans(autoHost: boolean): number {
  return autoHost ? 1 : START_MIN_HUMANS;
}
