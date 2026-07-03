"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateRoomConfigStep } from "@/components/create-room/create-room-config-step";

export function CreateRoomConfigView() {
  return (
    <div className="flex min-h-screen justify-center bg-background px-4 py-6 sm:px-6">
      <main className="flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label="Về trang chủ"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Tạo phòng mới</h1>
        </div>
        <CreateRoomConfigStep />
      </main>
    </div>
  );
}
