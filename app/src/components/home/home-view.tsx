"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, User } from "lucide-react";
import { SessionNav } from "@/components/session/session-nav";
import { BentoTile } from "@/components/ui/bento-tile";
import { Button, buttonVariants } from "@/components/ui/button";
import { RoomActions } from "@/components/home/room-actions";
import { SessionListRow } from "@/components/home/session-list-row";
import { apiFetch } from "@/hooks/use-api";
import { useHostControl } from "@/hooks/use-host-control";
import type { ActiveHostedSession } from "@/lib/session-service";
import {
  hostSessionHref,
  playerSessionHref,
  historySessionHref,
} from "@/lib/session-routes";
import { STATUS_LABELS } from "@/lib/labels";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { cn } from "@/lib/utils";

interface HistoryItem {
  sessionId: string;
  code: string;
  status: string;
  role: string | null;
  startedAt: string | null;
  endedAt: string | null;
  joinedAt: string;
}

function formatWhen(iso: string | null): string | undefined {
  if (!iso) return undefined;
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RolePill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      {label}
    </span>
  );
}

function ActiveHostRow({
  session,
  onClosed,
}: {
  session: ActiveHostedSession;
  onClosed: () => void;
}) {
  const host = useHostControl(session.id);
  const inLobby = session.status === "LOBBY";

  const close = () =>
    host.mutate(inLobby ? "cancel" : "end", { onSuccess: onClosed });

  return (
    <SessionListRow
      code={session.code}
      meta={STATUS_LABELS[session.status] ?? session.status}
      submeta="Bạn đang làm host phòng này"
      highlight="host"
      badges={<RolePill label="Host" />}
      href={hostSessionHref(session)}
      actions={
        <Button
          variant="destructive"
          size="sm"
          disabled={host.isPending}
          onClick={close}
        >
          {inLobby ? "Hủy" : "Kết thúc"}
        </Button>
      }
    />
  );
}

export function HomeView({ displayName }: { displayName: string }) {
  const queryClient = useQueryClient();

  const { data: active, isLoading: activeLoading } = useQuery({
    queryKey: ["active-sessions"],
    queryFn: () =>
      apiFetch<{
        session: ActiveHostedSession | null;
        joined: ActiveHostedSession | null;
      }>("/api/sessions/active"),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["session-history"],
    queryFn: () => apiFetch<HistoryItem[]>("/api/me/sessions"),
  });

  const hosted = active?.session ?? null;
  const joined = active?.joined ?? null;
  const showJoined =
    joined && (!hosted || joined.id !== hosted.id);

  const activeIds = new Set(
    [hosted?.id, joined?.id].filter((id): id is string => Boolean(id)),
  );

  const pastSessions =
    history?.filter((h) => !activeIds.has(h.sessionId)) ?? [];

  const invalidateActive = () =>
    queryClient.invalidateQueries({ queryKey: ["active-sessions"] });

  return (
    <div className="flex min-h-full flex-col">
      <SessionNav
        displayName={displayName}
        sessionLabel="Trang chủ"
        hideHomeLink
      />

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-12 gap-4 p-4 pb-10 sm:gap-5 sm:p-6">
        <BentoTile
          title={`Xin chào, ${displayName}`}
          description="Tạo phòng mới hoặc tham gia bằng mã để bắt đầu phiên chợ giá trị."
          colSpan="col-span-12 lg:col-span-8"
        >
          <p className="text-sm leading-relaxed text-muted-foreground">
            Mỗi phiên gồm bốn vòng — bạn sẽ đóng vai nông dân, thương lái, chính
            phủ hoặc quan sát viên. Host mở phòng, mọi người vào phòng chờ, rồi
            cùng trải nghiệm cung–cầu trên sàn chợ Thanh Long.
          </p>
        </BentoTile>

        <BentoTile
          title="Tài khoản"
          description="Hồ sơ và hướng dẫn"
          colSpan="col-span-12 lg:col-span-4"
        >
          <div className="flex flex-col gap-2">
            <Link
              href="/profile"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "justify-start gap-2",
              )}
            >
              <User className="size-4 shrink-0" />
              Xem hồ sơ
            </Link>
            <p className="flex items-start gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
              <BookOpen className="mt-0.5 size-4 shrink-0" />
              Bật chế độ hướng dẫn từ thanh trên cùng khi vào phòng hoặc phiên
              chơi.
            </p>
          </div>
        </BentoTile>

        <BentoTile
          title="Bắt đầu phiên chợ"
          description="Tạo phòng host hoặc tham gia bằng mã 6 ký tự"
          colSpan="col-span-12 md:col-span-5"
        >
          <RoomActions />
        </BentoTile>

        <BentoTile
          title="Phiên đang hoạt động"
          description="Phòng bạn đang host hoặc đang tham gia"
          colSpan="col-span-12 md:col-span-7"
        >
          {activeLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải…</p>
          ) : !hosted && !showJoined ? (
            <p className="text-sm text-muted-foreground">
              Chưa có phiên nào đang mở. Tạo phòng mới hoặc nhập mã để tham gia.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {hosted ? (
                <ActiveHostRow session={hosted} onClosed={invalidateActive} />
              ) : null}
              {showJoined && joined ? (
                <SessionListRow
                  code={joined.code}
                  meta={STATUS_LABELS[joined.status] ?? joined.status}
                  submeta="Bạn đang trong phiên này"
                  highlight="joined"
                  badges={<RolePill label="Đang chơi" />}
                  href={playerSessionHref(joined)}
                />
              ) : null}
            </ul>
          )}
        </BentoTile>

        <BentoTile
          title="Lịch sử phiên"
          description="Các phiên bạn đã tham gia gần đây"
          colSpan="col-span-12"
          headerExtra={
            pastSessions.length > 0 ? (
              <span className="text-xs text-muted-foreground">
                {pastSessions.length} phiên
              </span>
            ) : null
          }
        >
          {historyLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải lịch sử…</p>
          ) : !history?.length ? (
            <p className="text-sm text-muted-foreground">
              Chưa có phiên nào. Sau khi chơi xong, lịch sử sẽ hiện ở đây.
            </p>
          ) : !pastSessions.length ? (
            <p className="text-sm text-muted-foreground">
              Các phiên đã kết thúc sẽ hiện ở đây.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pastSessions.map((h) => {
                const roleLabel = h.role
                  ? ROLE_LABELS[h.role as keyof typeof ROLE_LABELS]
                  : "—";
                const when =
                  formatWhen(h.endedAt) ??
                  formatWhen(h.startedAt) ??
                  formatWhen(h.joinedAt);

                return (
                  <SessionListRow
                    key={`${h.sessionId}-${h.joinedAt}`}
                    code={h.code}
                    meta={`${roleLabel} · ${STATUS_LABELS[h.status] ?? h.status}`}
                    submeta={when}
                    href={historySessionHref(h)}
                  />
                );
              })}
            </ul>
          )}
        </BentoTile>
      </main>
    </div>
  );
}
