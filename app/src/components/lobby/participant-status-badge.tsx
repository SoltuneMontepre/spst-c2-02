import { Check, Circle, Clock, Loader2 } from "lucide-react";
import type { ParticipantView } from "@/lib/session-service";
import { cn } from "@/lib/utils";

type StatusKind = "lobby-ready" | "lobby-not-ready" | "phase-ready" | "phase-playing";

function resolveStatus(p: ParticipantView, inGame: boolean): StatusKind | null {
  if (p.isBot) return null;
  if (inGame) return p.phaseReady ? "phase-ready" : "phase-playing";
  return p.ready ? "lobby-ready" : "lobby-not-ready";
}

const STATUS_CONFIG: Record<
  StatusKind,
  { icon: typeof Check; label: string; className: string }
> = {
  "lobby-ready": {
    icon: Check,
    label: "Sẵn sàng",
    className: "bg-success/15 text-success",
  },
  "lobby-not-ready": {
    icon: Clock,
    label: "Chưa sẵn sàng",
    className: "bg-muted text-muted-foreground",
  },
  "phase-ready": {
    icon: Check,
    label: "Sẵn sàng",
    className: "bg-success/15 text-success",
  },
  "phase-playing": {
    icon: Loader2,
    label: "Đang chơi",
    className: "bg-primary/10 text-primary",
  },
};

/** Ready / playing status pill with icon — used in lobby and in-session rosters. */
export function ParticipantStatusBadge({
  participant,
  inGame = false,
  className,
}: {
  participant: ParticipantView;
  inGame?: boolean;
  className?: string;
}) {
  const kind = resolveStatus(participant, inGame);
  if (!kind) return null;

  const { icon: Icon, label, className: tone } = STATUS_CONFIG[kind];
  const spinning = kind === "phase-playing";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
      title={label}
    >
      <Icon
        className={cn("size-3.5 shrink-0", spinning && "animate-spin")}
        aria-hidden
      />
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}

/** Compact online dot — green when online/bot, muted when offline. */
export function ParticipantPresenceDot({
  participant,
  className,
}: {
  participant: ParticipantView;
  className?: string;
}) {
  const online = participant.isBot || participant.presence === "ONLINE";
  return (
    <span
      className={cn(
        "size-2 shrink-0 rounded-full",
        online ? "bg-success" : "bg-muted-foreground/40",
        className,
      )}
      title={online ? "Trực tuyến" : "Ngoại tuyến"}
      aria-label={online ? "Trực tuyến" : "Ngoại tuyến"}
    />
  );
}

/** Offline badge when disconnected mid-lobby. */
export function ParticipantOfflineBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
      <Circle className="size-3 fill-current" aria-hidden />
      Mất kết nối
    </span>
  );
}
