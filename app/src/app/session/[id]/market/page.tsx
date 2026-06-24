import { ComingSoon } from "@/components/session/coming-soon";

export default async function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ComingSoon sessionId={id} title="Khu mua bán" />;
}
