"use client";

import { Monitor, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectorNavigation } from "@/hooks/use-projector-mode";
import { cn } from "@/lib/utils";

export function OpenProjectorButton({
  sessionId,
  className,
  size = "sm",
}: {
  sessionId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { goToProjector } = useProjectorNavigation(sessionId);

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={cn("gap-1.5", className)}
      onClick={() => goToProjector()}
      title="Chiếu lớp học — điều khiển giai đoạn"
    >
      <Monitor className="size-4 shrink-0" aria-hidden />
      Bảng projector
    </Button>
  );
}

export function PlayAsPlayerButton({
  sessionId,
  status,
  className,
  size = "sm",
}: {
  sessionId: string;
  status: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { goToPlayer } = useProjectorNavigation(sessionId);

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={cn("gap-1.5", className)}
      onClick={() => goToPlayer(status)}
      title="Vào vai của bạn và chơi như học sinh"
    >
      <User className="size-4 shrink-0" aria-hidden />
      Chơi như người chơi
    </Button>
  );
}
