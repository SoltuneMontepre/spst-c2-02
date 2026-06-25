"use client";

import {
  Award,
  BarChart3,
  Shield,
  Sprout,
  Star,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileBadgeItem } from "@/lib/profile-service";
import { cn } from "@/lib/utils";

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  EFFICIENT_PRODUCER: Sprout,
  MARKET_CONNECTOR: Award,
  OBSERVER: BarChart3,
  WISE_CONSUMER: Star,
  BALANCED_REGULATOR: Shield,
  ROUND3_CHAMPION: Trophy,
};

export function ProfileBadgesCard({
  badges,
  loading,
}: {
  badges: ProfileBadgeItem[];
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Huy hiệu đạt được</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {badges.map((badge) => {
              const Icon = BADGE_ICONS[badge.id] ?? Star;
              return (
                <div
                  key={badge.id}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center",
                    badge.earned
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-muted/10 opacity-50",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl",
                      badge.earned ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <p className="text-xs font-semibold leading-tight">{badge.label}</p>
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    {badge.earned ? badge.description : "Chưa đạt được"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
