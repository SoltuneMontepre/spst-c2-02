import Link from "next/link";
import { Hammer } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ComingSoon({ sessionId, title }: { sessionId: string; title: string }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <Hammer className="size-10 text-muted-foreground" />
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">
        Khu vực này đang được xây dựng trong giai đoạn tiếp theo.
      </p>
      <Link
        href={`/session/${sessionId}/game`}
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        Về bản đồ
      </Link>
    </main>
  );
}
