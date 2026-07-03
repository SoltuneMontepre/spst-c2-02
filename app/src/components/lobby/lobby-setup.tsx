"use client";

import { useState } from "react";
import type { Role, ProductivityProfile } from "@/generated/prisma/enums";
import type { ParticipantView } from "@/lib/session-service";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { PRODUCTIVITY_PROFILES, compositionTarget } from "@/lib/scenario";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Bot } from "lucide-react";
import {
  SetupParticipantRow,
  SetupSelectField,
  ProfilePlaceholder,
  selectClass,
} from "./participant-row";
import type { HostLobbyAction } from "@/hooks/use-host-control";

const ROLES: Role[] = ["PRODUCER", "CONSUMER", "INTERMEDIARY", "GOVERNMENT"];
const PROFILES: ProductivityProfile[] = ["TRADITIONAL", "SOCIAL_AVERAGE", "PIONEER"];

function CompositionSummary({
  targetCount,
  counts,
  autoFillCount,
  autoFillDisabled,
  autoFillHint,
  pending,
  onAutoFill,
}: {
  targetCount: number;
  counts: Record<Role, number>;
  autoFillCount: number;
  autoFillDisabled: boolean;
  autoFillHint: string;
  pending: boolean;
  onAutoFill: () => void;
}) {
  const target = compositionTarget(targetCount);

  return (
    <section className="shrink-0 rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium">
          Cơ cấu mục tiêu · {targetCount} ghế
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2 sm:w-auto"
          disabled={pending || autoFillDisabled}
          onClick={onAutoFill}
        >
          <Bot className="size-4" aria-hidden />
          Tự động thêm {autoFillCount} bot
        </Button>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ROLES.map((role) => (
          <div key={role} className="min-w-0 rounded-lg bg-background px-2.5 py-2 sm:px-3">
            <dt className="truncate text-xs text-muted-foreground">
              {ROLE_LABELS[role]}
            </dt>
            <dd
              className={cn(
                "font-mono text-base font-semibold sm:text-lg",
                counts[role] > target[role]
                  ? "text-danger"
                  : counts[role] === target[role]
                    ? "text-success"
                    : "text-foreground",
              )}
            >
              {counts[role]}/{target[role]}
            </dd>
          </div>
        ))}
      </dl>
      <p
        className={cn(
          "mt-2 text-xs leading-relaxed",
          autoFillDisabled && autoFillCount > 0
            ? "text-danger"
            : "text-muted-foreground",
        )}
      >
        {autoFillHint}
      </p>
    </section>
  );
}

