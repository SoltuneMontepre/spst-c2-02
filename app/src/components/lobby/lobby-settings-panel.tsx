"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, BookOpen, Shuffle, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  getRememberedProjectorView,
  playerHref,
  rememberProjectorView,
} from "@/hooks/use-projector-mode";
import { cn } from "@/lib/utils";

function SettingRow({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  tone = "session",
}: {
  icon: typeof Sparkles;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** "personal" = only affects your own view, not the shared room config. */
  tone?: "session" | "personal";
}) {
  const isPersonal = tone === "personal";
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3.5 text-sm",
        isPersonal
          ? "border-sky-200 bg-sky-50"
          : "border-border bg-muted/30",
      )}
    >
      <Icon
        className={cn("mt-0.5 size-4 shrink-0", isPersonal ? "text-sky-600" : "text-primary")}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="font-medium text-foreground">{label}</p>
          {isPersonal ? (
            <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sky-700">
              Cá nhân
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        label={label}
      />
    </div>
  );
}

export function LobbySettingsPanel({
  isHost,
  sessionId,
  status,
  autoHost,
  autoHostPending,
  onSetAutoHost,
  autoAssignRoles,
  autoAssignRolesPending,
  onSetAutoAssignRoles,
  guidanceEnabled,
  guidanceEnabledPending,
  onSetGuidanceEnabled,
}: {
  isHost: boolean;
  /** Needed to remember/apply the host's "play as player" preference for this room. */
  sessionId?: string;
  status?: string;
  autoHost: boolean;
  autoHostPending: boolean;
  onSetAutoHost: (enabled: boolean) => void;
  autoAssignRoles: boolean;
  autoAssignRolesPending: boolean;
  onSetAutoAssignRoles: (enabled: boolean) => void;
  guidanceEnabled: boolean;
  guidanceEnabledPending: boolean;
  onSetGuidanceEnabled: (enabled: boolean) => void;
}) {
  const router = useRouter();
  const [playAsPlayer, setPlayAsPlayer] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    setPlayAsPlayer(getRememberedProjectorView(sessionId) === "player");
  }, [sessionId]);

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">Cài đặt phiên</h3>
      <div className="mt-3 flex flex-col gap-2.5">
        <SettingRow
          icon={Sparkles}
          label="Bot dẫn dắt (AI điều phối)"
          description={
            isHost
              ? autoHost
                ? "Đang bật — phiên tự chuyển giai đoạn khi mọi người sẵn sàng."
                : "Để AI tự điều phối timer và lời dẫn; bạn vẫn là host phòng."
              : undefined
          }
          checked={autoHost}
          onCheckedChange={isHost ? onSetAutoHost : undefined}
          disabled={!isHost || autoHostPending}
        />

        <SettingRow
          icon={Shuffle}
          label="Tự động phân vai"
          description={
            autoAssignRoles
              ? "Hệ thống tự động gán vai và cân bằng cơ cấu cho người chơi mới vào phòng."
              : "Bạn gán vai thủ công cho từng người chơi và bot ở phần bên dưới."
          }
          checked={autoAssignRoles}
          onCheckedChange={isHost ? onSetAutoAssignRoles : undefined}
          disabled={!isHost || autoAssignRolesPending}
        />

        <SettingRow
          icon={BookOpen}
          label="Hướng dẫn giải thích"
          description={
            guidanceEnabled
              ? "Người chơi sẽ thấy hộp giải thích lý thuyết trong suốt phiên chợ."
              : "Ẩn phần giải thích lý thuyết trong suốt phiên chợ."
          }
          checked={guidanceEnabled}
          onCheckedChange={isHost ? onSetGuidanceEnabled : undefined}
          disabled={!isHost || guidanceEnabledPending}
        />

        {isHost && sessionId && status ? (
          <SettingRow
            icon={User}
            tone="personal"
            label="Chơi như người chơi"
            description={
              playAsPlayer
                ? "Bạn sẽ vào vai của mình thay vì bảng điều phối khi phiên bắt đầu."
                : "Bật để tự động vào vai của bạn thay vì bảng điều phối khi phiên bắt đầu."
            }
            checked={playAsPlayer}
            onCheckedChange={(enabled) => {
              setPlayAsPlayer(enabled);
              rememberProjectorView(sessionId, enabled ? "player" : "projector");
              if (enabled && status !== "LOBBY") {
                router.push(playerHref(sessionId, status));
              }
            }}
          />
        ) : null}
      </div>
    </Card>
  );
}
