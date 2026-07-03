"use client";

import { EVENT_COPY } from "@/lib/labels";

export function EventPanel({ round }: { round: number }) {
  const event = EVENT_COPY[round];
  if (!event) return null;

  return (
    <div className="rounded-[14.5px] border border-[#fee685] bg-[#fffbeb] p-[13px]">
      <p className="text-xs font-bold text-[#7b3306]">{event.title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-[#bb4d00]">
        {event.body}
      </p>
    </div>
  );
}

export function InsightSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="pt-1 text-[9px] font-bold uppercase tracking-[1.35px] text-stone-400">
      {children}
    </p>
  );
}
