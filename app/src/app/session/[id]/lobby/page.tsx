import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { currentUser } from "@/lib/api";
import { resolveSessionAccess } from "@/lib/session-access";
import { LobbyView } from "@/components/lobby/lobby-view";

export default async function LobbyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  const { id } = await params;

  const user = await currentUser();
  if (!user) redirect("/auth");
  const access = await resolveSessionAccess(user.id, id);
  if (access === "not_found" || access === "denied") redirect("/home");

  return (
    <LobbyView
      sessionId={id}
      displayName={session.user.name ?? "Người chơi"}
    />
  );
}
