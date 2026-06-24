"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BentoTile } from "@/components/ui/bento-tile";
import { useSessionSnapshot, useSessionResult } from "@/hooks/use-session-room";
import { useSessionStream } from "@/hooks/use-session-stream";
import { PriceValueChart } from "@/components/observatory/price-value-chart";
import { STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { GuidancePanel } from "@/components/learning/guidance-panel";
import { TutorialToggle } from "@/components/learning/tutorial-toggle";
import { useTutorial } from "@/components/learning/tutorial-provider";
import { getGuidance } from "@/lib/game-guidance";
import {
  DebriefParticipantPeek,
  DebriefParticipantRoster,
  DebriefScoreboardOverview,
} from "@/components/session/debrief-participant-summary";
import { aiReviewByParticipantId } from "@/lib/debrief-review";
import type { ParticipantOutcome } from "@/lib/finalize";
import type { ParticipantView } from "@/lib/session-service";
import type { Role } from "@/generated/prisma/enums";

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
  useSessionStream(sessionId);
  const { data: snapshot, isLoading: snapLoading } = useSessionSnapshot(sessionId);
  const { enabled: guidanceOn } = useTutorial();
  const guidance = getGuidance({ screen: "debrief" });

  const showResult = Boolean(
    snapshot &&
      ["DEBRIEF", "COMPLETED", "INCOMPLETE"].includes(snapshot.status),
  );
  const { data: result, isLoading: resultLoading } = useSessionResult(
    sessionId,
    showResult,
  );

  const selfId = snapshot?.participants.find((p) => p.isSelf)?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (selfId && selectedId === null) setSelectedId(selfId);
  }, [selfId, selectedId]);

  const outcomesById = useMemo(() => {
    const map = new Map<string, ParticipantOutcome>();
    if (!result) return map;
    for (const o of result.outcomes) map.set(o.participantId, o);
    return map;
  }, [result]);

  const rankById = useMemo(() => {
    const map = new Map<string, number>();
    if (!result) return map;
    const ranked = [...result.outcomes].sort((a, b) => b.scoreVnd - a.scoreVnd);
    ranked.forEach((o, i) => map.set(o.participantId, i + 1));
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

  if (snapLoading || !snapshot) {
    return <p className="p-8 text-muted-foreground">Đang tải kết quả…</p>;
  }

  const incomplete = snapshot.status !== "COMPLETED";
  const waiting = Boolean(showResult && (resultLoading || !result));
  const aiWaiting = Boolean(showResult && !resultLoading && result && !result.aiDebrief);
  const humanCount = rosterParticipants.filter((p) => !p.isBot).length;
  const botCount = rosterParticipants.filter((p) => p.isBot).length;
  const selected =
    rosterParticipants.find((p) => p.id === selectedId) ??
    rosterParticipants.find((p) => p.isSelf) ??
    rosterParticipants[0] ??
    null;

  const selectedOutcome = selected ? (outcomesById.get(selected.id) ?? null) : null;
  const selectedBadges =
    result && selected
      ? result.badges.filter((b) => b.participantId === selected.id)
      : [];
  const selectedAiReview = selected ? (aiByParticipantId.get(selected.id) ?? null) : null;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="grid grid-cols-12 gap-4 lg:items-start">
        {/* Trái — avatar + peek cá nhân nhỏ */}
        <div className="col-span-12 flex flex-col gap-4 lg:col-span-3 lg:sticky lg:top-6 lg:self-start">
          <BentoTile
            title="Tham gia phiên"
            description={`${humanCount} người · ${botCount} bot`}
          >
            <DebriefParticipantRoster
              participants={rosterParticipants}
              selectedId={selected?.id ?? null}
              onSelect={setSelectedId}
              outcomesById={outcomesById}
            />
            <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
              <span className="mr-3 inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500" aria-hidden />
                Trực tuyến
              </span>
              <span className="mr-3 inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-muted-foreground/50" aria-hidden />
                Ngoại tuyến
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-sky-500" aria-hidden />
                Bot
              </span>
            </p>
          </BentoTile>

          {selected ? (
            <DebriefParticipantPeek
              participant={selected}
              outcome={selectedOutcome}
              badges={selectedBadges}
              rank={rankById.get(selected.id) ?? null}
              aiReview={selectedAiReview}
              waiting={waiting}
              aiWaiting={aiWaiting}
              incomplete={incomplete}
            />
          ) : null}
        </div>

        {/* Giữa — tổng quan & nhận xét chung */}
        <div className="col-span-12 flex flex-col gap-4 lg:col-span-6">
          <BentoTile
            title="Tổng quan phiên"
            description={STATUS_LABELS[snapshot.status]}
          >
            <div className="flex flex-col gap-4">
              {snapshot.autoHost && snapshot.status === "DEBRIEF" ? (
                <p className="text-xs text-muted-foreground">
                  AI điều phối sẽ tự hoàn tất phiên sau khi hết thời gian debrief.
                </p>
              ) : null}

              {aiWaiting ? (
                <p className="text-sm text-muted-foreground">
                  AI đang chấm điểm và viết nhận xét cho phiên…
                </p>
              ) : result?.aiDebrief ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-2xl font-bold tabular-nums text-primary ring-1 ring-primary/25">
                      {result.aiDebrief.overall.grade}
                      <span className="text-sm font-semibold text-primary/70">/10</span>
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Điểm AI — tổng quan phiên
                      </p>
                      <p className="text-sm leading-relaxed">
                        {result.aiDebrief.overall.comment}
                      </p>
                    </div>
                  </div>
                </div>
              ) : result?.narration ? (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Nhận xét trợ giảng AI
                  </p>
                  <p className="text-sm leading-relaxed">{result.narration}</p>
                </div>
              ) : waiting ? (
                <p className="text-sm text-muted-foreground">
                  Đang tạo nhận xét tổng hợp…
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có nhận xét AI cho phiên này.
                </p>
              )}
            </div>
          </BentoTile>

          {result && result.analytics.length > 0 ? (
            <BentoTile
              title="Giá trị vs giá thị trường"
              description="So sánh theo từng vòng"
            >
              <PriceValueChart rounds={result.analytics} />
            </BentoTile>
          ) : null}

          <BentoTile title="Bảng điểm" description="Kết quả game + điểm AI">
            <DebriefScoreboardOverview
              participants={rosterParticipants}
              outcomesById={outcomesById}
              badges={result?.badges ?? []}
              aiByParticipantId={aiByParticipantId}
              waiting={waiting}
            />
          </BentoTile>
        </div>

        {/* Phải — meta & điều hướng */}
        <div className="col-span-12 flex flex-col gap-4 lg:col-span-3 lg:sticky lg:top-6 lg:self-start">
          <BentoTile
            title="Hướng dẫn"
            description={guidance.title}
            headerExtra={<TutorialToggle className="h-8 px-2 text-xs" />}
          >
            {guidanceOn ? (
              <GuidancePanel content={guidance} embedded />
            ) : (
              <p className="text-sm text-muted-foreground">
                Mẹo đã ẩn. Bấm nút góc trên để hiện lại.
              </p>
            )}
          </BentoTile>

          <BentoTile title="Tiếp theo" description="Khám phá thêm hoặc rời phiên">
            <div className="flex flex-col gap-2">
              <Link
                href={`/session/${sessionId}/observatory`}
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              >
                Xem tháp quan sát chi tiết
              </Link>
              <Link href="/home" className={cn(buttonVariants(), "w-full")}>
                Về trang chủ
              </Link>
            </div>
          </BentoTile>
        </div>
      </div>
    </main>
  );
}
