import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackToMap({ sessionId }: { sessionId: string }) {
  return (
    <Link
      href={`/session/${sessionId}/game`}
      className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Về bản đồ
    </Link>
  );
}
