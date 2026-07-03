import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { currentUser } from "@/lib/api";
import { resolveSessionAccess } from "@/lib/session-access";
import { LobbyRoom } from "@/components/lobby/lobby-room";

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

  return <LobbyRoom sessionId={id} />;
}
