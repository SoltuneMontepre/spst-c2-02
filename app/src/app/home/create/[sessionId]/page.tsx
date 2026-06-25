import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CreateRoomPreviewView } from "@/components/create-room/create-room-preview-view";

export default async function CreateRoomPreviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  const { sessionId } = await params;
  return (
    <CreateRoomPreviewView
      displayName={session.user.name ?? session.user.email ?? "Bạn"}
      sessionId={sessionId}
    />
  );
}
