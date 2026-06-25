"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { cn } from "@/lib/utils";

/** Manual refetch of lobby participant ready/presence state (SSE backup). */
export function LobbyRefreshButton({
  sessionId,
  className,
  label = "Làm mới trạng thái sẵn sàng",
}: {
  sessionId: string;
  className?: string;
  label?: string;
}) {
  const { refetch, isFetching } = useSessionSnapshot(sessionId);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("shrink-0 gap-1.5", className)}
      disabled={isFetching}
      onClick={() => void refetch()}
      aria-label={label}
      title={label}
    >
      <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} aria-hidden />
      <span className="hidden sm:inline">{isFetching ? "Đang tải…" : "Làm mới"}</span>
    </Button>
  );
}
