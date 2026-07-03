"use client";

import type { ComponentType } from "react";
import {
  Activity,
  BadgeDollarSign,
  HandCoins,
  Megaphone,
  Package,
  Store,
} from "lucide-react";
import type { MarketActivityKind, MarketActivityView } from "@/lib/session-service";
import { ROLE_SHORT_LABELS } from "@/lib/display-labels";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<
  MarketActivityKind,
  ComponentType<{ className?: string }>
> = {
  produce: Package,
  listing: Store,
  wholesale: HandCoins,
  offer: Megaphone,
  trade: BadgeDollarSign,
  policy: Activity,
};

const KIND_STYLE: Record<MarketActivityKind, string> = {
  produce: "bg-emerald-100 text-emerald-700",
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
  const selfCount = activity.filter((item) => item.isSelf).length;

  return (
    <div
      className={cn(
        "rounded-[14px] border border-border bg-surface",
        compact ? "p-0" : "p-3",
        className,
      )}
    >
      {activity.length === 0 ? (
        <p className="px-1 py-2 text-sm text-muted-foreground">
          Nhật ký sẽ hiện khi có sản xuất, niêm yết, trả giá hoặc giao dịch.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {selfCount > 0 && compact ? (
            <li className="px-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
              Của bạn · {selfCount}
            </li>
          ) : null}
          {activity.map((item) => {
            const Icon = KIND_ICON[item.kind];
            return (
              <li
                key={item.id}
                className={cn(
                  "grid grid-cols-[auto_minmax(0,1fr)] gap-2.5 rounded-xl px-3 py-2.5",
                  item.isSelf
                    ? "border-2 border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20"
                    : "border border-transparent bg-muted/20",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-8 items-center justify-center rounded-full",
                    KIND_STYLE[item.kind],
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className={cn(
                        "truncate text-sm font-semibold",
                        item.isSelf ? "text-primary" : "text-foreground",
                      )}
                    >
                      {item.actorName}
                    </span>
                    {item.isSelf ? (
                      <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        Bạn
                      </span>
                    ) : item.actorIsBot ? (
                      <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                        Bot
                      </span>
                    ) : null}
                    {item.role ? (
                      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                        {ROLE_SHORT_LABELS[item.role]}
                      </span>
                    ) : null}
                    <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
                      {timeLabel(item.at)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-xs leading-snug",
                      item.isSelf
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
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
