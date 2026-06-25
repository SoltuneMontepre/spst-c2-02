"use client";

import type { Role } from "@/generated/prisma/enums";
import { Store } from "lucide-react";
import { BentoTile } from "@/components/ui/bento-tile";
import { Button } from "@/components/ui/button";
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
  const when = s.endedAt ?? s.startedAt ?? s.joinedAt;
  const parts = [
    formatRelativeDay(when),
    formatTime(when),
    `${s.participantCount} người`,
  ].filter(Boolean);
  if (s.isActive || s.currentRound > 0) {
    parts.push(`${s.currentRound}/4 vòng`);
  }
  return parts.join(" · ");
}

function isInProgress(status: string): boolean {
  return !["LOBBY", "CREATED", "COMPLETED", "INCOMPLETE", "CANCELLED"].includes(
    status,
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        active
          ? "bg-primary/15 text-primary"
          : "bg-muted text-muted-foreground",
      )}
    >
      {active ? "Đang diễn ra" : "Đã kết thúc"}
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
  const host = useHostControl(session.sessionId);
  const inLobby = session.status === "LOBBY";

  return (
    <SessionListRow
      code={session.code}
      meta={sessionMetaLine(session)}
      submeta={STATUS_LABELS[session.status] ?? session.status}
      highlight="host"
      icon={<Store className="size-4 text-primary" aria-hidden />}
      statusBadge={<StatusPill active={isInProgress(session.status)} />}
      badges={<HostPill />}
      href={hostSessionHref({ id: session.sessionId, status: session.status })}
      actions={
        <Button
          variant="destructive"
          size="sm"
          disabled={host.isPending}
          onClick={() =>
            host.mutate(inLobby ? "cancel" : "end", { onSuccess: onClosed })
          }
        >
          {inLobby ? "Hủy" : "Kết thúc"}
        </Button>
      }
    />
  );
}

function RecentSessionRow({ session }: { session: HomeRecentSession }) {
  const roleLabel = session.role
    ? ROLE_LABELS[session.role as Role]
    : "Chưa phân vai";
  const active = isInProgress(session.status);

  return (
    <SessionListRow
      code={session.code}
      meta={sessionMetaLine(session)}
      submeta={`${roleLabel} · ${STATUS_LABELS[session.status] ?? session.status}`}
      highlight={session.isJoined ? "joined" : undefined}
      icon={<Store className="size-4 text-primary" aria-hidden />}
      statusBadge={<StatusPill active={active} />}
      badges={session.role ? <RoleBadge role={session.role} /> : null}
      href={
        session.isHost
          ? hostSessionHref({ id: session.sessionId, status: session.status })
          : session.isJoined
            ? playerSessionHref({ id: session.sessionId, status: session.status })
            : historySessionHref(session)
      }
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
  return (
    <BentoTile
      title="Phiên chơi gần đây"
      description="Các phiên bạn đã tham gia hoặc đang mở"
      colSpan="col-span-12"
      headerExtra={
        sessions.length > 0 ? (
          <span className="text-xs text-muted-foreground">
            {sessions.length} phiên
          </span>
        ) : null
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
          Chưa có phiên nào. Tạo phòng mới hoặc nhập mã để bắt đầu.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((s) =>
            s.isHost && s.isActive ? (
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
      )}
    </BentoTile>
  );
}
