import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CreateRoomConfigView } from "@/components/create-room/create-room-config-view";

export default async function CreateRoomPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  return (
    <CreateRoomConfigView displayName={session.user.name ?? session.user.email ?? "Bạn"} />
  );
}
