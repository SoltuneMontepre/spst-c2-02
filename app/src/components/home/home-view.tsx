"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, User } from "lucide-react";
import { SessionNav } from "@/components/session/session-nav";
import { BentoTile } from "@/components/ui/bento-tile";
import { HomeDashboardHeader } from "@/components/home/home-dashboard-header";
import { HomeHeroCards } from "@/components/home/home-hero-cards";
import { HomeStatsRow } from "@/components/home/home-stats-row";
import { HomeRecentSessions } from "@/components/home/home-recent-sessions";
import { HomePublicRooms } from "@/components/home/home-public-rooms";
import { apiFetch } from "@/hooks/use-api";
import { useHomeStream } from "@/hooks/use-home-stream";
import type { HomeDashboard } from "@/lib/session-service";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMPTY_STATS = {
  sessionsPlayed: 0,
  totalScore: 0,
  roundsCompleted: 0,
  topRole: null,
} as const;

export function HomeView({ displayName }: { displayName: string }) {
  const queryClient = useQueryClient();
  useHomeStream();

  const { data, isLoading } = useQuery({
    queryKey: ["home-dashboard"],
    queryFn: () => apiFetch<HomeDashboard>("/api/me/home-dashboard"),
    refetchOnWindowFocus: true,
  });

  const invalidateDashboard = () =>
    queryClient.invalidateQueries({ queryKey: ["home-dashboard"] });

  const stats = data?.stats ?? EMPTY_STATS;
  const recentSessions = data?.recentSessions ?? [];
  const publicOpenRooms = data?.publicOpenRooms ?? [];

  return (
    <div className="flex min-h-full flex-col">
      <SessionNav
        displayName={displayName}
        sessionLabel="Trang chủ"
        hideHomeLink
      />

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-12 gap-4 p-4 pb-10 sm:gap-5 sm:p-6">
        <div className="col-span-12 flex flex-col justify-center lg:col-span-8">
          <HomeDashboardHeader displayName={displayName} />
        </div>

        <BentoTile
          title="Tài khoản"
          description="Hồ sơ và hướng dẫn"
          colSpan="col-span-12 lg:col-span-4"
        >
          <div className="flex flex-col gap-2">
            <Link
              href="/profile"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "justify-start gap-2",
              )}
            >
              <User className="size-4 shrink-0" />
              Xem hồ sơ
            </Link>
            <p className="flex items-start gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
              <BookOpen className="mt-0.5 size-4 shrink-0" />
              Bật chế độ hướng dẫn từ thanh trên cùng khi vào phòng hoặc phiên
              chơi.
            </p>
          </div>
        </BentoTile>

        <div className="col-span-12">
          <HomeHeroCards activeHostedSessions={data?.activeHostedSessions} />
        </div>

        <div className="col-span-12">
          <HomeStatsRow stats={stats} loading={isLoading} />
        </div>

        <div className="col-span-12">
          <HomePublicRooms rooms={publicOpenRooms} loading={isLoading} />
        </div>

        <HomeRecentSessions
          sessions={recentSessions}
          loading={isLoading}
          onRefresh={invalidateDashboard}
        />
      </main>
    </div>
  );
}
