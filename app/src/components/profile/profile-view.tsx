"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { apiFetch } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { STATUS_LABELS } from "@/lib/labels";
import { ROLE_LABELS } from "@/components/lobby/role-badge";

interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

interface HistoryItem {
  sessionId: string;
  code: string;
  status: string;
  role: string | null;
  startedAt: string | null;
  endedAt: string | null;
}

export function ProfileView() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiFetch<Profile>("/api/me"),
  });
  const { data: history } = useQuery({
    queryKey: ["session-history"],
    queryFn: () => apiFetch<HistoryItem[]>("/api/me/sessions"),
  });

  const [name, setName] = useState("");
  const update = useMutation({
    mutationFn: (displayName: string) =>
      apiFetch("/api/me", { method: "PATCH", body: JSON.stringify({ displayName }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
  const remove = useMutation({
    mutationFn: () => apiFetch("/api/me", { method: "DELETE" }),
    onSuccess: () => {
      window.location.href = "/auth";
    },
  });

  if (!profile) return <p className="p-6 text-muted-foreground">Đang tải hồ sơ…</p>;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 p-4 pb-8">
      <Card>
        <CardHeader>
          <CardTitle>Hồ sơ</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p>
            Email: <span className="font-medium">{profile.email}</span>
          </p>
          <Field label="Tên hiển thị" htmlFor="displayName">
            <input
              id="displayName"
              className="w-full rounded-md border px-3 py-2"
              defaultValue={profile.displayName}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Button
            size="sm"
            disabled={update.isPending || !name.trim()}
            onClick={() => update.mutate(name.trim() || profile.displayName)}
          >
            Lưu tên
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lịch sử phiên</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {!history?.length ? (
            <p className="text-muted-foreground">Chưa có phiên nào.</p>
          ) : (
            history.map((h) => (
              <Link
                key={h.sessionId}
                href={`/session/${h.sessionId}/debrief`}
                className="flex justify-between rounded-lg border px-3 py-2 hover:bg-muted"
              >
                <span>
                  {h.code} · {h.role ? ROLE_LABELS[h.role as keyof typeof ROLE_LABELS] : "—"}
                </span>
                <span className="text-muted-foreground">{STATUS_LABELS[h.status]}</span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        size="sm"
        disabled={remove.isPending}
        onClick={() => {
          if (confirm("Xóa tài khoản? Hành động không thể hoàn tác.")) remove.mutate();
        }}
      >
        Xóa tài khoản
      </Button>
    </main>
  );
}
