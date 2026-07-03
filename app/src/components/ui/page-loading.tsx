import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Centered loading state — use `fullScreen` for top-level route loads before any chrome renders. */
export function PageLoading({
  label = "Đang tải…",
  fullScreen = false,
  className,
}: {
  label?: string;
  fullScreen?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-1 flex-col items-center justify-center gap-3 bg-background px-4 text-center",
        fullScreen ? "min-h-dvh" : "min-h-[50vh] py-16",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Loader2 className="size-6 animate-spin" aria-hidden />
      </span>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
