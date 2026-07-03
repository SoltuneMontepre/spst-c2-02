import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { HistoryView } from "@/components/home/history-view";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth");

  return <HistoryView />;
}
