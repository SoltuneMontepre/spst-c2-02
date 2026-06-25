"use client";

import type { Role } from "@/generated/prisma/enums";
import { User, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RoleBadge } from "@/components/lobby/role-badge";
import { cn } from "@/lib/utils";
import type { ProfileStats } from "@/lib/profile-service";
import { formatTopRoleShort } from "@/lib/profile-labels";
import { formatThousandDong } from "@/lib/money";

interface ProfileSummaryCardProps {
  displayName: string;
  school: string | null;
  gradeClass: string | null;
  topRole: Role | null;
  proficiencyStars: number;
  loading?: boolean;
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center gap-0.5" aria-label={`${count} trên 5 sao`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < count ? "fill-primary text-primary" : "text-muted-foreground/30",
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function ProfileSummaryCard({
  displayName,
  school,
  gradeClass,
  topRole,
  proficiencyStars,
  loading,
}: ProfileSummaryCardProps) {
  const subtitle = [school, gradeClass ? `Lớp ${gradeClass}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className="flex flex-col items-center gap-4 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <User className="size-8" aria-hidden />
      </div>
      {loading ? (
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{displayName}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Chưa cập nhật trường/lớp</p>
            )}
          </div>
          {topRole ? <RoleBadge role={topRole} /> : null}
          <div className="flex flex-col gap-1">
            <StarRating count={proficiencyStars} />
            <p className="text-xs text-muted-foreground">Mức độ thành thạo</p>
          </div>
        </>
      )}
    </Card>
  );
}

export function ProfileStatsCard({
  stats,
  loading,
}: {
  stats: ProfileStats;
  loading?: boolean;
}) {
  const rows = [
    { label: "Phiên đã chơi", value: String(stats.sessionsPlayed) },
    {
      label: "Tổng điểm",
      value: stats.totalScore > 0 ? formatThousandDong(stats.totalScore) : "0",
    },
    { label: "Vòng hoàn thành", value: String(stats.roundsCompleted) },
    {
      label: "Thắng lợi",
      value:
        stats.sessionsPlayed > 0
          ? `${stats.wins}/${stats.sessionsPlayed}`
          : "0",
    },
    { label: "Vai trò yêu thích", value: formatTopRoleShort(stats.topRole) },
  ];

  return (
    <Card className="p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Thống kê chơi
      </h3>
      <dl className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-semibold tabular-nums">
              {loading ? (
                <span className="inline-block h-4 w-12 animate-pulse rounded bg-muted" />
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
