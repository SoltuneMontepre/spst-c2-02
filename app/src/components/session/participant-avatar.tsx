import { Bot } from "lucide-react";
import type { Presence, Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

const ROLE_RING: Record<Role, string> = {
  PRODUCER: "ring-emerald-500/70",
  CONSUMER: "ring-sky-500/70",
  INTERMEDIARY: "ring-amber-500/70",
  GOVERNMENT: "ring-violet-500/70",
};

export function participantInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export type ParticipantAvatarData = {
  displayName: string;
  avatarUrl: string | null;
  role: Role | null;
  isBot: boolean;
  presence?: Presence;
  isSelf?: boolean;
};

export function ParticipantAvatar({
  participant: p,
  size = "md",
  showStatus = true,
}: {
  participant: ParticipantAvatarData;
  size?: "xs" | "sm" | "md" | "lg";
  showStatus?: boolean;
}) {
  const dim =
    size === "xs"
      ? "size-6"
      : size === "sm"
        ? "size-9"
        : size === "lg"
          ? "size-12"
          : "size-10";
  const ring = p.role ? ROLE_RING[p.role] : "ring-border";
  const online = p.isBot || p.presence === "ONLINE" || p.presence === undefined;

  return (
    <span className="relative inline-flex shrink-0" title={p.displayName}>
      <span
        className={cn(
          "inline-flex items-center justify-center overflow-hidden rounded-full bg-muted ring-2",
          size === "xs" && "ring-1",
          dim,
          ring,
          p.isSelf && "ring-primary ring-offset-1 ring-offset-background",
          p.isSelf && size === "xs" && "ring-offset-0",
        )}
      >
        {p.isBot ? (
          <Bot
            className={cn(
              "text-muted-foreground",
              size === "lg" ? "size-5" : size === "xs" ? "size-3" : "size-4",
            )}
            aria-hidden
          />
        ) : p.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar host varies (OAuth)
          <img src={p.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <span
            className={cn(
              "font-bold text-muted-foreground",
              size === "lg" ? "text-xs" : size === "xs" ? "text-[8px]" : "text-[10px]",
            )}
          >
            {participantInitials(p.displayName)}
          </span>
        )}
      </span>
      {showStatus ? (
        <span
          className={cn(
            "absolute z-10 rounded-full border-2 border-background",
            size === "xs"
              ? "-bottom-px -right-px size-1.5 border"
              : "-bottom-0.5 -right-0.5 size-2.5",
            p.isBot
              ? "bg-sky-500"
              : online
                ? "bg-emerald-500"
                : "bg-muted-foreground/50",
          )}
          aria-hidden
        />
      ) : null}
    </span>
  );
}
