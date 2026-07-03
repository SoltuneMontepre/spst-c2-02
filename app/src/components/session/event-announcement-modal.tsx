"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { EVENT_COPY } from "@/lib/labels";
import { cn } from "@/lib/utils";

const DISPLAY_MS = 3500;
const FADE_MS = 300;

export function EventAnnouncementModal({ round }: { round: number }) {
  const event = EVENT_COPY[round];
  const [shown, setShown] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const enter = requestAnimationFrame(() => setShown(true));
    const hideTimer = setTimeout(() => setShown(false), DISPLAY_MS);
    const unmountTimer = setTimeout(() => setMounted(false), DISPLAY_MS + FADE_MS);
    return () => {
      cancelAnimationFrame(enter);
      clearTimeout(hideTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!event || !mounted) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300",
        shown ? "opacity-100" : "opacity-0",
      )}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={cn(
          "mx-4 w-full max-w-sm rounded-[26px] bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-[3px] shadow-[0_0_70px_-8px_rgba(251,146,60,0.75)] transition-all duration-300",
          shown ? "scale-100 opacity-100" : "scale-90 opacity-0",
        )}
      >
        <div className="rounded-[23px] bg-[#1c1410] px-7 py-8 text-center text-white">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-400/15 ring-2 ring-amber-300/70">
            <Zap className="size-8 text-amber-300" aria-hidden />
          </div>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.25em] text-amber-300">
            Biến cố · Vòng {round}
          </p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight">{event.title}</p>
          <p className="mt-2.5 text-sm leading-relaxed text-white/70">{event.body}</p>
        </div>
      </div>
    </div>
  );
}
