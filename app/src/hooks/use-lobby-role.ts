"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./use-api";
import type { Role, ProductivityProfile } from "@/generated/prisma/enums";
import type { SessionSnapshot } from "@/lib/session-service";

export function useLobbyRole(sessionId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["session", sessionId] as const;

  return useMutation({
    mutationFn: (body: {
      role: Role | null;
      productivityProfile?: ProductivityProfile | null;
    }) =>
      apiFetch(`/api/sessions/${sessionId}/lobby-role`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SessionSnapshot>(queryKey);
      if (previous) {
        queryClient.setQueryData<SessionSnapshot>(queryKey, {
          ...previous,
          participants: previous.participants.map((p) =>
            p.isSelf
              ? {
                  ...p,
                  role: body.role,
                  productivityProfile:
                    body.role === "PRODUCER"
                      ? (body.productivityProfile ?? "SOCIAL_AVERAGE")
                      : null,
                }
              : p,
          ),
        });
      }
      return { previous };
    },
    onError: (_err, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
