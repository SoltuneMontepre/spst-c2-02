"use client";

import { Card } from "@/components/ui/card";
import { EVENT_COPY } from "@/lib/labels";

export function EventPanel({
  round,
  variant = "default",
}: {
  round: number;
  variant?: "default" | "insight";
}) {
  const event = EVENT_COPY[round];
  if (!event) return null;

  if (variant === "insight") {
    return (
      <div className="rounded-[14.5px] border border-[#fee685] bg-[#fffbeb] p-[13px]">
        <p className="text-xs font-bold text-[#7b3306]">{event.title}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[#bb4d00]">
          {event.body}
        </p>
      </div>
    );
  }

  return (
    <Card className="border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200">
        Biến cố · Vòng {round}
      </p>
      <p className="mt-2 font-semibold text-foreground">{event.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{event.body}</p>
    </Card>
  );
}

export function InsightSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="pt-1 text-[9px] font-bold uppercase tracking-[1.35px] text-stone-400">
      {children}
    </p>
  );
}
