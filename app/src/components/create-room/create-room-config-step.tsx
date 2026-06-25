"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Landmark, Link2, ShoppingCart, Sprout } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { CreateRoomSummary } from "@/components/create-room/create-room-summary";
import { CreateRoomStepper } from "@/components/create-room/create-room-stepper";
import type { CreateSessionInput } from "@/lib/create-session-schema";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { apiFetch, ApiClientError } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

const ROLE_PREVIEW = [
  { role: "PRODUCER" as const, icon: Sprout, className: "bg-accent/15 text-accent" },
  { role: "CONSUMER" as const, icon: ShoppingCart, className: "bg-primary/10 text-primary" },
  { role: "INTERMEDIARY" as const, icon: Link2, className: "bg-secondary text-foreground" },
  { role: "GOVERNMENT" as const, icon: Landmark, className: "bg-muted text-foreground" },
];

const DEFAULT_CONFIG: CreateSessionInput = {
  totalRounds: 4,
  maxPlayers: 8,
  autoAssignRoles: true,
  guidanceEnabled: true,
  autoHost: true,
};

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-surface shadow transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

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
      router.push(`/home/create/${created.id}`);
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
    <div className="mx-auto max-w-4xl">
      <CreateRoomStepper step={1} />
      <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_1.1fr_0.9fr]">
        <Card className="p-5">
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
                  max={10}
                  onChange={(maxPlayers) => setConfig((c) => ({ ...c, maxPlayers }))}
                />
                <span className="text-sm text-muted-foreground">người (tối đa 10)</span>
              </div>
            </div>

            <ToggleRow
              label="Phân vai tự động"
              description="Hệ thống tự phân vai khi đủ số người"
              checked={config.autoAssignRoles}
              onChange={(autoAssignRoles) => setConfig((c) => ({ ...c, autoAssignRoles }))}
            />
            <ToggleRow
              label="Hiển thị lý thuyết"
              description="Panel giải thích kinh tế học khi chơi"
              checked={config.guidanceEnabled}
              onChange={(guidanceEnabled) => setConfig((c) => ({ ...c, guidanceEnabled }))}
            />
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <CreateRoomSummary config={config} />
          <Card className="border-dashed bg-muted/20 p-5">
            <div className="flex gap-3">
              <BookOpen className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Mục tiêu học tập
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Học sinh hiểu giá trị hàng hóa, giá thị trường và cách cung–cầu tác
                  động tới giá cả qua {config.totalRounds} vòng mô phỏng.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="flex flex-col p-5">
          <h3 className="text-base font-semibold tracking-tight">Vai trò sẽ được phân</h3>
          <ul className="mt-4 flex flex-1 flex-col gap-2">
            {ROLE_PREVIEW.map(({ role, icon: Icon, className }) => (
              <li
                key={role}
                className={cn("flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium", className)}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {ROLE_LABELS[role]}
              </li>
            ))}
          </ul>
          <Button size="lg" className="mt-5 w-full" disabled={pending} onClick={submit}>
            {pending ? "Đang tạo…" : "Tiếp tục →"}
          </Button>
          {error ? <p className="mt-2 text-center text-sm text-danger">{error}</p> : null}
        </Card>
      </div>
    </div>
  );
}
