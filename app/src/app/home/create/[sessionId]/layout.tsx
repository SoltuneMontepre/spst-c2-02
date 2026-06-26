import { redirect } from "next/navigation";
import { currentUser } from "@/lib/api";
import { resolveSessionAccess } from "@/lib/session-access";
import { SessionRealtimeShell } from "@/components/realtime/session-realtime-shell";

export default async function CreateRoomPreviewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sessionId: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/auth");

  const { sessionId } = await params;
  const access = await resolveSessionAccess(user.id, sessionId);
  if (access === "not_found" || access === "denied") redirect("/home");

  return <SessionRealtimeShell sessionId={sessionId}>{children}</SessionRealtimeShell>;
}
