"use client";

import { Globe, LogIn } from "lucide-react";
import { BentoTile } from "@/components/ui/bento-tile";
import { Button } from "@/components/ui/button";
import { HomeRefreshButton } from "@/components/home/home-refresh-button";
import { useJoinRoom } from "@/hooks/use-session-room";
import type { PublicOpenRoom } from "@/lib/session-service";
import { cn } from "@/lib/utils";

function formatRelativeDay(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  return date.toLocaleDateString("vi-VN", { day: "numeric", month: "short" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PublicRoomRow({ room }: { room: PublicOpenRoom }) {
  const join = useJoinRoom();
  const seatsLeft = room.maxPlayers - room.participantCount;

  return (
    <li className="rounded-xl border border-border bg-muted/10 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/15">
            <Globe className="size-4 text-accent" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold tracking-wider">
                {room.code}
              </span>
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                Công khai
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Host: {room.hostDisplayName} · {room.participantCount}/{room.maxPlayers}{" "}
              người · {room.totalRounds} vòng
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatRelativeDay(room.createdAt)} · {formatTime(room.createdAt)} · còn{" "}
              {seatsLeft} chỗ
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="w-full shrink-0 gap-1.5 sm:w-auto"
          disabled={join.isPending || seatsLeft <= 0}
          onClick={() => join.mutate(room.code)}
        >
          <LogIn className="size-3.5" aria-hidden />
          {join.isPending ? "Đang vào…" : "Vào phòng"}
        </Button>
      </div>
    </li>
  );
}

export function HomePublicRooms({
  rooms,
  loading,
}: {
  rooms: PublicOpenRoom[];
  loading?: boolean;
}) {
  return (
    <BentoTile
      title="Phòng từ người chơi khác"
      description="Phòng công khai bạn chưa tham gia — vào ngay không cần mã"
      colSpan="col-span-12"
      headerExtra={
        <div className="flex items-center gap-2">
          {rooms.length > 0 ? (
            <span className="text-xs text-muted-foreground">{rooms.length} phòng</span>
          ) : null}
          <HomeRefreshButton label="Làm mới phòng công khai" />
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <p className={cn("text-sm text-muted-foreground")}>
          Chưa có phòng công khai nào. Khi người khác mở phòng chờ, danh sách sẽ
          hiện ở đây — hoặc nhập mã phòng ở trên.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rooms.map((room) => (
            <PublicRoomRow key={room.sessionId} room={room} />
          ))}
        </ul>
      )}
    </BentoTile>
  );
}
