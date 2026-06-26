"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, LogOut, Users } from "lucide-react";
import type { ParticipantView } from "@/lib/session-service";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { ParticipantAvatar } from "@/components/session/participant-avatar";
import { Button } from "@/components/ui/button";
import { useLeaveRoom } from "@/hooks/use-session-room";
import { cn } from "@/lib/utils";

function presenceLabel(p: ParticipantView, inGame: boolean): string {
  if (p.isBot) return "Bot";
  if (p.presence === "OFFLINE") return "Ngoại tuyến";
  if (inGame && p.phaseReady) return "Sẵn sàng";
  return "Trực tuyến";
}

/** Danh sách người chơi nhúng trong sidebar điều hướng. */
export function SessionRosterSidebar({
  participants,
  sessionStatus,
  defaultOpen = true,
}: {
  participants: ParticipantView[];
  sessionStatus: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const inGame = sessionStatus !== "LOBBY";
  const online = participants.filter((p) => p.isBot || p.presence === "ONLINE").length;

  return (
    <div
      className={cn(
        "mt-4 flex flex-col gap-1",
        open && "min-h-0 flex-1 overflow-hidden",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full shrink-0 items-center justify-between gap-1 rounded-lg px-2 py-1 transition-colors hover:bg-muted/50"
        aria-expanded={open}
        aria-controls="session-roster-sidebar-list"
      >
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          Người chơi · {online}/{participants.length}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id="session-roster-sidebar-list"
          className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto"
        >
          {participants.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted/50"
              title={`${p.displayName}${p.role ? ` · ${ROLE_LABELS[p.role]}` : ""} · ${presenceLabel(p, inGame)}`}
            >
              <ParticipantAvatar participant={p} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium leading-tight">
                  {p.displayName}
                  {p.isSelf ? (
                    <span className="font-normal text-muted-foreground"> (bạn)</span>
                  ) : null}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {p.role ? ROLE_LABELS[p.role] : "Chưa phân vai"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div
          id="session-roster-sidebar-list"
          className="flex flex-wrap gap-1 px-1.5 pb-0.5"
        >
          {participants.slice(0, 8).map((p) => (
            <span
              key={p.id}
              title={`${p.displayName}${p.role ? ` · ${ROLE_LABELS[p.role]}` : ""}`}
            >
              <ParticipantAvatar participant={p} size="sm" />
            </span>
          ))}
          {participants.length > 8 ? (
            <span className="flex size-9 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
              +{participants.length - 8}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** Cột avatar dính mép phải màn hình + panel danh sách người chơi. */
export function SessionRosterWall({
  sessionId,
  participants,
  sessionStatus,
}: {
  sessionId: string;
  participants: ParticipantView[];
  sessionStatus: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const leave = useLeaveRoom(sessionId);
  const inGame = sessionStatus !== "LOBBY";
  const online = participants.filter((p) => p.isBot || p.presence === "ONLINE").length;

  function handleExit() {
    const msg = inGame
      ? "Rời màn hình? Phiên vẫn chạy — bạn có thể quay lại từ Trang chủ."
      : "Rời phòng chờ?";
    if (!window.confirm(msg)) return;
    if (sessionStatus === "LOBBY") leave.mutate();
    else router.push("/home");
  }

  return (
    <>
      {/* Avatar stack — mép phải */}
      <div
        className={cn(
          "fixed right-0 top-1/2 z-30 flex -translate-y-1/2 flex-col items-end gap-1.5 pr-0.5 transition-transform",
          open && "translate-x-2 opacity-0 pointer-events-none",
        )}
        aria-hidden={open}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mb-1 flex size-9 items-center justify-center rounded-l-xl border border-r-0 border-border bg-surface/95 text-muted-foreground shadow-md backdrop-blur hover:bg-muted hover:text-foreground"
          aria-label={`${participants.length} người chơi — mở danh sách`}
          title={`${online}/${participants.length} trực tuyến`}
        >
          <Users className="size-4" />
        </button>

        {participants.slice(0, 8).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-l-full pr-0.5 transition-transform hover:scale-105"
            title={`${p.displayName}${p.role ? ` · ${ROLE_LABELS[p.role]}` : ""} · ${presenceLabel(p, inGame)}`}
          >
            <ParticipantAvatar participant={p} size="sm" />
          </button>
        ))}

        {participants.length > 8 ? (
          <span className="mr-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            +{participants.length - 8}
          </span>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="mt-2 size-9 rounded-l-xl rounded-r-none border-r-0 shadow-md"
          onClick={handleExit}
          disabled={leave.isPending}
          title={inGame ? "Về trang chủ" : "Rời phòng"}
          aria-label={inGame ? "Thoát game" : "Rời phòng"}
        >
          <LogOut className="size-4" />
        </Button>
      </div>

      {/* Panel mở rộng */}
      <aside
        className={cn(
          "fixed right-0 top-20 z-40 flex max-h-[min(32rem,calc(100vh-7rem))] w-72 flex-col rounded-l-2xl border border-r-0 border-border bg-surface/98 shadow-xl backdrop-blur transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full pointer-events-none",
        )}
        aria-label="Danh sách người chơi"
        aria-hidden={!open}
      >
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Người chơi</p>
            <p className="text-xs text-muted-foreground">
              {participants.length} người · {online} trực tuyến
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => setOpen(false)}
            aria-label="Đóng danh sách"
          >
            <ChevronRight className="size-4" />
          </Button>
        </header>

        <ul className="flex-1 overflow-y-auto px-2 py-2">
          {participants.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-muted/50"
            >
              <ParticipantAvatar participant={p} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {p.displayName}
                  {p.isSelf ? (
                    <span className="font-normal text-muted-foreground"> (bạn)</span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.role ? ROLE_LABELS[p.role] : "Chưa phân vai"}
                  {" · "}
                  {presenceLabel(p, inGame)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <footer className="border-t border-border p-3">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleExit}
            disabled={leave.isPending}
          >
            <LogOut className="size-4" />
            {inGame ? "Về trang chủ" : "Rời phòng"}
          </Button>
          {inGame ? (
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Phiên vẫn chạy khi bạn rời màn hình.
            </p>
          ) : null}
        </footer>
      </aside>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[35] bg-black/20 backdrop-blur-[1px]"
          aria-label="Đóng danh sách"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
