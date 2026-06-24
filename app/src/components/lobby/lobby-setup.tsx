"use client";

import type { Role, ProductivityProfile } from "@/generated/prisma/enums";
import type { ParticipantView } from "@/lib/session-service";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { PRODUCTIVITY_PROFILES, compositionTarget } from "@/lib/scenario";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Bot } from "lucide-react";
import type { HostLobbyAction } from "@/hooks/use-host-control";

const ROLES: Role[] = ["PRODUCER", "CONSUMER", "INTERMEDIARY", "GOVERNMENT"];
const PROFILES: ProductivityProfile[] = ["TRADITIONAL", "SOCIAL_AVERAGE", "PIONEER"];

const selectClass =
  "rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring";

export function LobbySetup({
  participants,
  humanCount,
  pending,
  onAction,
}: {
  participants: ParticipantView[];
  humanCount: number;
  pending: boolean;
  onAction: (action: HostLobbyAction) => void;
}) {
  const target = compositionTarget(humanCount);
  const counts = ROLES.reduce(
    (acc, role) => {
      acc[role] = participants.filter((p) => p.role === role).length;
      return acc;
    },
    {} as Record<Role, number>,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">Cơ cấu mục tiêu ({humanCount} người)</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {ROLES.map((role) => (
            <span key={role}>
              {ROLE_LABELS[role]}:{" "}
              <span
                className={cn(
                  "font-mono",
                  counts[role] >= target[role] ? "text-success" : "text-foreground",
                )}
              >
                {counts[role]}/{target[role]}
              </span>
            </span>
          ))}
        </div>
        <p className="mt-1.5">
          Gán vai cho từng người/bot. Khi bắt đầu, bot sẽ tự lấp các vai còn thiếu.
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-border">
        {participants.map((p) => (
          <li key={p.id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <ParticipantName p={p} />
            <div className="flex flex-wrap items-center gap-2">
              <select
                className={selectClass}
                disabled={pending}
                value={p.role ?? ""}
                onChange={(e) => {
                  const role = (e.target.value || null) as Role | null;
                  onAction({
                    action: "setRole",
                    participantId: p.id,
                    role,
                    productivityProfile:
                      role === "PRODUCER"
                        ? (p.productivityProfile as ProductivityProfile) ?? "SOCIAL_AVERAGE"
                        : null,
                  });
                }}
              >
                <option value="">Chọn vai</option>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
              {p.role === "PRODUCER" ? (
                <select
                  className={selectClass}
                  disabled={pending}
                  value={p.productivityProfile ?? "SOCIAL_AVERAGE"}
                  onChange={(e) =>
                    onAction({
                      action: "setRole",
                      participantId: p.id,
                      role: "PRODUCER",
                      productivityProfile: e.target.value as ProductivityProfile,
                    })
                  }
                >
                  {PROFILES.map((profile) => (
                    <option key={profile} value={profile}>
                      {PRODUCTIVITY_PROFILES[profile].label}
                    </option>
                  ))}
                </select>
              ) : null}
              {p.isBot ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={pending}
                  aria-label="Xóa bot"
                  onClick={() =>
                    onAction({ action: "removeBot", participantId: p.id })
                  }
                >
                  <X className="size-4" />
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {p.ready ? "Sẵn sàng" : "Chưa sẵn sàng"}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      <AddBotForm pending={pending} onAction={onAction} />
    </div>
  );
}

function ParticipantName({ p }: { p: ParticipantView }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          p.isBot || p.presence === "ONLINE" ? "bg-success" : "bg-muted-foreground/40",
        )}
        aria-hidden
      />
      <span className="truncate font-medium">
        {p.displayName}
        {p.isSelf ? " (bạn)" : ""}
      </span>
      {p.isBot ? <span className="text-xs text-muted-foreground">Bot</span> : null}
    </div>
  );
}

function AddBotForm({
  pending,
  onAction,
}: {
  pending: boolean;
  onAction: (action: HostLobbyAction) => void;
}) {
  return (
    <form
      className="flex flex-wrap items-end gap-2 rounded-md border border-dashed p-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const role = fd.get("role") as Role;
        const profile = fd.get("profile") as ProductivityProfile;
        if (!role) return;
        onAction({
          action: "addBot",
          role,
          productivityProfile: role === "PRODUCER" ? profile : undefined,
        });
        e.currentTarget.reset();
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="add-bot-role" className="text-xs text-muted-foreground">
          Thêm bot
        </label>
        <select id="add-bot-role" name="role" className={selectClass} required defaultValue="CONSUMER">
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="add-bot-profile" className="text-xs text-muted-foreground">
          Hồ sơ SX
        </label>
        <select
          id="add-bot-profile"
          name="profile"
          className={selectClass}
          defaultValue="SOCIAL_AVERAGE"
        >
          {PROFILES.map((profile) => (
            <option key={profile} value={profile}>
              {PRODUCTIVITY_PROFILES[profile].label}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        <Bot className="size-4" /> Thêm
      </Button>
    </form>
  );
}
