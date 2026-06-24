import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { HostControl } from "@/components/host/host-control";

export default async function HostSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  const { id } = await params;
  return <HostControl sessionId={id} />;
}
