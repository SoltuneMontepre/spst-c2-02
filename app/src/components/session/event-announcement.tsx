"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { EVENT_COPY, PHASE_BANNERS } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Mission-style banner for the Biến cố phase (and INTRO preview of vòng 1). */
export function EventPhaseBanner({
  round,
  preview = false,
}: {
  round: number;
  /** INTRO: upcoming event before vòng 1 starts. */
  preview?: boolean;
}) {
  const event = EVENT_COPY[round];
  if (!event) return null;

  return (
    <div className="flex w-full items-start gap-3.5 rounded-[18px] bg-gradient-to-r from-amber-600 to-amber-500 px-5 py-4 shadow-md sm:items-center sm:py-5">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
        <Megaphone className="size-6 text-white" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/75">
            {preview ? "Biến cố sắp tới" : "Biến cố vòng này"}
          </p>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white">
            {preview ? `Vòng ${round}` : "Biến cố"}
          </span>
        </div>
        <p className="mt-0.5 text-lg font-extrabold leading-tight text-white sm:text-xl">
          {event.title}
        </p>
        <p className="mt-1 text-sm font-medium text-white/90">{event.body}</p>
      </div>
    </div>
  );
}

/** Full-screen popup when a biến cố is announced. */
export function EventAnnouncementPopup({
  round,
  open,
  onClose,
  preview = false,
}: {
  round: number;
  open: boolean;
  onClose: () => void;
  preview?: boolean;
}) {
  const event = EVENT_COPY[round];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Auto-close after a few seconds, mirroring TFT's round-start banner.
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(timer);
  }, [open, onClose]);

  if (!open || !event) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-announcement-title"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-200 bg-surface shadow-2xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15">
                <Megaphone className="size-6" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                  {preview ? "Sắp tới" : PHASE_BANNERS.EVENT}
                </p>
                <p className="text-sm font-bold">Vòng {round}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              aria-label="Đóng"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          <h2
            id="event-announcement-title"
            className="text-xl font-extrabold tracking-tight text-foreground"
          >
            {event.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {event.body}
          </p>
          <Button className="mt-6 w-full" size="lg" onClick={onClose}>
            Đã hiểu
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Opens the event popup once per session phase key. */
export function useEventAnnouncement(
  sessionId: string,
  status: string,
  phase: string | null,
  currentRound: number,
): {
  open: boolean;
  round: number;
  preview: boolean;
  dismiss: () => void;
} {
  const [open, setOpen] = useState(false);
  const [round, setRound] = useState(1);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const isEvent = phase === "EVENT" && currentRound > 0;
    const isIntro = status === "INTRO";
    if (!isEvent && !isIntro) {
      setOpen(false);
      return;
    }

    const eventRound = isIntro ? 1 : currentRound;
    if (!EVENT_COPY[eventRound]) return;

    const key = isIntro
      ? `event-popup:${sessionId}:intro`
      : `event-popup:${sessionId}:event:${currentRound}`;

    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode — still show once per mount via state below */
    }

    setRound(eventRound);
    setPreview(isIntro);
    setOpen(true);
  }, [sessionId, status, phase, currentRound]);

  return {
    open,
    round,
    preview,
    dismiss: () => setOpen(false),
  };
}
