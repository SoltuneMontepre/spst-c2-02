"use client";

import Link from "next/link";
import { Plus, LogIn } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJoinRoom } from "@/hooks/use-session-room";
import type { ActiveHostedSession } from "@/lib/session-service";
import { MAX_ACTIVE_HOST_ROOMS } from "@/lib/scenario";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function HomeHeroCards({
  activeHostedSessions = [],
}: {
  activeHostedSessions?: ActiveHostedSession[];
}) {
  const joinRoom = useJoinRoom();
  const [code, setCode] = useState("");
  const atHostLimit = activeHostedSessions.length >= MAX_ACTIVE_HOST_ROOMS;
  const canCreate = !atHostLimit;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed) joinRoom.mutate(trimmed);
  };

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
              {activeHostedSessions.length > 0 ? "Phòng đang mở" : "Tạo phòng mới"}
            </h2>
            <p className="text-sm text-primary-foreground/80">
              {activeHostedSessions.length > 0
                ? `Bạn đang host ${activeHostedSessions.length}/${MAX_ACTIVE_HOST_ROOMS} phòng.`
                : "Mở phiên chợ mới và mời bạn bè tham gia qua mã phòng."}
            </p>
          </div>

          {activeHostedSessions.length > 0 ? (
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
              {activeHostedSessions.length > 0 ? "Tạo phòng thêm" : "Tạo phòng"}
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
        <form onSubmit={handleJoin} className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Mã phòng"
            maxLength={6}
            className="font-mono tracking-widest uppercase"
            aria-label="Mã phòng"
          />
          <Button
            type="submit"
            size="lg"
            className="shrink-0 sm:px-8"
            disabled={joinRoom.isPending || code.trim().length < 4}
          >
            {joinRoom.isPending ? "Đang vào…" : "Vào phòng"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
