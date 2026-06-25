"use client";

import Link from "next/link";
import { SessionNav } from "@/components/session/session-nav";
import { CreateRoomConfigStep } from "@/components/create-room/create-room-config-step";

export function CreateRoomConfigView({ displayName }: { displayName: string }) {
  return (
    <div className="flex min-h-full flex-col">
      <SessionNav displayName={displayName} sessionLabel="Tạo phòng mới" />
      <main className="w-full flex-1 p-4 pb-10 sm:p-6 lg:px-8">
        <div className="mb-6">
          <Link href="/home" className="text-sm text-muted-foreground hover:text-foreground">
            ← Trang chủ
          </Link>
        </div>
        <CreateRoomConfigStep />
      </main>
    </div>
  );
}
