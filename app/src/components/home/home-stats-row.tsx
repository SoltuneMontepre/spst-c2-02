"use client";

import type { Role } from "@/generated/prisma/enums";
import { Card } from "@/components/ui/card";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { formatThousandDong } from "@/lib/money";
import type { HomeDashboardStats } from "@/lib/session-service";
import { BarChart3, Gamepad2, Layers, User } from "lucide-react";

interface HomeStatsRowProps {
  stats: HomeDashboardStats;
  loading?: boolean;
}

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-4 text-primary" aria-hidden />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">
        {loading ? (
          <span className="inline-block h-8 w-16 animate-pulse rounded bg-muted" />
        ) : (
          value
        )}
      </p>
    </Card>
  );
}

function formatTopRole(role: Role | null): string {
  if (!role) return "—";
  return ROLE_LABELS[role];
}

export function HomeStatsRow({ stats, loading }: HomeStatsRowProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Phòng đã chơi"
        value={String(stats.sessionsPlayed)}
        icon={Gamepad2}
        loading={loading}
      />
      <StatCard
        label="Tổng điểm"
        value={stats.totalScore > 0 ? formatThousandDong(stats.totalScore) : "0"}
        icon={BarChart3}
        loading={loading}
      />
      <StatCard
        label="Vòng hoàn thành"
        value={String(stats.roundsCompleted)}
        icon={Layers}
        loading={loading}
      />
      <StatCard
        label="Vai trò chính"
        value={formatTopRole(stats.topRole)}
        icon={User}
        loading={loading}
      />
    </div>
  );
}
