"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  roomCancelledHomeHref,
  type RoomCancelledReason,
} from "@/lib/room-cancelled";

/** Send the user home when the session was cancelled (not debrief). */
export function useSessionCancelledRedirect(
  status: string | undefined,
  reason?: RoomCancelledReason,
) {
  const router = useRouter();

  useEffect(() => {
    if (status !== "CANCELLED") return;
    router.replace(roomCancelledHomeHref(reason));
  }, [status, reason, router]);
}
