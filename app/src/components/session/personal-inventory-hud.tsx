"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Coins,
  Landmark,
  Link2,
  Package,
  ShoppingBag,
  ShoppingCart,
  Sprout,
} from "lucide-react";
import type { Presence, Role } from "@/generated/prisma/enums";
import type { SelfState } from "@/lib/session-service";
import type { SessionStreamState } from "@/hooks/use-session-stream";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { formatThousandDong } from "@/lib/money";
import type { GovernmentRoundState, ProducerRoundState } from "@/lib/role-state";
import { cn } from "@/lib/utils";

const ROLE_ICON: Record<Role, typeof ShoppingCart> = {
  CONSUMER: ShoppingCart,
  PRODUCER: Sprout,
  INTERMEDIARY: Link2,
  GOVERNMENT: Landmark,
};

const ROLE_RING: Record<Role, string> = {
  CONSUMER: "ring-sky-500/60 bg-sky-500/15 text-sky-700 dark:text-sky-300",
  PRODUCER: "ring-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  INTERMEDIARY: "ring-amber-500/60 bg-amber-500/15 text-amber-800 dark:text-amber-300",
  GOVERNMENT: "ring-violet-500/60 bg-violet-500/15 text-violet-700 dark:text-violet-300",
};

const ROLE_PILL: Record<Role, string> = {
  CONSUMER: "bg-sky-500/15 text-sky-700 ring-1 ring-sky-500/30 dark:text-sky-300",
  PRODUCER: "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300",
  INTERMEDIARY: "bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/30 dark:text-amber-300",
  GOVERNMENT: "bg-violet-500/15 text-violet-700 ring-1 ring-violet-500/30 dark:text-violet-300",
};

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function HudStat({
  icon,
  value,
  label,
  title,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  title?: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 ring-1 ring-border/60"
      title={title ?? `${label}: ${value}`}
    >
      <span className="text-primary" aria-hidden>
        {icon}
      </span>
      <span className="text-xs font-bold tabular-nums leading-none">{value}</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

function connectionStatus(
  streamState: SessionStreamState,
  presence: Presence,
): { label: string; dot: string; pulse?: boolean } {
  if (streamState === "connecting") {
    return { label: "Đang kết nối", dot: "bg-amber-500", pulse: true };
  }
  if (streamState === "disconnected") {
    return { label: "Mất kết nối", dot: "bg-destructive" };
  }
  if (presence === "OFFLINE") {
    return { label: "Ngoại tuyến", dot: "bg-muted-foreground/50" };
  }
  return { label: "Trực tuyến", dot: "bg-emerald-500" };
}

/** Thanh HUD ngang góc trái dưới màn hình — portal để không bị lệch theo layout. */
export function PersonalInventoryHud({
  self,
  displayName,
  presence = "ONLINE",
  streamState = "connected",
}: {
  self: SelfState | null;
  displayName?: string;
  presence?: Presence;
  streamState?: SessionStreamState;
}) {
  const isClient = useIsClient();

  if (!self?.role || !isClient) return null;

  const role = self.role;
  const state = self.roleState as ProducerRoundState | GovernmentRoundState | null;
  const inventoryUnits = self.inventory.reduce((s, l) => s + l.availableQuantity, 0);
  const listedUnits = self.listings.reduce((s, l) => s + l.availableQuantity, 0);
  const status = connectionStatus(streamState, presence);
  const RoleIcon = ROLE_ICON[role];

  const walletTitle =
    self.balanceVnd !== null
      ? `${formatThousandDong(self.balanceVnd)} — tiền mua bán trên chợ`
      : undefined;

  return createPortal(
    <aside
      className={cn(
        "pointer-events-auto fixed bottom-5 left-4 z-40 flex max-w-[min(calc(100vw-5rem),40rem)] items-center gap-2 rounded-full border border-border/80 bg-surface/95 py-1.5 pl-1.5 pr-2.5 shadow-lg backdrop-blur-md sm:bottom-6 sm:left-5 sm:gap-2.5 sm:py-2 sm:pl-2 sm:pr-3",
      )}
      aria-label="Kho cá nhân"
    >
      <span className="relative shrink-0" title={ROLE_LABELS[role]}>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-full ring-2 sm:size-10",
            ROLE_RING[role],
          )}
        >
          <RoleIcon className="size-4 sm:size-[1.125rem]" aria-hidden />
        </span>
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 z-10 size-2.5 rounded-full border-2 border-surface",
            status.dot,
            status.pulse && "animate-pulse",
          )}
          aria-hidden
        />
      </span>

      <div className="min-w-0">
        <p className="truncate text-xs font-bold leading-tight sm:text-sm">
          {displayName ?? "Người chơi"}
        </p>
        <p className="mt-0.5 truncate text-[10px] leading-none text-muted-foreground sm:text-xs">
          {status.label}
        </p>
      </div>

      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs",
          ROLE_PILL[role],
        )}
      >
        {ROLE_LABELS[role]}
      </span>

      <div className="mx-0.5 hidden h-6 w-px shrink-0 bg-border/70 sm:block" aria-hidden />

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {self.balanceVnd !== null ? (
          <HudStat
            icon={<Coins className="size-4" />}
            label="Ví"
            value={formatThousandDong(self.balanceVnd)}
            title={walletTitle}
          />
        ) : null}

        {role === "PRODUCER" && state?.kind === "PRODUCER" ? (
          <>
            <HudStat
              icon={<Package className="size-3.5" />}
              label="Tồn kho"
              value={`${inventoryUnits}`}
              title={`${inventoryUnits} thùng trong kho`}
            />
            <HudStat
              icon={<ShoppingBag className="size-3.5" />}
              label="Đang bán"
              value={`${listedUnits}`}
              title={`${listedUnits} thùng đang bán`}
            />
          </>
        ) : null}

        {role === "INTERMEDIARY" ? (
          <>
            {inventoryUnits > 0 ? (
              <HudStat
                icon={<Package className="size-3.5" />}
                label="Tồn kho"
                value={`${inventoryUnits}`}
              />
            ) : null}
            {listedUnits > 0 ? (
              <HudStat
                icon={<ShoppingBag className="size-3.5" />}
                label="Đang bán"
                value={`${listedUnits}`}
              />
            ) : null}
          </>
        ) : null}

        {role === "GOVERNMENT" &&
        state?.kind === "GOVERNMENT" &&
        state.policySpendVnd > 0 ? (
          <HudStat
            icon={<Coins className="size-3.5" />}
            label="Chi chính sách"
            value={formatThousandDong(state.policySpendVnd)}
          />
        ) : null}
      </div>
    </aside>,
    document.body,
  );
}
