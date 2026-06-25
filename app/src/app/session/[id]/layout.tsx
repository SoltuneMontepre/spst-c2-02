import { redirect } from "next/navigation";
import { currentUser } from "@/lib/api";
import { resolveSessionAccess } from "@/lib/session-access";

export default async function SessionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/auth");

  const { id } = await params;
  const access = await resolveSessionAccess(user.id, id);
  if (access === "not_found" || access === "denied") redirect("/home");

  return children;
}
