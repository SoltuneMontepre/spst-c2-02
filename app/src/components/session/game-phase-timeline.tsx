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
  getIntroTimelineHint,
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

export type GamePhaseStepperStripData = Pick<
  SessionSnapshot,
  "status" | "phase" | "currentRound" | "self"
>;

export function GamePhaseStepperStrip({
  data,
  variant = "default",
}: {
  data: GamePhaseStepperStripData;
  variant?: "default" | "map";
}) {
  if (!isInGameTimelineStatus(data.status)) return null;

  const isIntro = data.status === "INTRO";
  const introHint = isIntro ? getIntroTimelineHint(data) : null;
  const isMap = variant === "map";

  const content = (
    <>
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-wider",
          isMap ? "text-stone-500" : "text-muted-foreground",
        )}
      >
        Timeline phiên
      </p>
      {isIntro && introHint ? (
        <div className="mt-2">
          <p className="text-sm font-semibold text-stone-900">{introHint.title}</p>
          <p
            className={cn(
              "mt-0.5 text-xs",
              isMap ? "text-stone-600" : "text-muted-foreground",
            )}
          >
            {introHint.body}
          </p>
        </div>
      ) : (
        <div className="-mx-2 mt-3 overflow-x-auto px-2 pb-1">
          <PhaseStepper phase={data.phase} variant={variant} />
        </div>
      )}
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
