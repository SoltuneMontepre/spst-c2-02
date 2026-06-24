import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LobbySection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-surface shadow-sm",
        className,
      )}
    >
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">{children}</div>
    </section>
  );
}
