"use client";

import type { Role } from "@/generated/prisma/enums";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { BentoTile } from "@/components/ui/bento-tile";
import { Button } from "@/components/ui/button";
import { HomeRefreshButton } from "@/components/home/home-refresh-button";
import { SessionListRow } from "@/components/home/session-list-row";
import { RoleBadge, ROLE_LABELS } from "@/components/lobby/role-badge";
import { useHostControl } from "@/hooks/use-host-control";
import type { HomeRecentSession } from "@/lib/session-service";
import {
  historySessionHref,
  hostSessionHref,
  playerSessionHref,
} from "@/lib/session-routes";
import { STATUS_LABELS } from "@/lib/labels";
import { roomCancelledHomeHref } from "@/lib/room-cancelled";
import { cn } from "@/lib/utils";

function formatRelativeDay(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  return date.toLocaleDateString("vi-VN", { day: "numeric", month: "short" });
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sessionMetaLine(s: HomeRecentSession): string {
  const inLobby = s.isActive && (s.status === "LOBBY" || s.status === "CREATED");
  const when = inLobby
    ? s.createdAt
    : s.isActive
      ? (s.startedAt ?? s.joinedAt)
      : (s.endedAt ?? s.startedAt ?? s.joinedAt);
  const parts: string[] = [];
  if (!s.isHost) {
    parts.push(`Host: ${s.hostDisplayName}`);
  }
  parts.push(
    formatRelativeDay(when),
    formatTime(when),
    `${s.participantCount}/${s.maxPlayers} người`,
  );
  if (s.isActive) {
    if (inLobby && s.currentRound === 0) {
      parts.push(`${s.totalRounds} vòng`);
    } else {
      parts.push(`${s.currentRound}/${s.totalRounds} vòng`);
    }
  }
  return parts.filter(Boolean).join(" · ");
}

function sessionStatusLabel(status: string, isActive: boolean): string {
  if (!isActive) return "Đã kết thúc";
  if (status === "LOBBY" || status === "CREATED") return "Đang mở";
  return "Đang diễn ra";
}

function SessionStatusPill({
  status,
  isActive,
}: {
  status: string;
  isActive: boolean;
}) {
  const label = sessionStatusLabel(status, isActive);
  const open = isActive && (status === "LOBBY" || status === "CREATED");
  const live = isActive && !open;

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        open && "bg-success/15 text-success",
        live && "bg-primary/15 text-primary",
        !isActive && "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

function HostPill() {
  return (
    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
      Host
    </span>
  );
}

function ActiveHostRow({
  session,
  onClosed,
}: {
  session: HomeRecentSession;
  onClosed: () => void;
}) {
  const router = useRouter();
  const host = useHostControl(session.sessionId);
  const inLobby = session.status === "LOBBY";

  return (
    <SessionListRow
      code={session.code}
      meta={sessionMetaLine(session)}
      submeta={STATUS_LABELS[session.status] ?? session.status}
      highlight="host"
      icon={<Store className="size-4 text-primary" aria-hidden />}
      statusBadge={<SessionStatusPill status={session.status} isActive={session.isActive} />}
      badges={<HostPill />}
      href={hostSessionHref({ id: session.sessionId, status: session.status })}
      actions={
        session.isHost && session.status === "LOBBY" ? (
          <Button
            variant="destructive"
            size="sm"
            disabled={host.isPending}
            onClick={() =>
              host.mutate("cancel", {
                onSuccess: () => {
                  onClosed();
                  router.replace(roomCancelledHomeHref("host_cancelled"));
                },
              })
            }
          >
            Hủy
          </Button>
        ) : session.isHost && session.isActive ? (
          <Button
            variant="destructive"
            size="sm"
            disabled={host.isPending}
            onClick={() => host.mutate("end", { onSuccess: onClosed })}
          >
            Kết thúc
          </Button>
        ) : null
      }
    />
  );
}

function RecentSessionRow({ session }: { session: HomeRecentSession }) {
  const roleLabel = session.role
    ? ROLE_LABELS[session.role as Role]
    : "Chưa phân vai";

  const href = session.isActive
    ? session.isHost
      ? hostSessionHref({ id: session.sessionId, status: session.status })
      : session.isJoined
        ? playerSessionHref({ id: session.sessionId, status: session.status })
        : historySessionHref(session)
    : historySessionHref(session);

  return (
    <SessionListRow
      code={session.code}
      meta={sessionMetaLine(session)}
      submeta={`${roleLabel} · ${STATUS_LABELS[session.status] ?? session.status}`}
      highlight={session.isJoined ? "joined" : undefined}
      icon={<Store className="size-4 text-primary" aria-hidden />}
      statusBadge={<SessionStatusPill status={session.status} isActive={session.isActive} />}
      badges={session.role ? <RoleBadge role={session.role} /> : null}
      href={href}
      linkLabel={session.isActive ? "Tham gia phòng" : "Coi lại lịch sử"}
    />
  );
}

interface HomeRecentSessionsProps {
  sessions: HomeRecentSession[];
  loading?: boolean;
  onRefresh: () => void;
}

export function HomeRecentSessions({
  sessions,
  loading,
  onRefresh,
}: HomeRecentSessionsProps) {
  const activeSessions = sessions.filter((s) => s.isActive);
  const endedSessions = sessions.filter((s) => !s.isActive);

  return (
    <BentoTile
      title="Phòng gần đây"
      description="Các phòng bạn đã tham gia hoặc đang mở"
      colSpan="col-span-12"
      headerExtra={
        <div className="flex items-center gap-2">
          {sessions.length > 0 ? (
            <span className="text-xs text-muted-foreground">
              {activeSessions.length > 0
                ? `${activeSessions.length} đang mở · `
                : ""}
              {sessions.length} phòng
            </span>
          ) : null}
          <HomeRefreshButton label="Làm mới phòng gần đây" />
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Chưa có phòng nào. Tạo phòng mới hoặc nhập mã để bắt đầu.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {activeSessions.length > 0 ? (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Đang mở
              </p>
              <ul className="flex flex-col gap-2">
                {activeSessions.map((s) =>
                  s.isHost ? (
                    <ActiveHostRow
                      key={s.sessionId}
                      session={s}
                      onClosed={onRefresh}
                    />
                  ) : (
                    <RecentSessionRow key={s.sessionId} session={s} />
                  ),
                )}
              </ul>
            </section>
          ) : null}
          {endedSessions.length > 0 ? (
            <section className="min-h-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Đã kết thúc
              </p>
              <div className="-mr-1 max-h-80 overflow-y-auto overscroll-contain pr-1 sm:max-h-96 lg:max-h-[28rem]">
                <ul
                  className="flex flex-col gap-2"
                  aria-label="Danh sách phòng đã kết thúc"
                >
                  {endedSessions.map((s) => (
                    <RecentSessionRow key={s.sessionId} session={s} />
                  ))}
                </ul>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </BentoTile>
  );
}
