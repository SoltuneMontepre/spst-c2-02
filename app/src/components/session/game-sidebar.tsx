"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  LogOut,
  Map,
  Store,
  Telescope,
  Trophy,
} from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import type { ParticipantView } from "@/lib/session-service";
import { zoneScreenForRole } from "@/lib/zone-phase";
import { OpenProjectorButton } from "@/components/host/projector-mode-toggle";
import { SessionRosterSidebar } from "@/components/session/session-roster-wall";
import { cn } from "@/lib/utils";

export type GameNavItem =
  | "map"
  | "task"
  | "market"
  | "observatory"
  | "recap"
  | "debrief";

function taskHref(sessionId: string, role: Role | null): string {
  if (role === "CONSUMER") return `/session/${sessionId}/market`;
  return `/session/${sessionId}/task`;
}

function marketHref(sessionId: string, role: Role | null): string {
  if (role === "CONSUMER") return `/session/${sessionId}/market`;
  return `/session/${sessionId}/task`;
}

function playNavItems(sessionId: string, role: Role | null) {
  return [
    {
      id: "map" as const,
      label: "Bản đồ",
      href: `/session/${sessionId}/map`,
      icon: Map,
    },
    {
      id: "task" as const,
      label: "Nhiệm vụ",
      href: taskHref(sessionId, role),
      icon: ClipboardList,
    },
    {
      id: "market" as const,
      label: "Giao dịch",
      href: marketHref(sessionId, role),
      icon: Store,
    },
    {
      id: "observatory" as const,
      label: "Quan sát",
      href: `/session/${sessionId}/observatory`,
      icon: Telescope,
    },
  ];
}

export function GameMobileNav({
  sessionId,
  active,
  role,
}: {
  sessionId: string;
  active: GameNavItem;
  role: Role | null;
}) {
  const items = playNavItems(sessionId, role);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface/95 backdrop-blur lg:hidden"
      aria-label="Điều hướng phiên chơi"
    >
      {items.map((item) => {
        const isActive =
          item.id === active ||
          (item.id === "task" &&
            active === "task" &&
            role != null &&
            zoneScreenForRole(role) === "task") ||
          (item.id === "market" && active === "market");
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function GameSidebar({
  sessionId,
  active,
  role,
  status,
  phase,
  isHost,
  participants,
  sessionStatus,
}: {
  sessionId: string;
  active: GameNavItem;
  role: Role | null;
  status: string;
  phase: string | null;
  isHost?: boolean;
  participants: ParticipantView[];
  sessionStatus: string;
}) {
  const router = useRouter();
  const recapActive = active === "recap" || phase === "RECAP";
  const debriefActive = active === "debrief" || status === "DEBRIEF" || status === "COMPLETED";

  const playItems = playNavItems(sessionId, role).map((item) => ({
    ...item,
    label:
      item.id === "map"
        ? "Bản đồ chợ"
        : item.id === "task"
          ? "Nhiệm vụ vai trò"
          : item.id === "market"
            ? "Giao dịch"
            : "Quan sát thị trường",
  }));

  const resultItems: {
    id: GameNavItem;
    label: string;
    href: string;
    icon: typeof BarChart3;
  }[] = [
    {
      id: "recap",
      label: "Tổng kết vòng",
      href: `/session/${sessionId}/map`,
      icon: BarChart3,
    },
    {
      id: "debrief",
      label: "Kết quả cuối",
      href: `/session/${sessionId}/debrief`,
      icon: Trophy,
    },
  ];

  function navClass(isActive: boolean) {
    return cn(
      "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
      isActive
        ? "bg-secondary text-primary"
        : "text-foreground hover:bg-muted/60",
    );
  }

  return (
    <aside className="hidden min-h-0 w-[210px] shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Điều hướng phiên chơi">
        <p className="px-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          Phiên chơi
        </p>
        {playItems.map((item) => {
          const isActive =
            item.id === active ||
            (item.id === "task" &&
              active === "task" &&
              role != null &&
              zoneScreenForRole(role) === "task") ||
            (item.id === "market" && active === "market");
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={navClass(isActive)}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}

        <p className="mt-4 px-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          Kết quả
        </p>
        {resultItems.map((item) => {
          const isActive =
            item.id === "recap" ? recapActive : debriefActive && item.id === "debrief";
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={navClass(isActive)}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}

        <SessionRosterSidebar
          participants={participants}
          sessionStatus={sessionStatus}
        />
      </nav>

      <div className="border-t border-border p-3">
        {isHost ? (
          <div className="mb-2">
            <OpenProjectorButton sessionId={sessionId} className="w-full" size="md" />
          </div>
        ) : null}
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          onClick={() => router.push("/home")}
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          Thoát phiên
        </button>
      </div>
    </aside>
  );
}
