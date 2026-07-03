"use client";

import type { Role } from "@/generated/prisma/enums";
import { RoleBadge } from "@/components/lobby/role-badge";
import { ParticipantAvatar } from "@/components/session/participant-avatar";
import type { BadgeView, ParticipantView } from "@/lib/session-service";
import type { ParticipantOutcome } from "@/lib/finalize";
import type { AiDebriefParticipantReview } from "@/lib/debrief-review";
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
