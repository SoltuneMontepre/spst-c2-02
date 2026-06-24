"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/hooks/use-api";
import { useHostControl } from "@/hooks/use-host-control";
import type { ActiveHostedSession } from "@/lib/session-service";
import { STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function ActiveHostCard() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["active-hosted-session"],
    queryFn: () => apiFetch<{ session: ActiveHostedSession | null }>("/api/sessions/active"),
  });
  const session = data?.session ?? null;
  const host = useHostControl(session?.id ?? "");

  if (!session) return null;
  const inLobby = session.status === "LOBBY";
  const returnHref = inLobby
    ? `/session/${session.id}/lobby`
    : `/host/session/${session.id}`;

  const close = () =>
    host.mutate(inLobby ? "cancel" : "end", {
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ["active-hosted-session"] }),
    });

  return (
    <Card className="w-full max-w-md border-primary/40">
      <CardHeader>
        <CardTitle className="text-base">Phòng bạn đang mở</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Mã <span className="font-mono font-semibold">{session.code}</span> ·{" "}
          {STATUS_LABELS[session.status]}
        </p>
        <div className="flex gap-2">
          <Link href={returnHref} className={cn(buttonVariants(), "flex-1")}>
            Quay lại phòng
          </Link>
          <Button variant="destructive" disabled={host.isPending} onClick={close}>
            {inLobby ? "Hủy phòng" : "Kết thúc"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
