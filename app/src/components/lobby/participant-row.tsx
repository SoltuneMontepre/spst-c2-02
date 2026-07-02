import type { ReactNode } from "react";
import { Bot } from "lucide-react";
import type { ProductivityProfile } from "@/generated/prisma/enums";
import type { ParticipantView } from "@/lib/session-service";
import { RoleBadge } from "./role-badge";
import {
  ParticipantOfflineBadge,
  ParticipantPresenceDot,
  ParticipantStatusBadge,
} from "./participant-status-badge";
import { PRODUCTIVITY_PROFILES } from "@/lib/scenario";

/** Stable two-line roster row — read-only list for non-host lobby view. */
export function ParticipantRow({ p }: { p: ParticipantView }) {
  return <ProjectorParticipantRow p={p} inGame={false} />;
}

/** Host projector / in-session list row with stable two-line layout. */
export function ProjectorParticipantRow({
  p,
  inGame = true,
}: {
  p: ParticipantView;
  inGame?: boolean;
}) {
  return (
    <li className="rounded-xl border border-border bg-muted/10 p-2.5 sm:p-3">
      <div className="flex gap-2">
        <ParticipantPresenceDot participant={p} className="mt-2" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {p.isBot ? (
              <Bot
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-label="Bot"
              />
            ) : null}
            <p
              className="min-w-0 flex-1 truncate font-medium leading-snug"
              title={p.displayName}
            >
              {p.displayName}
              {p.isSelf ? (
                <span className="font-normal text-muted-foreground"> (bạn)</span>
              ) : null}
            </p>
            <ParticipantStatusBadge participant={p} inGame={inGame} />
          </div>
          <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5">
            {!p.isBot && !p.isSelf && p.presence === "OFFLINE" ? (
              <ParticipantOfflineBadge />
            ) : null}
            <RoleBadge role={p.role} />
            {p.role === "PRODUCER" && p.productivityProfile ? (
              <span className="max-w-full truncate rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {
                  PRODUCTIVITY_PROFILES[p.productivityProfile as ProductivityProfile]
                    .label
                }
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

const selectClass =
  "w-full min-w-0 rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring";

function SetupSelectField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ProfilePlaceholder() {
  return (
    <div
      className="flex h-[34px] items-center rounded-md border border-dashed border-border bg-muted/15 px-2 text-xs text-muted-foreground"
      title="Chỉ áp dụng cho vai nhà cung cấp"
    >
      Không áp dụng
    </div>
  );
}

/** Host setup row — fixed grid keeps height stable when producer profile toggles. */
export function SetupParticipantRow({
  p,
  roleSelect,
  profileSelect,
  trailing,
  roleSelectId,
  profileSelectId,
}: {
  p: ParticipantView;
  roleSelect: ReactNode;
  profileSelect: ReactNode;
  trailing?: ReactNode;
  roleSelectId: string;
  profileSelectId: string;
}) {
  const showProfile = p.role === "PRODUCER";

  return (
    <li className="rounded-xl border border-border bg-muted/10 p-3">
      <div className="flex gap-2">
        <ParticipantPresenceDot participant={p} className="mt-2" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {p.isBot ? (
              <Bot
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-label="Bot"
              />
            ) : null}
            <p
              className="min-w-0 flex-1 truncate font-medium leading-snug"
              title={p.displayName}
            >
              {p.displayName}
              {p.isSelf ? (
                <span className="font-normal text-muted-foreground"> (bạn)</span>
              ) : null}
            </p>
            {!p.isBot ? (
              <ParticipantStatusBadge participant={p} inGame={false} />
            ) : null}
            {trailing ? <div className="shrink-0 sm:hidden">{trailing}</div> : null}
          </div>

          <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.25rem] sm:items-end">
            <SetupSelectField label="Vai trò" htmlFor={roleSelectId}>
              {roleSelect}
            </SetupSelectField>
            <SetupSelectField label="Hồ sơ sản xuất" htmlFor={showProfile ? profileSelectId : undefined}>
              {showProfile ? profileSelect : <ProfilePlaceholder />}
            </SetupSelectField>
            {trailing ? (
              <div className="hidden items-end justify-center pb-0.5 sm:flex">
                {trailing}
              </div>
            ) : (
              <div className="hidden sm:block" aria-hidden />
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export { selectClass, SetupSelectField, ProfilePlaceholder };
