"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileLearningTopic } from "@/lib/profile-service";
import { cn } from "@/lib/utils";

export function ProfileLearningProgressCard({
  topics,
  loading,
}: {
  topics: ProfileLearningTopic[];
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tiến độ học tập</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
            ))
          : topics.map((topic) => (
              <div key={topic.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{topic.label}</span>
                  <span className="tabular-nums text-muted-foreground">{topic.percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full bg-primary transition-all")}
                    style={{ width: `${topic.percent}%` }}
                  />
                </div>
              </div>
            ))}
      </CardContent>
    </Card>
  );
}
