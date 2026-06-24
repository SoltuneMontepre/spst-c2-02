"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "./use-api";

export type HostAction =
  | "start"
  | "next"
  | "pause"
  | "resume"
  | "extend"
  | "end"
  | "cancel";

export function useHostControl(sessionId: string) {
  return useMutation({
    mutationFn: (action: HostAction) =>
      apiFetch(`/api/sessions/${sessionId}/host`, {
        method: "POST",
        body: JSON.stringify({ action }),
      }),
  });
}
