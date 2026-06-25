"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DoorClosed, X } from "lucide-react";
import {
  ROOM_CANCELLED_PARAM,
  roomCancelledMessage,
} from "@/lib/room-cancelled";
import { cn } from "@/lib/utils";

export function RoomCancelledBanner() {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (searchParams.get(ROOM_CANCELLED_PARAM) !== "1") return;
    const reason = searchParams.get("reason");
    setMessage(roomCancelledMessage(reason));
    setOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.delete(ROOM_CANCELLED_PARAM);
    url.searchParams.delete("reason");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [searchParams]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "relative mx-auto mb-5 overflow-hidden rounded-2xl border-2 border-danger/50",
        "bg-gradient-to-r from-danger/20 via-primary/15 to-danger/10",
        "px-5 py-5 shadow-md sm:px-6 sm:py-6",
      )}
      role="alert"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-danger/15 blur-2xl"
        aria-hidden
      />
      <div className="relative flex items-start gap-4">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-danger text-white shadow-sm sm:size-14"
          aria-hidden
        >
          <DoorClosed className="size-6 sm:size-7" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-base font-bold tracking-tight text-danger sm:text-lg">
            Phòng đã bị hủy
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground sm:text-base">
            {message}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="relative shrink-0 rounded-lg border border-danger/25 bg-surface/80 p-2 text-danger transition-colors hover:bg-surface hover:text-foreground"
          aria-label="Đóng thông báo"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
