import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MapShell } from "@/components/session/map-shell";

export default async function MapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  const { id } = await params;
  return <MapShell sessionId={id} />;
}
