import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function BentoTile({
  title,
  description,
  children,
  className,
  colSpan = "col-span-12",
  rowSpan,
  headerExtra,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Tailwind col-span classes, e.g. `col-span-12 lg:col-span-4` */
  colSpan?: string;
  rowSpan?: string;
  headerExtra?: ReactNode;
}) {
  return (
    <article
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[14px] border border-border bg-surface shadow-sm",
        colSpan,
        rowSpan,
        className,
      )}
    >
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {headerExtra ? <div className="shrink-0">{headerExtra}</div> : null}
      </header>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col p-5">{children}</div>
    </article>
  );
}
