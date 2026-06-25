import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TaskPageClient } from "@/components/session/task-page-client";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  const { id } = await params;
  return <TaskPageClient sessionId={id} />;
}
