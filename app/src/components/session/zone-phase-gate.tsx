"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, Map } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { PHASE_LABELS } from "@/lib/labels";
import {
  getTaskZoneForPhase,
  isOnTaskZone,
  zoneScreenForRole,
} from "@/lib/zone-phase";
import { GAME_ZONES, type GameScreen } from "@/lib/game-zones";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function zoneHref(sessionId: string, screen: GameScreen, role: Role | null): string {
  const zone = GAME_ZONES.find(
    (z) =>
      z.screen === screen &&
      (screen === "map" || screen === "observatory" ? z.role === "ALL" : z.role === role),
  );
  return zone?.href(sessionId) ?? `/session/${sessionId}/map`;
}

/** Nội dung khu chưa «mở» trong giai đoạn hiện tại — copy khớp HUD bên phải. */
export function ZonePhaseGate({
  sessionId,
  activeZone,
  role,
  phase,
  round,
  children,
}: {
  sessionId: string;
  activeZone: GameScreen;
  role: Role | null;
  phase: string | null;
  round: number;
  children: ReactNode;
}) {
  const onTask = isOnTaskZone(activeZone, role, phase, round);
  const taskZone = getTaskZoneForPhase(role, phase, round);
  const phaseLabel = phase ? PHASE_LABELS[phase] : "Đang chờ";

  if (onTask || !role || !phase) {
    return <>{children}</>;
  }

  const roleZone = zoneScreenForRole(role);
  const isEarlyVisit = activeZone === roleZone && taskZone !== roleZone;

  let title = "Chưa đến lúc vào khu này";
  let body =
    "Giai đoạn hiện tại không có việc tại màn hình này. Xem «Nhiệm vụ đang làm» bên phải.";

  if (isEarlyVisit && role === "CONSUMER" && phase === "DECISION") {
    title = `${phaseLabel} — Quầy chợ chưa mở`;
    body =
      "Nhà sản xuất đang sản xuất và nhà nước có thể ban hành chính sách. Bạn sẽ mua hàng khi giai đoạn «Chợ mở».";
  } else if (activeZone === "task" && phase === "DECISION" && role === "GOVERNMENT" && round < 2) {
    title = `${phaseLabel} — Chưa có chính sách`;
    body = "Vòng 1 chưa có can thiệp nhà nước. Theo dõi bản đồ hoặc Tháp quan sát.";
  } else if (phase === "EVENT") {
    title = `${phaseLabel} — Chờ công bố xong`;
    body = "Đọc biến cố vòng ở cột phải, sau đó làm theo nhiệm vụ.";
  }

  const suggestScreen = taskZone ?? "map";
  const suggestZone = GAME_ZONES.find(
    (z) =>
      z.screen === suggestScreen &&
      (suggestScreen === "map" ? z.role === "ALL" : z.role === role),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 rounded-[14px] border border-amber-500/40 bg-amber-500/5 px-4 py-4 text-sm">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-muted-foreground">{body}</p>
          {suggestZone ? (
            <Link
              href={zoneHref(sessionId, suggestScreen, role)}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 inline-flex gap-1.5")}
            >
              <Map className="size-3.5" />
              Về {suggestZone.label}
            </Link>
          ) : null}
        </div>
      </div>
      <div className="pointer-events-none opacity-40" aria-hidden>
        {children}
      </div>
    </div>
  );
}
