"use client";

import { SessionRealtimeProvider } from "@/components/realtime/session-realtime-provider";

export function SessionRealtimeShell({
  sessionId,
  children,
}: {
  sessionId: string;
  children: React.ReactNode;
}) {
  return (
    <SessionRealtimeProvider sessionId={sessionId}>{children}</SessionRealtimeProvider>
  );
}
