"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { CreateRoomStepper } from "@/components/create-room/create-room-stepper";
import { CreateRoomShareCard } from "@/components/create-room/create-room-share-card";
import { CreateRoomSummaryCompact } from "@/components/create-room/create-room-summary";
import type { CreateSessionInput } from "@/lib/create-session-schema";
import { cn } from "@/lib/utils";

export function CreateRoomPreviewStep({
  sessionId,
  code,
  config,
}: {
  sessionId: string;
  code: string;
  config: CreateSessionInput;
}) {
  return (
    <div className="w-full">
      <CreateRoomStepper step={2} />
      <div className="mt-7 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <CreateRoomShareCard code={code} />
        <div className="flex flex-col gap-3.5">
          <CreateRoomSummaryCompact config={config} />
          <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              <p className="text-sm font-semibold text-foreground">Phòng đã sẵn sàng</p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Chia sẻ mã hoặc QR cho học sinh. Bạn có thể bắt đầu phiên khi đủ người.
            </p>
          </div>
          <Link
            href={`/host/session/${sessionId}`}
            className={cn(buttonVariants({ size: "lg" }), "w-full gap-2")}
          >
            Vào bảng điều khiển Host
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/home/create"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
          >
            ← Quay lại cấu hình
          </Link>
        </div>
      </div>
    </div>
  );
}
