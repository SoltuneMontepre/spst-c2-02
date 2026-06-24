import { ComingSoon } from "@/components/session/coming-soon";

export default async function ObservatoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ComingSoon sessionId={id} title="Tháp quan sát" />;
}
