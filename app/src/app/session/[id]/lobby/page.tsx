import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LobbyView } from "@/components/lobby/lobby-view";

export default async function LobbyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  const { id } = await params;

  return (
    <LobbyView
      sessionId={id}
      displayName={session.user.name ?? "Người chơi"}
    />
  );
}
