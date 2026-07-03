"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import type { CreateSessionInput } from "@/lib/create-session-schema";
import { apiFetch, ApiClientError } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

const DEFAULT_CONFIG: CreateSessionInput = {
  totalRounds: 4,
  maxPlayers: 16,
  autoAssignRoles: true,
  guidanceEnabled: true,
  autoHost: true,
};

export function CreateRoomConfigStep() {
  const router = useRouter();
  const [config, setConfig] = useState<CreateSessionInput>(DEFAULT_CONFIG);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      const created = await apiFetch<{ id: string; code: string }>("/api/sessions", {
        method: "POST",
        body: JSON.stringify(config),
      });
      router.push(`/host/session/${created.id}`);
    } catch (e) {
      if (e instanceof ApiClientError && e.code === "HOST_SESSION_LIMIT") {
        setError(
          `Bạn đã mở tối đa 2 phòng host. Hãy hủy hoặc kết thúc một phòng trước khi tạo mới.`,
        );
        return;
      }
      setError("Không thể tạo phòng. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-center">
        <Card className="w-full max-w-md p-5">
          <h2 className="text-base font-semibold tracking-tight">Cài đặt phiên chơi</h2>
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-xs font-semibold text-foreground">Số vòng chơi</p>
              <div className="mt-2.5 flex gap-2">
                {([2, 3, 4] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setConfig((c) => ({ ...c, totalRounds: n }))}
                    className={cn(
                      "flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                      config.totalRounds === n
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted/30 text-foreground hover:bg-muted/50",
                    )}
                  >
                    {n} vòng
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground">Số người tối đa</p>
              <div className="mt-2.5 flex items-center gap-3">
                <Stepper
                  value={config.maxPlayers}
                  min={4}
                  max={16}
                  onChange={(maxPlayers) => setConfig((c) => ({ ...c, maxPlayers }))}
                />
                <span className="text-sm text-muted-foreground">người (tối đa 16)</span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2.5">
              <Bot className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Bot sẽ tự động lấp đầy các vị trí người chơi còn trống.
              </p>
            </div>
          </div>

          <Button size="lg" className="mt-6 w-full" disabled={pending} onClick={submit}>
            {pending ? "Đang tạo…" : "Tạo phòng"}
          </Button>
          {error ? <p className="mt-2 text-center text-sm text-danger">{error}</p> : null}
        </Card>
      </div>
    </div>
  );
}
