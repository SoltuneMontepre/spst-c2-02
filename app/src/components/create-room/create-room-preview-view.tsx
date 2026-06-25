"use client";

import Link from "next/link";
import { SessionNav } from "@/components/session/session-nav";
import { CreateRoomPreviewStep } from "@/components/create-room/create-room-preview-step";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import type { CreateSessionInput } from "@/lib/create-session-schema";

export function CreateRoomPreviewView({
  displayName,
  sessionId,
}: {
  displayName: string;
  sessionId: string;
}) {
  const { data, isLoading } = useSessionSnapshot(sessionId);

  const config: CreateSessionInput | null = data
    ? {
        totalRounds: data.totalRounds as 2 | 3 | 4,
        maxPlayers: data.maxPlayers,
        autoAssignRoles: data.autoAssignRoles,
        guidanceEnabled: data.guidanceEnabled,
        autoHost: data.autoHost,
      }
    : null;

  return (
    <div className="flex min-h-full flex-col">
      <SessionNav displayName={displayName} sessionLabel="Tạo phòng mới" />
      <main className="w-full flex-1 p-4 pb-10 sm:p-6 lg:px-8">
        <div className="mb-6">
          <Link href="/home" className="text-sm text-muted-foreground hover:text-foreground">
            ← Trang chủ
          </Link>
        </div>
        {isLoading || !data || !config ? (
          <p className="text-muted-foreground">Đang tải phòng…</p>
        ) : (
          <CreateRoomPreviewStep sessionId={sessionId} code={data.code} config={config} />
        )}
      </main>
    </div>
  );
}
