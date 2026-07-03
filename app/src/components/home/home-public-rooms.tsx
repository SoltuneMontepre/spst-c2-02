"use client";

import { Globe, LogIn, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJoinRoom } from "@/hooks/use-session-room";
import type { PublicOpenRoom } from "@/lib/session-service";
import { cn } from "@/lib/utils";

function PublicRoomRow({ room, disabled }: { room: PublicOpenRoom; disabled?: boolean }) {
  const join = useJoinRoom();
  const seatsLeft = room.maxPlayers - room.participantCount;

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/15">
        <Globe className="size-4 text-accent" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <span className="font-mono text-sm font-semibold tracking-wider">{room.code}</span>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          Host: {room.hostDisplayName} · {room.participantCount}/{room.maxPlayers} người · còn{" "}
          {seatsLeft} chỗ
        </p>
      </div>
      <Button
        size="sm"
        className="shrink-0 gap-1.5"
        disabled={disabled || join.isPending || seatsLeft <= 0}
        onClick={() => join.mutate(room.code)}
      >
        <LogIn className="size-3.5" aria-hidden />
        {join.isPending ? "Đang vào…" : "Vào phòng"}
      </Button>
    </li>
  );
}

export function HomePublicRooms({
  rooms,
  loading,
  refreshing,
  onRefresh,
  joinDisabled,
}: {
  rooms: PublicOpenRoom[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  joinDisabled?: boolean;
}) {
  if (!loading && rooms.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">Phòng có thể vào</h2>
        {onRefresh ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
            disabled={refreshing}
            onClick={onRefresh}
            aria-label="Làm mới danh sách phòng"
            title="Làm mới"
          >
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} aria-hidden />
            Làm mới
          </Button>
        ) : null}
      </div>
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rooms.map((room) => (
            <PublicRoomRow key={room.sessionId} room={room} disabled={joinDisabled} />
          ))}
        </ul>
      )}
    </div>
  );
}
