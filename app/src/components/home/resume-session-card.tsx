"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/hooks/use-api";
import type { ActiveHostedSession } from "@/lib/session-service";
import { STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

function routeFor(s: ActiveHostedSession): string {
  if (s.status === "LOBBY") return `/session/${s.id}/lobby`;
  if (["COMPLETED", "INCOMPLETE", "CANCELLED"].includes(s.status))
    return `/session/${s.id}/debrief`;
  return `/session/${s.id}/map`;
}

/** Lets a player rejoin the session they're already in (reconnection, §4.4). */
export function ResumeSessionCard() {
  const { data } = useQuery({
    queryKey: ["active-hosted-session"],
    queryFn: () =>
      apiFetch<{ joined: ActiveHostedSession | null }>("/api/sessions/active"),
  });
  const joined = data?.joined ?? null;
  if (!joined) return null;

  return (
    <Card className="w-full max-w-md border-accent/40">
      <CardHeader>
        <CardTitle className="text-base">Phiên bạn đang tham gia</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Mã <span className="font-mono font-semibold">{joined.code}</span> ·{" "}
          {STATUS_LABELS[joined.status]}
        </p>
        <Link href={routeFor(joined)} className={cn(buttonVariants())}>
          Quay lại phiên chợ
        </Link>
      </CardContent>
    </Card>
  );
}
