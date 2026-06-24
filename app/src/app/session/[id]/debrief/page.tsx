import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DebriefView } from "@/components/session/debrief-view";

export default async function DebriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  const { id } = await params;
  return <DebriefView sessionId={id} />;
}
