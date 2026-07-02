import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { HomeSidebar } from "@/components/home/home-sidebar";
import { HomeView } from "@/components/home/home-view";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth");

  return (
    <div className="flex min-h-screen">
      <HomeSidebar active="home" user={session.user} />
      <div className="min-w-0 flex-1">
        <HomeView displayName={session.user.name ?? "Người chơi"} />
      </div>
    </div>
  );
}
