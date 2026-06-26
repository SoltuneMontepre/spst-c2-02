"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiFetch, ApiClientError } from "./use-api";
import { useSessionRealtimeOptional } from "@/components/realtime/session-realtime-provider";
import type { SessionSnapshot, SessionResultView } from "@/lib/session-service";

interface CreatedSession {
  id: string;
  code: string;
}

export function useCreateRoom() {
  const router = useRouter();
  return useMutation({
    mutationFn: () => apiFetch<CreatedSession>("/api/sessions", { method: "POST" }),
    onSuccess: (data) => router.push(`/host/session/${data.id}`),
    onError: (error) => {
      if (error instanceof ApiClientError && error.code === "HOST_SESSION_LIMIT") {
        router.push("/home");
      }
    },
  });
}

export function useJoinRoom() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      apiFetch<{ sessionId: string }>("/api/sessions/join", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["home-dashboard"] });
      router.push(`/session/${data.sessionId}/lobby`);
    },
  });
}

/** Role-filtered snapshot; live updates via session WebSocket. */
export function useSessionSnapshot(sessionId: string) {
  return useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => apiFetch<SessionSnapshot>(`/api/sessions/${sessionId}`),
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if (error instanceof ApiClientError && error.status === 403) return false;
      return failureCount < 2;
    },
  });
}

export function useSessionResult(sessionId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["session", sessionId, "result"],
    queryFn: () => apiFetch<SessionResultView>(`/api/sessions/${sessionId}/result`),
    enabled,
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d) return false;
      if (d.status === "DEBRIEF" && !d.aiDebrief) return 5000;
      return false;
    },
  });
}

export function useSetReady(sessionId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["session", sessionId] as const;
  const realtime = useSessionRealtimeOptional();
  return useMutation({
    mutationFn: async (ready: boolean) => {
      if (realtime?.send({ op: "ready", ready })) {
        return { ok: true };
      }
      return apiFetch(`/api/sessions/${sessionId}/ready`, {
        method: "POST",
        body: JSON.stringify({ ready }),
      });
    },
    onMutate: async (ready) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SessionSnapshot>(queryKey);
      if (previous) {
        queryClient.setQueryData<SessionSnapshot>(queryKey, {
          ...previous,
          participants: previous.participants.map((p) =>
            p.isSelf ? { ...p, ready } : p,
          ),
        });
      }
      return { previous };
    },
    onError: (_err, _ready, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
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
