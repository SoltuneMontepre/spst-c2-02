import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { RoomActions } from "@/components/home/room-actions";
import { ActiveHostCard } from "@/components/home/active-host-card";
import { ResumeSessionCard } from "@/components/home/resume-session-card";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth");

  return (
    <>
      <AppHeader displayName={session.user.name ?? "Người chơi"} />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <ActiveHostCard />
        <ResumeSessionCard />
        <RoomActions />
      </main>
    </>
  );
}
