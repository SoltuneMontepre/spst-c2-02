import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { currentUser } from "@/lib/api";
import { db } from "@/lib/db";
import { roomCancelledHomeHref } from "@/lib/room-cancelled";
import { DebriefView } from "@/components/session/debrief-view";

export default async function DebriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  const { id } = await params;

  const user = await currentUser();
  if (user) {
    const gameSession = await db.gameSession.findUnique({
      where: { id },
      select: { status: true },
    });
    if (gameSession?.status === "CANCELLED") {
      redirect(roomCancelledHomeHref("solo_timeout"));
    }
  }

  return <DebriefView sessionId={id} />;
}
