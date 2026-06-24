"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function DebriefView({ sessionId }: { sessionId: string }) {
  const { data, isLoading } = useSessionSnapshot(sessionId);
  if (isLoading || !data) {
    return <p className="p-6 text-muted-foreground">Đang tải kết quả…</p>;
  }

  const incomplete = data.status !== "COMPLETED";

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tổng kết phiên</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm">
            Trạng thái:{" "}
            <span className="font-semibold">{STATUS_LABELS[data.status]}</span>
          </p>
          {incomplete ? (
            <p className="text-sm text-muted-foreground">
              Phiên chưa hoàn tất đủ bốn vòng nên không trao danh hiệu. Bảng phân tích
              chi tiết sẽ có ở giai đoạn tiếp theo.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Bảng phân tích bốn vòng, kết quả vai và danh hiệu sẽ có ở giai đoạn tiếp theo.
            </p>
          )}
          <Link href="/home" className={cn(buttonVariants())}>
            Về trang chủ
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
