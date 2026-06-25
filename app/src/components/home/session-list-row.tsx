import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function SessionListRow({
  code,
  meta,
  submeta,
  badges,
  statusBadge,
  icon,
  href,
  actions,
  highlight,
}: {
  code: string;
  meta: string;
  submeta?: string;
  badges?: ReactNode;
  statusBadge?: ReactNode;
  icon?: ReactNode;
  href?: string;
  actions?: ReactNode;
  highlight?: "host" | "joined";
}) {
  return (
    <li
      className={cn(
        "rounded-xl border p-3",
        highlight === "host"
          ? "border-primary/40 bg-primary/5"
          : highlight === "joined"
            ? "border-accent/40 bg-accent/5"
            : "border-border bg-muted/10",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-3">
          {icon ? (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold tracking-wider">
                {code}
              </span>
              {statusBadge}
              {badges}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
            {submeta ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{submeta}</p>
            ) : null}
          </div>
        </div>
        {href || actions ? (
          <div className="flex w-full gap-2 sm:w-auto sm:shrink-0 sm:flex-wrap sm:items-center sm:justify-end [&_a]:flex-1 [&_button]:flex-1 sm:[&_a]:flex-none sm:[&_button]:flex-none">
            {href ? (
              <Link
                href={href}
                className={cn(buttonVariants({ size: "sm" }), "whitespace-nowrap")}
              >
                Tham gia phòng
              </Link>
            ) : null}
            {actions}
          </div>
        ) : null}
      </div>
    </li>
  );
}
