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
  humanCount,
  counts,
}: {
  humanCount: number;
  counts: Record<Role, number>;
}) {
  const target = compositionTarget(humanCount);

  return (
    <section className="shrink-0 rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
      <p className="text-sm font-medium">
        Cơ cấu mục tiêu · {humanCount} người
      </p>
      <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ROLES.map((role) => (
          <div key={role} className="min-w-0 rounded-lg bg-background px-2.5 py-2 sm:px-3">
            <dt className="truncate text-xs text-muted-foreground">
              {ROLE_LABELS[role]}
            </dt>
            <dd
              className={cn(
                "font-mono text-base font-semibold sm:text-lg",
                counts[role] >= target[role] ? "text-success" : "text-foreground",
              )}
            >
              {counts[role]}/{target[role]}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Gán vai cho từng người/bot. Hồ sơ sản xuất chỉ dành cho vai nhà cung cấp. Không
        đổi vai người đã bấm sẵn sàng.
      </p>
    </section>
  );
}

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
  const counts = ROLES.reduce(
    (acc, role) => {
      acc[role] = participants.filter((p) => p.role === role).length;
      return acc;
    },
    {} as Record<Role, number>,
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <CompositionSummary humanCount={humanCount} counts={counts} />

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
                        <option key={role} value={role}>
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

      <AddBotForm pending={pending} onAction={onAction} />
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
  const [role, setRole] = useState<Role>("CONSUMER");
  const [profile, setProfile] = useState<ProductivityProfile>("SOCIAL_AVERAGE");
  const showProfile = role === "PRODUCER";

  return (
    <form
      className="shrink-0 rounded-xl border border-dashed border-border bg-muted/5 p-3 sm:p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onAction({
          action: "addBot",
          role,
          productivityProfile: role === "PRODUCER" ? profile : undefined,
        });
        setRole("CONSUMER");
        setProfile("SOCIAL_AVERAGE");
      }}
    >
      <p className="mb-2 text-xs font-medium text-muted-foreground">Thêm bot</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <SetupSelectField label="Vai trò" htmlFor="add-bot-role">
          <select
            id="add-bot-role"
            className={selectClass}
            required
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
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

        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          <Bot className="size-4" /> Thêm
        </Button>
      </div>
    </form>
  );
}
