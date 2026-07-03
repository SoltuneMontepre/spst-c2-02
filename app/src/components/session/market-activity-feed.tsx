"use client";

import type { ComponentType } from "react";
import { Activity, BadgeDollarSign, HandCoins, Megaphone, Store } from "lucide-react";
import type { MarketActivityKind, MarketActivityView } from "@/lib/session-service";
import { ROLE_SHORT_LABELS } from "@/lib/display-labels";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<
  MarketActivityKind,
  ComponentType<{ className?: string }>
> = {
  listing: Store,
  wholesale: HandCoins,
  offer: Megaphone,
  trade: BadgeDollarSign,
  policy: Activity,
};

const KIND_STYLE: Record<MarketActivityKind, string> = {
  listing: "bg-primary/10 text-primary",
  wholesale: "bg-violet-100 text-violet-700",
  offer: "bg-amber-100 text-amber-800",
  trade: "bg-success/10 text-success",
  policy: "bg-sky-100 text-sky-700",
};

function timeLabel(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function MarketActivityFeed({
  activity,
  variant = "default",
  className,
}: {
  activity: MarketActivityView[];
  variant?: "default" | "insight";
  className?: string;
}) {
  const compact = variant === "insight";

  return (
    <div
      className={cn(
        "rounded-[14px] border border-border bg-surface",
        compact ? "max-h-64 overflow-y-auto p-2" : "p-3",
        className,
      )}
    >
      {activity.length === 0 ? (
        <p className="px-1 py-2 text-xs text-muted-foreground">
          Diễn biến sẽ hiện khi có niêm yết, trả giá hoặc giao dịch.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {activity.map((item) => {
            const Icon = KIND_ICON[item.kind];
            return (
              <li
                key={item.id}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-[10.5px] bg-muted/20 px-2.5 py-2"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-6 items-center justify-center rounded-full",
                    KIND_STYLE[item.kind],
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-xs font-semibold text-foreground">
                      {item.actorName}
                    </span>
                    {item.actorIsBot ? (
                      <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">
                        Bot
                      </span>
                    ) : null}
                    {item.role ? (
                      <span className="hidden shrink-0 text-[10px] text-muted-foreground sm:inline">
                        {ROLE_SHORT_LABELS[item.role]}
                      </span>
                    ) : null}
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                      {timeLabel(item.at)}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {item.label}
                    {item.detail ? ` · ${item.detail}` : ""}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
