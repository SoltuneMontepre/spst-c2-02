"use client";

import type { Role } from "@/generated/prisma/enums";
import { RoleBadge } from "@/components/lobby/role-badge";
import { ParticipantAvatar } from "@/components/session/participant-avatar";
import type { BadgeView, ParticipantView } from "@/lib/session-service";
import type { ParticipantOutcome } from "@/lib/finalize";
import type { AiDebriefParticipantReview } from "@/lib/debrief-review";
import { BADGE_LABELS, scoreLabel } from "@/lib/labels";
import { formatThousandDong } from "@/lib/money";
import { cn } from "@/lib/utils";

function formatScore(o: { role: string; scoreVnd: number }): string {
  if (o.role === "GOVERNMENT") return `${o.scoreVnd} điểm`;
  return formatThousandDong(o.scoreVnd);
}

function AiGradePill({ grade, className }: { grade: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold tabular-nums text-primary ring-1 ring-primary/25 sm:text-xs",
        className,
      )}
      title="Điểm AI (hiểu bài & thực hành)"
    >
      {grade}/10
    </span>
  );
}

/** Góc nhỏ — hiện khi chọn một người trong roster. */
export function DebriefParticipantPeek({
  participant,
  outcome,
  badges,
  rank,
  aiReview,
  waiting,
  aiWaiting,
  incomplete,
}: {
  participant: ParticipantView;
  outcome: ParticipantOutcome | null;
  badges: BadgeView[];
  rank: number | null;
  aiReview: AiDebriefParticipantReview | null;
  waiting: boolean;
  aiWaiting: boolean;
  incomplete: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-muted/25 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Đang xem
      </p>
      <div className="flex items-start gap-2.5">
        <ParticipantAvatar participant={participant} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">
            {participant.displayName}
            {participant.isSelf ? (
              <span className="font-normal text-muted-foreground"> (bạn)</span>
            ) : null}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {participant.role ? (
              <RoleBadge role={participant.role as Role} />
            ) : null}
            {participant.isBot ? (
              <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                Bot
              </span>
            ) : null}
            {rank != null ? (
              <span className="text-[10px] text-muted-foreground">Hạng {rank}</span>
            ) : null}
            {aiReview ? <AiGradePill grade={aiReview.grade} /> : null}
          </div>
        </div>
      </div>

      {aiWaiting ? (
        <p className="mt-2 text-xs text-muted-foreground">AI đang chấm điểm…</p>
      ) : aiReview ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{aiReview.comment}</p>
      ) : null}

      {waiting ? (
        <p className="mt-2 text-xs text-muted-foreground">Đang tính điểm…</p>
      ) : outcome ? (
        <div className="mt-2.5 space-y-1.5 text-xs">
          <p className="flex justify-between gap-2">
            <span className="text-muted-foreground">{scoreLabel(outcome.role)}</span>
            <span className="font-bold tabular-nums">{formatScore(outcome)}</span>
          </p>
          {outcome.role === "CONSUMER" ? (
            <p className="text-muted-foreground">
              {outcome.fulfilledUnits ?? 0}/{outcome.needUnits ?? 0} đơn vị
              {outcome.avgBuyPriceVnd != null
                ? ` · TB ${formatThousandDong(outcome.avgBuyPriceVnd)}`
                : null}
            </p>
          ) : null}
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {badges.map((b) => (
                <span
                  key={b.type}
                  className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-primary"
                >
                  {BADGE_LABELS[b.type] ?? b.type}
                </span>
              ))}
            </div>
          ) : incomplete && participant.role && !participant.isBot ? (
            <p className="text-[10px] text-muted-foreground">
              Danh hiệu khi hoàn tất đủ 4 vòng.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Chưa có kết quả.</p>
      )}
    </div>
  );
}

export function DebriefParticipantRoster({
  participants,
  selectedId,
  onSelect,
  outcomesById,
}: {
  participants: ParticipantView[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  outcomesById: Map<string, ParticipantOutcome>;
}) {
  const sorted = [...participants].sort((a, b) => {
    const sa = outcomesById.get(a.id)?.scoreVnd ?? -1;
    const sb = outcomesById.get(b.id)?.scoreVnd ?? -1;
    return sb - sa;
  });

  return (
    <div className="flex flex-wrap gap-2">
      {sorted.map((p) => {
        const selected = p.id === selectedId;
        const outcome = outcomesById.get(p.id);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(
              "rounded-full p-0.5 transition-transform hover:scale-105",
              selected && "ring-2 ring-primary ring-offset-2 ring-offset-surface",
            )}
            title={`${p.displayName}${p.isBot ? " · Bot" : ""}${outcome ? ` · ${formatScore(outcome)}` : ""}`}
            aria-pressed={selected}
            aria-label={p.displayName}
          >
            <ParticipantAvatar participant={p} size="sm" />
          </button>
        );
      })}
    </div>
  );
}

export function DebriefScoreboardOverview({
  participants,
  outcomesById,
  badges,
  aiByParticipantId,
  waiting,
}: {
  participants: ParticipantView[];
  outcomesById: Map<string, ParticipantOutcome>;
  badges: BadgeView[];
  aiByParticipantId: Map<string, AiDebriefParticipantReview>;
  waiting: boolean;
}) {
  const sorted = [...participants].sort((a, b) => {
    const sa = outcomesById.get(a.id)?.scoreVnd ?? -1;
    const sb = outcomesById.get(b.id)?.scoreVnd ?? -1;
    return sb - sa;
  });

  if (waiting) {
    return <p className="text-sm text-muted-foreground">Đang tính điểm và tổng hợp…</p>;
  }

  return (
    <ul className="divide-y divide-border/60">
      {sorted.map((p, i) => {
        const outcome = outcomesById.get(p.id);
        const hasBadge = badges.some((b) => b.participantId === p.id);
        const ai = aiByParticipantId.get(p.id);
        return (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="w-5 shrink-0 text-center text-xs font-bold tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <ParticipantAvatar participant={p} size="sm" showStatus={false} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {p.displayName}
                  {p.isBot ? (
                    <span className="ml-1 text-xs font-normal text-sky-600 dark:text-sky-400">
                      Bot
                    </span>
                  ) : null}
                </p>
                {p.role ? (
                  <div className="truncate text-xs text-muted-foreground">
                    <RoleBadge role={p.role as Role} />
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {ai ? <AiGradePill grade={ai.grade} /> : null}
              {hasBadge ? (
                <span className="text-xs text-primary" title="Có danh hiệu">
                  ★
                </span>
              ) : null}
              <span className="text-sm font-bold tabular-nums">
                {outcome ? formatScore(outcome) : "—"}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
