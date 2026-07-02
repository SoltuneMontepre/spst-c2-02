import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { HomeSidebar } from "@/components/home/home-sidebar";
import { HistoryView } from "@/components/home/history-view";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth");

  return (
    <div className="flex min-h-screen">
      <HomeSidebar active="history" user={session.user} />
      <div className="min-w-0 flex-1">
        <HistoryView />
      </div>
    </div>
  );
}
