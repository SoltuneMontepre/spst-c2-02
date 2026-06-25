"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { RoleTask } from "@/components/session/role-task";

/** Task zone for producer/intermediary/government; consumers redirect to market. */
export function TaskPageClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { data, isLoading } = useSessionSnapshot(sessionId);

  useEffect(() => {
    if (!isLoading && data?.self?.role === "CONSUMER") {
      router.replace(`/session/${sessionId}/market`);
    }
  }, [isLoading, data?.self?.role, sessionId, router]);

  if (isLoading || !data) {
    return <p className="p-8 text-muted-foreground">Đang tải…</p>;
  }
  if (data.self?.role === "CONSUMER") {
    return null;
  }
  return <RoleTask sessionId={sessionId} />;
}
