import { ComingSoon } from "@/components/session/coming-soon";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ComingSoon sessionId={id} title="Nhiệm vụ theo vai" />;
}
