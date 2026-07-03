"use client";

import type { ReactNode } from "react";
import { Check, User } from "lucide-react";
import type { Role, ProductivityProfile } from "@/generated/prisma/enums";
import type { ParticipantView } from "@/lib/session-service";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import {
  ParticipantPresenceDot,
  ParticipantStatusBadge,
} from "@/components/lobby/participant-status-badge";
import {
  ProfilePlaceholder,
  SetupSelectField,
  selectClass,
} from "@/components/lobby/participant-row";
import { PRODUCTIVITY_PROFILES, compositionTarget } from "@/lib/scenario";
import { useLobbyRole } from "@/hooks/use-lobby-role";
import { ApiClientError } from "@/hooks/use-api";
import { errorMessage } from "@/lib/error-messages";
import { cn } from "@/lib/utils";

const ROLES: Role[] = ["PRODUCER", "CONSUMER", "INTERMEDIARY", "GOVERNMENT"];
const PROFILES: ProductivityProfile[] = ["TRADITIONAL", "SOCIAL_AVERAGE", "PIONEER"];

export function HostLobbyRoster({
  sessionId,
  participants,
  readyCount,
  humanCount,
  headerExtra,
  autoAssignRoles = true,
  maxPlayers,
}: {
  sessionId: string;
  participants: ParticipantView[];
  readyCount: number;
  humanCount: number;
  headerExtra?: ReactNode;
  autoAssignRoles?: boolean;
  maxPlayers?: number;
}) {
  const selfSelect =
    !autoAssignRoles && maxPlayers != null;
  const humans = participants.filter((p) => !p.isBot);
  const setRole = useLobbyRole(sessionId);
  const counts = ROLES.reduce(
    (acc, role) => {
      acc[role] = humans.filter((p) => p.role === role).length;
      return acc;
    },
    {} as Record<Role, number>,
  );
  const target = maxPlayers != null ? compositionTarget(maxPlayers) : null;

  const errorText =
    setRole.isError && setRole.error instanceof ApiClientError
      ? errorMessage(setRole.error.code, setRole.error.message)
      : null;

  return (
    <div className="flex h-full min-w-0 flex-col rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <User className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <h2 className="truncate text-sm font-semibold">Người chơi</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerExtra}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-success">
              {humans.filter((p) => p.presence === "ONLINE").length} online
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{humanCount} tổng</span>
          </div>
        </div>
      </div>

      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Đã sẵn sàng</span>
          <span className="font-semibold">
            {readyCount}/{humanCount}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: humanCount > 0 ? `${(readyCount / humanCount) * 100}%` : "0%",
            }}
          />
        </div>
      </div>

      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {humans.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">
            Chưa có người chơi. Chia sẻ mã phòng để mời học sinh.
          </li>
        ) : (
          humans.map((p) =>
            selfSelect && target && p.isSelf ? (
              <SelfRoleRow
                key={p.id}
                p={p}
                counts={counts}
                target={target}
                pending={setRole.isPending}
                onChange={(role, productivityProfile) =>
                  setRole.mutate({ role, productivityProfile })
                }
              />
            ) : (
              <ReadOnlyRow key={p.id} p={p} showRole={!autoAssignRoles} />
            ),
          )
        )}
      </ul>

      {errorText ? (
        <p className="border-t border-border px-4 py-2 text-sm text-danger" role="alert">
          {errorText}
        </p>
      ) : null}
    </div>
  );
}

function roleLabel(role: Role | null): string {
  return role ? ROLE_LABELS[role] : "Ngẫu nhiên";
}

function ReadOnlyRow({
  p,
  showRole,
}: {
  p: ParticipantView;
  showRole: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border-2 border-transparent px-3 py-2.5 hover:bg-muted/30",
        p.ready
          ? "border-success bg-success/5"
          : p.isSelf && "border-primary bg-primary/5",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
          {p.displayName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <ParticipantPresenceDot participant={p} className="shrink-0" />
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <p
                className="min-w-0 truncate text-sm font-medium leading-snug"
                title={p.displayName}
              >
                {p.displayName}
              </p>
              {p.isSelf ? (
                <span className="shrink-0 text-xs font-semibold text-primary">(bạn)</span>
              ) : null}
            </div>
            <ParticipantStatusBadge participant={p} inGame={false} />
            {p.ready ? (
              <Check className="size-5 shrink-0 text-success" aria-label="Đã sẵn sàng" />
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {showRole
              ? roleLabel(p.role)
              : p.role
                ? ROLE_LABELS[p.role]
                : "Chưa phân vai"}
          </p>
        </div>
      </div>
    </li>
  );
}

function SelfRoleRow({
  p,
  counts,
  target,
  pending,
  onChange,
}: {
  p: ParticipantView;
  counts: Record<Role, number>;
  target: Record<Role, number>;
  pending: boolean;
  onChange: (role: Role | null, productivityProfile?: ProductivityProfile | null) => void;
}) {
  const roleId = `role-self-${p.id}`;
  const profileId = `profile-self-${p.id}`;
  const roleLocked = p.ready;
  const roleLockedTitle =
    "Bạn đã sẵn sàng — bỏ sẵn sàng để đổi vai";
  const showProfile = p.role === "PRODUCER";

  return (
    <li
      className={cn(
        "rounded-xl border-2 px-3 py-2.5",
        p.ready ? "border-success bg-success/5" : "border-primary bg-primary/5",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
          {p.displayName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <ParticipantPresenceDot participant={p} className="shrink-0" />
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <p
                className="min-w-0 truncate text-sm font-medium leading-snug"
                title={p.displayName}
              >
                {p.displayName}
              </p>
              <span className="shrink-0 text-xs font-semibold text-primary">(bạn)</span>
            </div>
            <ParticipantStatusBadge participant={p} inGame={false} />
            {p.ready ? (
              <Check className="size-5 shrink-0 text-success" aria-label="Đã sẵn sàng" />
            ) : null}
          </div>

          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <SetupSelectField label="Vai trò" htmlFor={roleId}>
              <select
                id={roleId}
                className={selectClass}
                disabled={pending || roleLocked}
                title={roleLocked ? roleLockedTitle : undefined}
                value={p.role ?? ""}
                onChange={(e) => {
                  const role = (e.target.value || null) as Role | null;
                  onChange(
                    role,
                    role === "PRODUCER"
                      ? (p.productivityProfile as ProductivityProfile) ??
                          "SOCIAL_AVERAGE"
                      : null,
                  );
                }}
              >
                <option value="">Ngẫu nhiên</option>
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
            </SetupSelectField>

            <SetupSelectField
              label="Hồ sơ sản xuất"
              htmlFor={showProfile ? profileId : undefined}
            >
              {showProfile ? (
                <select
                  id={profileId}
                  className={selectClass}
                  disabled={pending || roleLocked}
                  title={roleLocked ? roleLockedTitle : undefined}
                  value={p.productivityProfile ?? "SOCIAL_AVERAGE"}
                  onChange={(e) =>
                    onChange("PRODUCER", e.target.value as ProductivityProfile)
                  }
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
          </div>
        </div>
      </div>
    </li>
  );
}
