"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SessionNav } from "@/components/session/session-nav";
import { Button } from "@/components/ui/button";
import { ProfileSummaryCard, ProfileStatsCard } from "@/components/profile/profile-summary-card";
import { ProfileInfoForm } from "@/components/profile/profile-info-form";
import { ProfileSecurityCard } from "@/components/profile/profile-security-card";
import { ProfileBadgesCard } from "@/components/profile/profile-badges-card";
import { ProfileLearningProgressCard } from "@/components/profile/profile-learning-progress";
import { apiFetch } from "@/hooks/use-api";
import type { ProfileDashboard } from "@/lib/profile-service";

const EMPTY_STATS = {
  sessionsPlayed: 0,
  totalScore: 0,
  roundsCompleted: 0,
  wins: 0,
  topRole: null,
} as const;

export function ProfileView({ displayName }: { displayName: string }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["profile-dashboard"],
    queryFn: () => apiFetch<ProfileDashboard>("/api/me/profile-dashboard"),
  });

  const remove = useMutation({
    mutationFn: () => apiFetch("/api/me", { method: "DELETE" }),
    onSuccess: () => {
      window.location.href = "/auth";
    },
  });

  const profile = data?.profile;
  const stats = data?.stats ?? EMPTY_STATS;

  return (
    <div className="flex min-h-full flex-col">
      <SessionNav displayName={displayName} sessionLabel="Hồ sơ cá nhân" />

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-12 gap-4 p-4 pb-10 sm:gap-5 sm:p-6">
        <div className="col-span-12">
          <h1 className="text-2xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
        </div>

        <div className="col-span-12 flex flex-col gap-4 lg:col-span-3">
          <ProfileSummaryCard
            displayName={profile?.displayName ?? displayName}
            school={profile?.school ?? null}
            gradeClass={profile?.gradeClass ?? null}
            topRole={stats.topRole}
            proficiencyStars={data?.proficiencyStars ?? 0}
            loading={isLoading}
          />
          <ProfileStatsCard stats={stats} loading={isLoading} />
        </div>

        <div className="col-span-12 flex flex-col gap-4 lg:col-span-5">
          {profile ? <ProfileInfoForm profile={profile} /> : null}
          <ProfileSecurityCard />
          <Button
            variant="destructive"
            size="sm"
            className="self-start"
            disabled={remove.isPending}
            onClick={() => {
              if (confirm("Xóa tài khoản? Hành động không thể hoàn tác.")) {
                remove.mutate();
                queryClient.invalidateQueries({ queryKey: ["profile-dashboard"] });
              }
            }}
          >
            {remove.isPending ? "Đang xóa…" : "Xóa tài khoản"}
          </Button>
        </div>

        <div className="col-span-12 flex flex-col gap-4 lg:col-span-4">
          <ProfileBadgesCard badges={data?.badges ?? []} loading={isLoading} />
          <ProfileLearningProgressCard
            topics={data?.learningProgress ?? []}
            loading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}
