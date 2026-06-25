"use client";

import { RefreshCw } from "lucide-react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Manual refetch of home dashboard (public rooms, recent sessions, stats). */
export function HomeRefreshButton({
  className,
  label = "Làm mới danh sách phòng",
}: {
  className?: string;
  label?: string;
}) {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ queryKey: ["home-dashboard"] }) > 0;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("shrink-0 gap-1.5", className)}
      disabled={isFetching}
      onClick={() => void queryClient.refetchQueries({ queryKey: ["home-dashboard"] })}
      aria-label={label}
      title={label}
    >
      <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} aria-hidden />
      <span className="hidden sm:inline">{isFetching ? "Đang tải…" : "Làm mới"}</span>
    </Button>
  );
}
