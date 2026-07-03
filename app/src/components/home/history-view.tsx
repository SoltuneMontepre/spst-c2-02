"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Store } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { RoleBadge } from "@/components/lobby/role-badge";
import { apiFetch } from "@/hooks/use-api";
import { STATUS_LABELS } from "@/lib/labels";
import { historySessionHref } from "@/lib/session-routes";
import { cn } from "@/lib/utils";

interface HistorySession {
  sessionId: string;
  code: string;
  status: string;
  role: Role | null;
  startedAt: string | null;
  endedAt: string | null;
  joinedAt: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isActiveStatus(status: string): boolean {
  return !["COMPLETED", "INCOMPLETE", "CANCELLED"].includes(status);
}

function HistoryRow({ session }: { session: HistorySession }) {
  const active = isActiveStatus(session.status);
  const when = session.endedAt ?? session.startedAt ?? session.joinedAt;

  return (
    <Link
      href={historySessionHref(session)}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:bg-muted/20"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Store className="size-4 text-primary" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold tracking-wider">{session.code}</span>
          <RoleBadge role={session.role} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatDate(when)} · {STATUS_LABELS[session.status] ?? session.status}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
          active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
        )}
      >
        {active ? "Đang mở" : "Đã kết thúc"}
      </span>
    </Link>
  );
}

export function HistoryView() {
  const { data, isLoading } = useQuery({
    queryKey: ["history-sessions"],
    queryFn: () => apiFetch<HistorySession[]>("/api/me/sessions"),
  });

  const sessions = data ?? [];

  return (
    <div className="flex min-h-screen justify-center bg-background px-4 py-6 sm:px-6">
      <main className="flex w-full max-w-2xl flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label="Về trang chủ"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Lịch sử phòng</h1>
        </div>

        {isLoading ? (
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
          <div className="flex flex-col gap-2">
            {sessions.map((s) => (
              <HistoryRow key={s.sessionId} session={s} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
