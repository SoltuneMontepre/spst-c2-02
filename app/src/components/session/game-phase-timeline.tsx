"use client";

import { Check, Circle } from "lucide-react";
import { RoleBadge } from "@/components/lobby/role-badge";
import {
  DUTY_STATUS_STYLES,
  PlayerDutyChip,
} from "@/components/session/player-duty-chip";
import {
  buildPlayerEntries,
  buildRoleSummaries,
  getPhaseSteps,
  isInGameTimelineStatus,
} from "@/lib/phase-timeline";
import type { SessionSnapshot } from "@/lib/session-service";
import { cn } from "@/lib/utils";

function PhaseStepper({
  phase,
  variant = "default",
}: {
  phase: string | null;
  variant?: "default" | "map";
}) {
  const steps = getPhaseSteps(phase);
  const isMap = variant === "map";

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
                    isDone || isCurrent
                      ? isMap
                        ? "bg-[#c94a2d]/40"
                        : "bg-primary/50"
                      : isMap
                        ? "bg-stone-200"
                        : "bg-border",
                  )}
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isCurrent &&
                    (isMap
                      ? "border-[#c94a2d] bg-[#c94a2d] text-white"
                      : "border-primary bg-primary text-primary-foreground"),
                  isDone && "border-success bg-success text-white",
                  !isCurrent &&
                    !isDone &&
                    (isMap
                      ? "border-stone-300 bg-stone-100 text-stone-500"
                      : "border-border bg-muted text-muted-foreground"),
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
                    isDone
                      ? isMap
                        ? "bg-[#c94a2d]/40"
                        : "bg-primary/50"
                      : isMap
                        ? "bg-stone-200"
                        : "bg-border",
                  )}
                  aria-hidden
                />
              ) : null}
            </div>
            <span
              className={cn(
                "text-center text-[10px] font-medium leading-tight sm:text-xs",
                isCurrent && (isMap ? "text-[#c94a2d]" : "text-primary"),
                isDone && "text-success",
                !isCurrent && !isDone && (isMap ? "text-stone-500" : "text-muted-foreground"),
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

/** Compact horizontal timeline for the game top bar. */
export function CompactPhaseTimeline({
  phase,
  currentRound,
  totalRounds,
}: {
  phase: string | null;
  currentRound: number;
  totalRounds: number;
}) {
  const steps = getPhaseSteps(phase);

  return (
    <div
      className="flex min-w-0 max-w-full items-center gap-2.5"
      aria-label={`Vòng ${currentRound}/${totalRounds}`}
    >
      <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
        Vòng {currentRound}/{totalRounds}
      </span>
      <ol className="flex min-w-0 items-center gap-0.5 overflow-hidden">
        {steps.map((step, i) => {
          const isCurrent = step.state === "current";
          const isDone = step.state === "done";
          return (
            <li key={step.key} className="flex min-w-0 items-center gap-0.5">
              {i > 0 ? (
                <span
                  className={cn(
                    "h-px w-2 shrink-0 sm:w-3",
                    isDone || isCurrent ? "bg-primary/50" : "bg-border",
                  )}
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:text-[11px]",
                  isCurrent && "bg-primary text-primary-foreground",
                  isDone && "bg-success/15 text-success",
                  !isCurrent && !isDone && "text-muted-foreground",
                )}
                aria-current={isCurrent ? "step" : undefined}
                title={step.label}
              >
                {isDone ? (
                  <Check className="size-3 shrink-0" aria-hidden />
                ) : isCurrent ? (
                  <Circle className="size-2.5 shrink-0 fill-current" aria-hidden />
                ) : null}
                <span
                  className={cn(
                    "truncate",
                    !isCurrent && !isDone && "hidden sm:inline",
                  )}
                >
                  {step.label}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export type GamePhaseStepperStripData = Pick<
  SessionSnapshot,
  | "status"
  | "phase"
  | "currentRound"
  | "totalRounds"
  | "self"
  | "market"
  | "autoHost"
  | "participants"
>;

export function GamePhaseStepperStrip({
  data,
  variant = "default",
}: {
  data: GamePhaseStepperStripData;
  variant?: "default" | "map";
}) {
  if (!isInGameTimelineStatus(data.status)) return null;

  const isMap = variant === "map";

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wider",
            isMap ? "text-stone-500" : "text-muted-foreground",
          )}
        >
          Timeline phiên
        </p>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
            isMap ? "bg-primary/10 text-primary" : "bg-secondary text-primary",
          )}
        >
          Vòng {data.currentRound}/{data.totalRounds}
        </span>
      </div>
      <div className="-mx-2 mt-3 overflow-x-auto px-2 pb-1">
        <PhaseStepper phase={data.phase} variant={variant} />
      </div>
    </>
  );

  if (isMap) {
    return (
      <section
        className="rounded-[14px] border border-stone-200/80 bg-[#fefcf9] px-4 py-3"
        aria-label="Tiến trình giai đoạn"
      >
        {content}
      </section>
    );
  }

  return <div className="border-b border-border px-4 py-3">{content}</div>;
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
        const style = DUTY_STATUS_STYLES[summary.status];
        return (
          <div
            key={summary.role}
            className={cn("rounded-[14px] border p-3", style.card)}
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
      {entries.map((entry) => (
        <li key={entry.participant.id} className="shrink-0">
          <PlayerDutyChip entry={entry} inGame={inGame} />
        </li>
      ))}
    </ul>
  );
}

export function GamePhaseTimeline({
  data,
}: {
  data: GamePhaseStepperStripData;
}) {
  if (!isInGameTimelineStatus(data.status)) return null;

  const isIntro = data.status === "INTRO";
  const roleSummaries = isIntro ? [] : buildRoleSummaries(data);
  const playerEntries = isIntro ? [] : buildPlayerEntries(data);
  const inGame = data.status !== "LOBBY" && data.status !== "INTRO";

  return (
    <section
      className="mt-3 overflow-hidden rounded-[14px] border border-border bg-surface shadow-sm"
      aria-label="Tiến trình giai đoạn và nhiệm vụ"
    >
      <GamePhaseStepperStrip data={data} variant="default" />

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
