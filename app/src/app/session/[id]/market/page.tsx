import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MarketPageClient } from "@/components/session/market-page-client";

export default async function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth");
  const { id } = await params;
  return <MarketPageClient sessionId={id} />;
}
