"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { useSessionSnapshot, useSessionResult } from "@/hooks/use-session-room";
import { useSessionStream } from "@/hooks/use-session-stream";
import { PriceValueChart } from "@/components/observatory/price-value-chart";
import { RoleBadge } from "@/components/lobby/role-badge";
import { BADGE_LABELS, STATUS_LABELS, scoreLabel } from "@/lib/labels";
import { formatThousandDong } from "@/lib/money";
import { cn } from "@/lib/utils";
import { GameGuidance } from "@/components/learning/game-guidance";
import type { Role } from "@/generated/prisma/enums";

export function DebriefView({ sessionId }: { sessionId: string }) {
  useSessionStream(sessionId);
  const { data: snapshot, isLoading: snapLoading } = useSessionSnapshot(sessionId);
  const showResult =
    snapshot &&
    ["DEBRIEF", "COMPLETED", "INCOMPLETE"].includes(snapshot.status);
  const { data: result, isLoading: resultLoading } = useSessionResult(
    sessionId,
    !!showResult,
  );

  if (snapLoading || !snapshot) {
    return <p className="p-6 text-muted-foreground">Đang tải kết quả…</p>;
  }

  const incomplete = snapshot.status !== "COMPLETED";
  const waiting = showResult && (resultLoading || !result);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 p-4 pb-8">
      <GameGuidance context={{ screen: "debrief" }} />
      <Card>
        <CardHeader>
          <CardTitle>Tổng kết phiên</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm">
            Trạng thái:{" "}
            <span className="font-semibold">{STATUS_LABELS[snapshot.status]}</span>
          </p>
          {snapshot.autoHost && snapshot.status === "DEBRIEF" ? (
            <p className="text-xs text-muted-foreground">
              AI điều phối sẽ tự hoàn tất phiên sau khi hết thời gian debrief.
            </p>
          ) : null}
          {waiting ? (
            <p className="text-sm text-muted-foreground">Đang tính điểm và tổng hợp…</p>
          ) : null}
        </CardContent>
      </Card>

      {result ? (
        <>
          {result.narration ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nhận xét trợ giảng AI</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {result.narration}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {result.analytics.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Giá trị vs giá thị trường</CardTitle>
              </CardHeader>
              <CardContent>
                <PriceValueChart rounds={result.analytics} />
              </CardContent>
            </Card>
          ) : null}

          {result.selfOutcome ? (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-base">Kết quả của bạn</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <RoleBadge role={result.selfOutcome.role as Role} />
                  <span className="font-semibold">
                    {scoreLabel(result.selfOutcome.role)}:{" "}
                    {formatScore(result.selfOutcome)}
                  </span>
                </div>
                {result.selfOutcome.role === "CONSUMER" ? (
                  <p className="text-xs text-muted-foreground">
                    Đáp ứng {result.selfOutcome.fulfilledUnits ?? 0}/
                    {result.selfOutcome.needUnits ?? 0} đơn vị
                    {result.selfOutcome.avgBuyPriceVnd != null
                      ? ` · giá mua TB ${formatThousandDong(result.selfOutcome.avgBuyPriceVnd)}`
                      : null}
                  </p>
                ) : null}
                {result.selfBadges.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {result.selfBadges.map((b) => (
                      <span
                        key={b.type}
                        className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium"
                      >
                        {BADGE_LABELS[b.type] ?? b.type}
                      </span>
                    ))}
                  </div>
                ) : incomplete ? (
                  <p className="text-xs text-muted-foreground">
                    Danh hiệu chỉ trao khi hoàn tất đủ bốn vòng.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bảng điểm</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {result.outcomes
                .filter((o) => !o.isBot)
                .sort((a, b) => b.scoreVnd - a.scoreVnd)
                .map((o) => (
                  <div
                    key={o.participantId}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium">{o.displayName}</span>
                      <RoleBadge role={o.role as Role} />
                      {result.badges.some((b) => b.participantId === o.participantId) ? (
                        <span className="shrink-0 text-xs text-primary">★</span>
                      ) : null}
                    </div>
                    <span className="shrink-0 font-mono text-xs">
                      {formatScore(o)}
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>

          {result.badges.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Danh hiệu</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {result.badges.map((b) => (
                  <div key={`${b.participantId}-${b.type}`} className="flex justify-between">
                    <span>{b.displayName}</span>
                    <span className="font-medium text-primary">
                      {BADGE_LABELS[b.type] ?? b.type}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Link
            href={`/session/${sessionId}/observatory`}
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Xem tháp quan sát chi tiết
          </Link>
        </>
      ) : null}

      <Link href="/home" className={cn(buttonVariants(), "w-full")}>
        Về trang chủ
      </Link>
    </main>
  );
}

function formatScore(o: { role: string; scoreVnd: number }): string {
  if (o.role === "GOVERNMENT") return `${o.scoreVnd} điểm`;
  return formatThousandDong(o.scoreVnd);
}
