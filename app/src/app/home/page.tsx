import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { HomeView } from "@/components/home/home-view";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth");

  return <HomeView user={session.user} />;
}
