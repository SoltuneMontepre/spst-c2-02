"use client";

import Link from "next/link";
import { Plus, LogIn, DoorClosed, Play, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJoinRoom } from "@/hooks/use-session-room";
import type { ActiveHostedSession } from "@/lib/session-service";
import { MAX_ACTIVE_HOST_ROOMS } from "@/lib/scenario";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ApiClientError } from "@/hooks/use-api";
import { errorMessage } from "@/lib/error-messages";

function sessionHref(room: ActiveHostedSession, asHost: boolean): string {
  if (asHost) return `/host/session/${room.id}`;
  // Lobby vs in-game: player entry always goes through session routes.
  if (room.status === "LOBBY" || room.status === "CREATED") {
    return `/session/${room.id}/lobby`;
  }
  if (room.status === "DEBRIEF") {
    return `/session/${room.id}/debrief`;
  }
  return `/session/${room.id}/game`;
}

function CurrentRoomNotice({
  title,
  body,
  room,
  asHost,
}: {
  title: string;
  body: string;
  room?: ActiveHostedSession | null;
  asHost?: boolean;
}) {
  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
        <DoorClosed className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
      {room ? (
        <Link
          href={sessionHref(room, asHost ?? false)}
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          Quay lại {room.code}
        </Link>
      ) : null}
    </Card>
  );
}

export function HomeHeroCards({
  activeHostedSessions = [],
  activeJoinedSession = null,
}: {
  activeHostedSessions?: ActiveHostedSession[];
  activeJoinedSession?: ActiveHostedSession | null;
}) {
  const joinRoom = useJoinRoom();
  const [code, setCode] = useState("");
  const isHosting = activeHostedSessions.length > 0;
  const isPlaying = activeJoinedSession != null;
  const atHostLimit = activeHostedSessions.length >= MAX_ACTIVE_HOST_ROOMS;
  const canCreate = !atHostLimit;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed) joinRoom.mutate(trimmed);
  };

  const joinError =
    joinRoom.isError && joinRoom.error instanceof ApiClientError
      ? errorMessage(joinRoom.error.code, joinRoom.error.message)
      : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card
        className={cn(
          "relative overflow-hidden border-0 bg-primary p-6 text-primary-foreground shadow-md",
        )}
      >
        <div className="relative z-10 flex h-full flex-col gap-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Plus className="size-5" aria-hidden />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-tight">
              {isHosting ? "Phòng đang mở" : "Tạo phòng mới"}
            </h2>
            <p className="text-sm text-primary-foreground/80">
              {isHosting
                ? `Bạn đang host ${activeHostedSessions.length}/${MAX_ACTIVE_HOST_ROOMS} phòng.`
                : "Mở phiên chợ mới và mời bạn bè tham gia qua mã phòng."}
            </p>
          </div>

          {isHosting ? (
            <ul className="flex flex-col gap-2">
              {activeHostedSessions.map((room) => (
                <li key={room.id}>
                  <Link
                    href={`/host/session/${room.id}`}
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "lg" }),
                      "w-full bg-surface text-foreground hover:bg-surface/90",
                    )}
                  >
                    Quay lại {room.code}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          {canCreate ? (
            <Link
              href="/home/create"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "w-full bg-surface text-foreground hover:bg-surface/90",
              )}
            >
              {isHosting ? "Tạo phòng thêm" : "Tạo phòng"}
            </Link>
          ) : (
            <p className="text-xs text-primary-foreground/80">
              Đã đạt tối đa {MAX_ACTIVE_HOST_ROOMS} phòng host. Hủy hoặc kết thúc một
              phòng để tạo mới.
            </p>
          )}
        </div>
        <div
          className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary-foreground/10 blur-2xl"
          aria-hidden
        />
      </Card>

      {isHosting ? (
        <CurrentRoomNotice
          title="Đang host phòng khác"
          body="Bạn không thể vào phòng khác khi đang host. Quay lại phòng bên cạnh và hủy hoặc kết thúc nó trước, rồi mới vào phòng mới."
          room={activeHostedSessions[0]}
          asHost
        />
      ) : isPlaying ? (
        <CurrentRoomNotice
          title="Đang trong phòng khác"
          body="Bạn đang tham gia một phiên chợ. Quay lại phòng đó hoặc rời phòng trước khi vào phòng mới."
          room={activeJoinedSession}
        />
      ) : (
        <Card className="flex flex-col gap-4 p-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <LogIn className="size-5 text-primary" aria-hidden />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-tight">Vào phòng</h2>
            <p className="text-sm text-muted-foreground">
              Nhập mã phòng 6 ký tự để tham gia phiên chợ đang mở.
            </p>
          </div>
          <form onSubmit={handleJoin} className="flex items-center gap-2.5">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="MÃ PHÒNG"
              maxLength={6}
              className="h-14 min-w-0 flex-1 text-center font-mono text-lg font-bold tracking-[0.25em] uppercase"
              aria-label="Mã phòng"
            />
            <Button
              type="submit"
              size="icon"
              className="size-14 shrink-0 rounded-2xl"
              disabled={joinRoom.isPending || code.trim().length < 4}
              aria-label="Vào phòng"
            >
              {joinRoom.isPending ? (
                <Loader2 className="size-5 animate-spin" aria-hidden />
              ) : (
                <Play className="size-5 fill-current" aria-hidden />
              )}
            </Button>
          </form>
          {joinError ? (
            <p className="text-sm text-danger" role="alert">
              {joinError}
            </p>
          ) : null}
        </Card>
      )}
    </div>
  );
}
