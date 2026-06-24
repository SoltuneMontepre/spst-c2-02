import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ObservatoryView } from "@/components/observatory/observatory-view";

export default async function ObservatoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  const { id } = await params;
  return <ObservatoryView sessionId={id} />;
}
