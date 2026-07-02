import { cn } from "@/lib/utils";

export function ChartLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-4 text-xs text-muted-foreground", className)}>
      <span className="flex items-center gap-1">
        <span className="inline-block h-0.5 w-4 bg-[var(--value)]" /> Giá trị chuẩn
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-0.5 w-4 bg-[var(--price)]" /> Giá thị trường
      </span>
    </div>
  );
}
