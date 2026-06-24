"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiFetch } from "./use-api";
import type { SessionSnapshot, SessionResultView } from "@/lib/session-service";

interface CreatedSession {
  id: string;
  code: string;
}

export function useCreateRoom() {
  const router = useRouter();
  return useMutation({
    mutationFn: () => apiFetch<CreatedSession>("/api/sessions", { method: "POST" }),
    onSuccess: (data) => router.push(`/session/${data.id}/lobby`),
  });
}

export function useJoinRoom() {
  const router = useRouter();
  return useMutation({
    mutationFn: (code: string) =>
      apiFetch<{ sessionId: string }>("/api/sessions/join", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
    onSuccess: (data) => router.push(`/session/${data.sessionId}/lobby`),
  });
}

/** Poll the role-filtered snapshot. Replaced by SSE in the realtime phase. */
export function useSessionSnapshot(sessionId: string) {
  return useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => apiFetch<SessionSnapshot>(`/api/sessions/${sessionId}`),
    refetchInterval: 15000, // backup; SSE drives most updates
  });
}

export function useSessionResult(sessionId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["session", sessionId, "result"],
    queryFn: () => apiFetch<SessionResultView>(`/api/sessions/${sessionId}/result`),
    enabled,
    refetchInterval: (q) =>
      q.state.data?.status === "DEBRIEF" ? 5000 : false,
  });
}

export function useSetReady(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ready: boolean) =>
      apiFetch(`/api/sessions/${sessionId}/ready`, {
        method: "POST",
        body: JSON.stringify({ ready }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] }),
  });
}

export function useLeaveRoom(sessionId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/api/sessions/${sessionId}/leave`, { method: "POST" }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["session", sessionId] });
      router.push("/home");
    },
  });
}
