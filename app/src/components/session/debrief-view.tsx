"use client";

import { useMemo } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useSessionSnapshot, useSessionResult } from "@/hooks/use-session-room";
import { useSessionCancelledRedirect } from "@/hooks/use-session-cancelled-redirect";
import { PriceValueChart } from "@/components/observatory/price-value-chart";
import { STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { DebriefScoreboardOverview } from "@/components/session/debrief-participant-summary";
import { aiReviewByParticipantId } from "@/lib/debrief-review";
import type { ParticipantOutcome } from "@/lib/finalize";
import type { ParticipantView } from "@/lib/session-service";
import type { Role } from "@/generated/prisma/enums";
import { Brand } from "@/components/brand";
import { formatThousandDong } from "@/lib/money";

function mergeRosterParticipants(
  participants: ParticipantView[],
  outcomes: ParticipantOutcome[] | undefined,
): ParticipantView[] {
  const byId = new Map(participants.map((p) => [p.id, p]));
  if (outcomes) {
    for (const o of outcomes) {
      if (!byId.has(o.participantId)) {
        byId.set(o.participantId, {
          id: o.participantId,
          displayName: o.displayName,
          avatarUrl: null,
          role: (o.role || null) as Role | null,
          productivityProfile: null,
          isBot: o.isBot,
          presence: "ONLINE",
          lastSeenAt: null,
          ready: false,
          phaseReady: false,
          controlMode: "BOT_PERMANENT",
          isSelf: false,
        });
      }
    }
  }
  return [...byId.values()];
}

export function DebriefView({ sessionId }: { sessionId: string }) {
  const { data: snapshot, isLoading: snapLoading } = useSessionSnapshot(sessionId);
  useSessionCancelledRedirect(snapshot?.status, "solo_timeout");

  const showResult = Boolean(
    snapshot &&
      ["DEBRIEF", "COMPLETED", "INCOMPLETE"].includes(snapshot.status),
  );
  const { data: result, isLoading: resultLoading } = useSessionResult(
    sessionId,
    showResult,
  );

  const outcomesById = useMemo(() => {
    const map = new Map<string, ParticipantOutcome>();
    if (!result) return map;
    for (const o of result.outcomes) map.set(o.participantId, o);
    return map;
  }, [result]);

  const aiByParticipantId = useMemo(
    () => aiReviewByParticipantId(result?.aiDebrief ?? null),
    [result?.aiDebrief],
  );

  const rosterParticipants = useMemo(
    () =>
      snapshot
        ? mergeRosterParticipants(snapshot.participants, result?.outcomes)
        : [],
    [snapshot, result?.outcomes],
  );

  const selfOutcome = useMemo(() => {
    const self = rosterParticipants.find((p) => p.isSelf);
    return self ? (outcomesById.get(self.id) ?? null) : null;
  }, [rosterParticipants, outcomesById]);

  if (snapLoading || !snapshot) {
    return <p className="p-8 text-muted-foreground">Đang tải kết quả…</p>;
  }

  const waiting = Boolean(showResult && (resultLoading || !result));
  const aiWaiting = Boolean(
    showResult && !resultLoading && result && !result.aiDebrief,
  );
  const statusLabel = STATUS_LABELS[snapshot.status] ?? snapshot.status;

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-surface/95">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <Brand size={24} />
          <Link
            href="/home"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Về trang chủ
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Kết quả phiên · {statusLabel}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Tổng kết phiên chơi
          </h1>
          {snapshot.autoHost && snapshot.status === "DEBRIEF" ? (
            <p className="mt-2 text-sm text-muted-foreground">
              AI điều phối sẽ tự hoàn tất phiên sau khi hết thời gian debrief.
            </p>
          ) : null}
        </div>

        {/* Overall summary */}
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          {aiWaiting ? (
            <p className="text-sm text-muted-foreground">
              AI đang chấm điểm và viết nhận xét cho phiên…
            </p>
          ) : result?.aiDebrief ? (
            <div className="flex items-start gap-4">
              <span className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
                <span className="text-2xl font-bold tabular-nums leading-none">
                  {result.aiDebrief.overall.grade}
                </span>
                <span className="text-[10px] font-semibold text-primary/70">/10</span>
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Nhận xét tổng quan
                </p>
                <p className="mt-1 text-sm leading-relaxed sm:text-base">
                  {result.aiDebrief.overall.comment}
                </p>
              </div>
            </div>
          ) : result?.narration ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Nhận xét trợ giảng AI
              </p>
              <p className="mt-1 text-sm leading-relaxed sm:text-base">
                {result.narration}
              </p>
            </div>
          ) : waiting ? (
            <p className="text-sm text-muted-foreground">Đang tạo nhận xét tổng hợp…</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Chưa có nhận xét AI cho phiên này.
            </p>
          )}

          {selfOutcome ? (
            <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Kết quả của bạn
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums">
                {selfOutcome.role === "GOVERNMENT"
                  ? `${selfOutcome.scoreVnd} điểm`
                  : formatThousandDong(selfOutcome.scoreVnd)}
              </p>
              {selfOutcome.needUnits != null && selfOutcome.fulfilledUnits != null ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Đáp ứng nhu cầu: {selfOutcome.fulfilledUnits}/{selfOutcome.needUnits}{" "}
                  thùng
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* Scoreboard */}
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold">Bảng điểm</h2>
          <div className="mt-4">
            <DebriefScoreboardOverview
              participants={rosterParticipants}
              outcomesById={outcomesById}
              badges={result?.badges ?? []}
              aiByParticipantId={aiByParticipantId}
              waiting={waiting}
            />
          </div>
        </section>

        {/* Price chart — only if we have data */}
        {result && result.analytics.length > 0 ? (
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
            <h2 className="text-sm font-semibold">Giá trị vs giá thị trường</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Theo từng vòng</p>
            <div className="mt-4">
              <PriceValueChart rounds={result.analytics} />
            </div>
          </section>
        ) : null}

        <div className="flex justify-center pb-6">
          <Link href="/home" className={cn(buttonVariants({ size: "lg" }), "min-w-[12rem]")}>
            Về trang chủ
          </Link>
        </div>
      </main>
    </div>
  );
}
