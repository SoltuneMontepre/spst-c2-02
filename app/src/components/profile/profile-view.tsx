"use client";

import { useQuery } from "@tanstack/react-query";
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
  const { data, isLoading } = useQuery({
    queryKey: ["profile-dashboard"],
    queryFn: () => apiFetch<ProfileDashboard>("/api/me/profile-dashboard"),
  });

  const profile = data?.profile;
  const stats = data?.stats ?? EMPTY_STATS;

  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto grid w-full flex-1 max-w-7xl grid-cols-12 gap-4 p-4 pb-10 sm:gap-5 sm:p-6 lg:px-8">
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
