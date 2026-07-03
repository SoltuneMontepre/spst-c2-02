import { redirect } from "next/navigation";

export default async function CreateRoomPreviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  redirect(`/host/session/${sessionId}`);
}
