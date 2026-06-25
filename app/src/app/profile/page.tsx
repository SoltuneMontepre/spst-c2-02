import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ProfileView } from "@/components/profile/profile-view";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth");

  return <ProfileView displayName={session.user.name ?? "Người chơi"} />;
}
