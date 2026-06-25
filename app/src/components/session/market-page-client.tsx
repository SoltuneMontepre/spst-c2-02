"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { ConsumerMarket } from "@/components/roles/consumer-market";

/** Consumer-only market route; other roles redirect to task zone. */
export function MarketPageClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { data, isLoading } = useSessionSnapshot(sessionId);

  useEffect(() => {
    if (!isLoading && data?.self?.role && data.self.role !== "CONSUMER") {
      router.replace(`/session/${sessionId}/task`);
    }
  }, [isLoading, data?.self?.role, sessionId, router]);

  if (isLoading || !data) {
    return <p className="p-8 text-muted-foreground">Đang tải…</p>;
  }
  if (data.self?.role !== "CONSUMER") {
    return null;
  }
  return <ConsumerMarket sessionId={sessionId} />;
}
