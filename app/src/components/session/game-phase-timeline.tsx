"use client";

import { Check, Circle } from "lucide-react";
import { RoleBadge } from "@/components/lobby/role-badge";
import {
  ParticipantPresenceDot,
  ParticipantStatusBadge,
} from "@/components/lobby/participant-status-badge";
import {
  buildPlayerEntries,
  buildRoleSummaries,
  getIntroTimelineHint,
  getPhaseSteps,
  isInGameTimelineStatus,
  type DutyStatus,
} from "@/lib/phase-timeline";
import type { SessionSnapshot } from "@/lib/session-service";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  DutyStatus,
  { label: string; dot: string; card: string }
> = {
  active: {
    label: "Đang làm",
    dot: "bg-primary ring-2 ring-primary/30",
    card: "border-primary/40 bg-primary/5",
  },
  waiting: {
    label: "Chờ",
    dot: "bg-muted-foreground/40",
    card: "border-border bg-surface",
  },
  done: {
    label: "Xong",
    dot: "bg-success",
    card: "border-success/30 bg-success/5",
  },
};

function PhaseStepper({ phase }: { phase: string | null }) {
  const steps = getPhaseSteps(phase);

  return (
    <ol
      className="flex min-w-max snap-x snap-mandatory gap-1 sm:min-w-0 sm:flex-1 sm:justify-between"
      aria-label="Các giai đoạn trong vòng"
    >
      {steps.map((step, i) => {
        const isCurrent = step.state === "current";
        const isDone = step.state === "done";

        return (
          <li
            key={step.key}
            className="flex min-w-[4.5rem] flex-1 snap-start flex-col items-center gap-1.5 px-1 sm:min-w-0"
            aria-current={isCurrent ? "step" : undefined}
          >
            <div className="flex w-full items-center">
              {i > 0 ? (
                <span
                  className={cn(
                    "hidden h-0.5 flex-1 sm:block",
                    isDone || isCurrent ? "bg-primary/50" : "bg-border",
                  )}
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isCurrent && "border-primary bg-primary text-primary-foreground",
                  isDone && "border-success bg-success text-white",
                  !isCurrent && !isDone && "border-border bg-muted text-muted-foreground",
                )}
              >
                {isDone ? (
                  <Check className="size-3.5" aria-hidden />
                ) : (
                  <Circle
                    className={cn("size-2.5", isCurrent && "fill-current")}
                    aria-hidden
                  />
                )}
              </span>
              {i < steps.length - 1 ? (
                <span
                  className={cn(
                    "hidden h-0.5 flex-1 sm:block",
                    isDone ? "bg-primary/50" : "bg-border",
                  )}
                  aria-hidden
                />
              ) : null}
            </div>
            <span
              className={cn(
                "text-center text-[10px] font-medium leading-tight sm:text-xs",
                isCurrent && "text-primary",
                isDone && "text-success",
                !isCurrent && !isDone && "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function RoleSummaryRow({
  summaries,
}: {
  summaries: ReturnType<typeof buildRoleSummaries>;
}) {
  if (summaries.length === 0) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {summaries.map((summary) => {
        const style = STATUS_STYLES[summary.status];
        return (
          <div
            key={summary.role}
            className={cn("rounded-xl border p-3", style.card)}
          >
            <div className="flex flex-wrap items-center gap-2">
              <RoleBadge role={summary.role} />
              {summary.count > 1 ? (
                <span className="text-xs font-medium text-muted-foreground">
                  ×{summary.count}
                </span>
              ) : null}
              <span
                className={cn(
                  "ml-auto inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide",
                  summary.status === "active" && "text-primary",
                  summary.status === "done" && "text-success",
                  summary.status === "waiting" && "text-muted-foreground",
                )}
              >
                <span className={cn("size-2 rounded-full", style.dot)} aria-hidden />
                {style.label}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold leading-snug">
              {summary.title}
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
              {summary.action}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function PlayerChipRow({
  entries,
  inGame,
}: {
  entries: ReturnType<typeof buildPlayerEntries>;
  inGame: boolean;
}) {
  if (entries.length === 0) return null;

  return (
    <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {entries.map((entry) => {
        const { participant, title, action, status, showPhaseReady } = entry;
        const style = STATUS_STYLES[status];
        const ariaLabel = `${participant.displayName}, ${title}. ${action}. ${style.label}.`;

        return (
          <li key={participant.id} className="shrink-0">
            <div
              className={cn(
                "flex w-[min(100vw-2rem,16rem)] flex-col gap-1.5 rounded-xl border p-3",
                style.card,
                participant.isSelf && "ring-2 ring-primary",
              )}
              aria-label={ariaLabel}
            >
              <div className="flex items-center gap-2">
                <ParticipantPresenceDot participant={participant} />
                <span className="min-w-0 truncate text-sm font-semibold">
                  {participant.displayName}
                  {participant.isSelf ? (
                    <span className="sr-only"> (bạn)</span>
                  ) : null}
                </span>
                {participant.isBot ? (
                  <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Bot
                  </span>
                ) : showPhaseReady ? (
                  <ParticipantStatusBadge
                    participant={participant}
                    inGame={inGame}
                    className="ml-auto"
                  />
                ) : (
                  <span
                    className={cn(
                      "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      status === "active" && "bg-primary/15 text-primary",
                      status === "done" && "bg-success/15 text-success",
                      status === "waiting" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {style.label}
                  </span>
                )}
              </div>
              <RoleBadge role={participant.role} />
              <p className="text-xs font-medium leading-snug">{title}</p>
              <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                {action}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function GamePhaseTimeline({
  data,
}: {
  data: Pick<
    SessionSnapshot,
    | "status"
    | "phase"
    | "currentRound"
    | "self"
    | "market"
    | "autoHost"
    | "participants"
  >;
}) {
  if (!isInGameTimelineStatus(data.status)) return null;

  const isIntro = data.status === "INTRO";
  const introHint = isIntro ? getIntroTimelineHint(data) : null;
  const roleSummaries = isIntro ? [] : buildRoleSummaries(data);
  const playerEntries = isIntro ? [] : buildPlayerEntries(data);
  const inGame = data.status !== "LOBBY" && data.status !== "INTRO";

  return (
    <section
      className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
      aria-label="Tiến trình giai đoạn và nhiệm vụ"
    >
      <div className="border-b border-border px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Timeline phiên
        </p>
        {isIntro && introHint ? (
          <div className="mt-2">
            <p className="text-sm font-semibold">{introHint.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{introHint.body}</p>
          </div>
        ) : (
          <div className="-mx-2 mt-3 overflow-x-auto px-2 pb-1">
            <PhaseStepper phase={data.phase} />
          </div>
        )}
      </div>

      {!isIntro ? (
        <div className="flex flex-col gap-4 px-4 py-3">
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Nhiệm vụ theo vai trò
            </p>
            <RoleSummaryRow summaries={roleSummaries} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Người chơi
            </p>
            <PlayerChipRow entries={playerEntries} inGame={inGame} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