export function LobbySetup({
  participants,
  maxPlayers,
  pending,
  onAction,
}: {
  participants: ParticipantView[];
  maxPlayers: number;
  pending: boolean;
  onAction: (action: HostLobbyAction) => void;
}) {
  const counts = ROLES.reduce(
    (acc, role) => {
      acc[role] = participants.filter((p) => p.role === role).length;
      return acc;
    },
    {} as Record<Role, number>,
  );
  const target = compositionTarget(maxPlayers);
  const unassignedCount = participants.filter((p) => !p.role).length;
  const overTargetRoles = ROLES.filter((role) => counts[role] > target[role]);
  const autoFillCount = Math.max(0, maxPlayers - participants.length);
  const autoFillDisabled =
    autoFillCount === 0 || unassignedCount > 0 || overTargetRoles.length > 0;
  const autoFillHint =
    overTargetRoles.length > 0
      ? `Giảm số người ở vai ${overTargetRoles.map((role) => ROLE_LABELS[role]).join(", ")} về đúng giới hạn trước khi tự động thêm bot.`
      : unassignedCount > 0
        ? `Gán vai cho ${unassignedCount} người còn lại trước khi tự động thêm bot.`
        : autoFillCount > 0
          ? `${autoFillCount} ghế trống sẽ được lấp bằng bot theo đúng cơ cấu vai trò.`
          : "Phòng đã đủ người theo cơ cấu mục tiêu.";

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <CompositionSummary
        targetCount={maxPlayers}
        counts={counts}
        autoFillCount={autoFillCount}
        autoFillDisabled={autoFillDisabled}
        autoFillHint={autoFillHint}
        pending={pending}
        onAutoFill={() => onAction({ action: "autoFillBots" })}
      />

      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
        {participants.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Chưa có người chơi. Thêm bot hoặc chờ người vào phòng.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {participants.map((p) => {
              const roleId = `role-${p.id}`;
              const profileId = `profile-${p.id}`;
              const roleLocked = !p.isBot && p.ready;
              const roleLockedTitle =
                "Người chơi đã sẵn sàng — không thể đổi vai cho đến khi họ bỏ sẵn sàng";

              return (
                <SetupParticipantRow
                  key={p.id}
                  p={p}
                  roleSelectId={roleId}
                  profileSelectId={profileId}
                  trailing={
                    p.isBot ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        disabled={pending}
                        aria-label="Xóa bot"
                        onClick={() =>
                          onAction({ action: "removeBot", participantId: p.id })
                        }
                      >
                        <X className="size-4" />
                      </Button>
                    ) : undefined
                  }
                  roleSelect={
                    <select
                      id={roleId}
                      className={selectClass}
                      disabled={pending || roleLocked}
                      title={roleLocked ? roleLockedTitle : undefined}
                      value={p.role ?? ""}
                      onChange={(e) => {
                        const role = (e.target.value || null) as Role | null;
                        onAction({
                          action: "setRole",
                          participantId: p.id,
                          role,
                          productivityProfile:
                            role === "PRODUCER"
                              ? (p.productivityProfile as ProductivityProfile) ??
                                "SOCIAL_AVERAGE"
                              : null,
                        });
                      }}
                    >
                      <option value="">Chọn vai</option>
                      {ROLES.map((role) => (
                        <option
                          key={role}
                          value={role}
                          disabled={role !== p.role && counts[role] >= target[role]}
                        >
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  }
                  profileSelect={
                    <select
                      id={profileId}
                      className={selectClass}
                      disabled={pending || roleLocked}
                      title={roleLocked ? roleLockedTitle : undefined}
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
                  }
                />
              );
            })}
          </ul>
        )}
      </div>

      <AddBotForm
        pending={pending}
        participantCount={participants.length}
        maxPlayers={maxPlayers}
        counts={counts}
        target={target}
        onAction={onAction}
      />
    </div>
  );
}

function AddBotForm({
  pending,
  participantCount,
  maxPlayers,
  counts,
  target,
  onAction,
}: {
  pending: boolean;
  participantCount: number;
  maxPlayers: number;
  counts: Record<Role, number>;
  target: Record<Role, number>;
  onAction: (action: HostLobbyAction) => void;
}) {
  const [role, setRole] = useState<Role>("CONSUMER");
  const [profile, setProfile] = useState<ProductivityProfile>("SOCIAL_AVERAGE");
  const availableRoles = ROLES.filter((candidate) => counts[candidate] < target[candidate]);
  const selectedRole = availableRoles.includes(role) ? role : (availableRoles[0] ?? role);
  const hasRoom = participantCount < maxPlayers;
  const canAdd = hasRoom && availableRoles.length > 0;
  const showProfile = selectedRole === "PRODUCER";

  return (
    <form
      className="shrink-0 rounded-xl border border-dashed border-border bg-muted/5 p-3 sm:p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canAdd) return;
        onAction({
          action: "addBot",
          role: selectedRole,
          productivityProfile: selectedRole === "PRODUCER" ? profile : undefined,
        });
        setRole("CONSUMER");
        setProfile("SOCIAL_AVERAGE");
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">Thêm từng bot</p>
        <p className="text-xs text-muted-foreground">
          Còn {Math.max(0, maxPlayers - participantCount)} ghế
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <SetupSelectField label="Vai trò" htmlFor="add-bot-role">
          <select
            id="add-bot-role"
            className={selectClass}
            required
            disabled={pending || !canAdd}
            value={selectedRole}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r} disabled={counts[r] >= target[r]}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </SetupSelectField>

        <SetupSelectField label="Hồ sơ sản xuất" htmlFor={showProfile ? "add-bot-profile" : undefined}>
          {showProfile ? (
            <select
              id="add-bot-profile"
              className={selectClass}
              disabled={pending || !canAdd}
              value={profile}
              onChange={(e) => setProfile(e.target.value as ProductivityProfile)}
            >
              {PROFILES.map((profile) => (
                <option key={profile} value={profile}>
                  {PRODUCTIVITY_PROFILES[profile].label}
                </option>
              ))}
            </select>
          ) : (
            <ProfilePlaceholder />
          )}
        </SetupSelectField>

        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending || !canAdd}
        >
          <Bot className="size-4" /> Thêm
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Vai trò đã đủ chỉ tiêu sẽ tự động bị khóa.
      </p>
    </form>
  );
}
