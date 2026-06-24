import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { RoleTask } from "@/components/session/role-task";

export default async function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  const { id } = await params;
  return <RoleTask sessionId={id} />;
}
