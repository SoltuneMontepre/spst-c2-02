import { cn } from "@/lib/utils";

export function ChartLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-4 text-xs text-muted-foreground", className)}>
      <span className="flex items-center gap-1">
        <span className="inline-block h-0.5 w-4 border-t border-dashed border-value" /> Giá trị (neo)
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-0.5 w-4 bg-price" /> Giá thị trường
      </span>
    </div>
  );
}
