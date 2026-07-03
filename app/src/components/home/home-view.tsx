"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Gamepad2, History, LogOut, Settings } from "lucide-react";
import { HomeHeroCards } from "@/components/home/home-hero-cards";
import { HomePublicRooms } from "@/components/home/home-public-rooms";
import { RoomCancelledBanner } from "@/components/home/room-cancelled-banner";
import { apiFetch } from "@/hooks/use-api";
import { useHomeStream } from "@/hooks/use-home-stream";
import type { HomeDashboard } from "@/lib/session-service";
import { formatThousandDong } from "@/lib/money";

const EMPTY_STATS = {
  sessionsPlayed: 0,
  totalScore: 0,
  roundsCompleted: 0,
  topRole: null,
} as const;

export function HomeView({
  user,
}: {
  user: { name?: string | null; email?: string | null };
}) {
  useHomeStream();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["home-dashboard"],
    queryFn: () => apiFetch<HomeDashboard>("/api/me/home-dashboard"),
    refetchOnWindowFocus: true,
  });

  const stats = data?.stats ?? EMPTY_STATS;
  const displayName = user.name || user.email || "Người chơi";
  const isHosting = (data?.activeHostedSessions.length ?? 0) > 0;

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background px-4 py-6 sm:px-6">
      <div
        className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 size-72 rounded-full bg-accent/10 blur-3xl"
        aria-hidden
      />

      <header className="relative z-10 flex w-full max-w-2xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/dragonfruit.svg"
            alt=""
            width={32}
            height={32}
            priority
            className="size-8 shrink-0 object-contain"
          />
          <span className="text-sm font-black leading-tight text-foreground">
            Thanh Long Market
          </span>
        </div>
        <nav className="flex items-center gap-1.5" aria-label="Tài khoản">
          <Link
            href="/home/history"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label="Lịch sử phòng"
            title="Lịch sử"
          >
            <History className="size-4" aria-hidden />
          </Link>
          <Link
            href="/profile"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label="Cấu hình tài khoản"
            title="Cấu hình"
          >
            <Settings className="size-4" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/auth" })}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label="Đăng xuất"
            title="Đăng xuất"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </nav>
      </header>

      <div className="relative z-10 w-full max-w-2xl">
        <Suspense fallback={null}>
          <RoomCancelledBanner />
        </Suspense>
      </div>

      <div className="relative z-10 mt-6 flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-sm">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold uppercase text-foreground">
          {displayName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
          {user.email ? (
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          ) : null}
        </div>
        <div className="hidden shrink-0 items-center gap-3 text-xs text-muted-foreground sm:flex">
          <span className="flex items-center gap-1" title="Phòng đã chơi">
            <Gamepad2 className="size-3.5" aria-hidden />
            {stats.sessionsPlayed}
          </span>
          <span className="flex items-center gap-1" title="Tổng điểm">
            <BarChart3 className="size-3.5" aria-hidden />
            {stats.totalScore > 0 ? formatThousandDong(stats.totalScore) : 0}
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-8 w-full max-w-2xl">
        <HomeHeroCards
          activeHostedSessions={data?.activeHostedSessions}
          activeJoinedSession={data?.activeJoinedSession}
        />
      </div>

      <div className="relative z-10 mt-8 w-full max-w-2xl">
        <HomePublicRooms
          rooms={data?.publicOpenRooms ?? []}
          loading={isLoading}
          refreshing={isFetching}
          onRefresh={() => void refetch()}
          joinDisabled={isHosting}
        />
      </div>
    </div>
  );
}
