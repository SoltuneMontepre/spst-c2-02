"use client";

import { Card } from "@/components/ui/card";
import { EVENT_COPY } from "@/lib/labels";

export function EventPanel({ round }: { round: number }) {
  const event = EVENT_COPY[round];
  if (!event) return null;

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
