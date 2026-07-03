"use client";

import { Coins, Package, ShoppingBag, Sprout } from "lucide-react";
import { MarketActivityFeed } from "@/components/session/market-activity-feed";
import { formatThousandDong } from "@/lib/money";
import type { SessionSnapshot } from "@/lib/session-service";
import type {
  ConsumerRoundState,
  GovernmentRoundState,
  ProducerRoundState,
} from "@/lib/role-state";
import { cn } from "@/lib/utils";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </p>
  );
}

function ResourceRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface px-3.5 py-3">
      <span className="flex min-w-0 items-center gap-2.5 text-sm text-muted-foreground">
        <Icon className="size-4 shrink-0 text-primary" aria-hidden />
        <span className="truncate font-medium">{label}</span>
      </span>
      <span className="shrink-0 font-mono text-sm font-bold text-foreground">
        {value}
      </span>
    </div>
  );
}

function resourcesForSelf(data: SessionSnapshot): { label: string; value: string; icon: typeof Coins }[] {
  const self = data.self;
  if (!self?.role) return [];

  const rows: { label: string; value: string; icon: typeof Coins }[] = [];

  if (self.balanceVnd != null) {
    rows.push({
      label: "Ví",
      value: formatThousandDong(self.balanceVnd),
      icon: Coins,
    });
  }

  const inventoryUnits = self.inventory.reduce((s, l) => s + l.availableQuantity, 0);
  const listedUnits = self.listings.reduce((s, l) => s + l.availableQuantity, 0);

  if (self.role === "PRODUCER") {
    const state = self.roleState as ProducerRoundState | null;
    if (state?.kind === "PRODUCER") {
      rows.push({
        label: "Đã sản xuất",
        value: `${state.producedQuantity} thùng`,
        icon: Sprout,
      });
    }
    rows.push({
      label: "Tồn kho",
      value: `${inventoryUnits} thùng`,
      icon: Package,
    });
    if (listedUnits > 0) {
      rows.push({
        label: "Đang bán",
        value: `${listedUnits} thùng`,
        icon: ShoppingBag,
      });
    }
  }

  if (self.role === "CONSUMER") {
    const state = self.roleState as ConsumerRoundState | null;
    const fulfilled = state?.fulfilledUnits ?? 0;
    const need = state?.needTarget ?? 0;
    rows.push({
      label: "Nhu cầu",
      value: `${fulfilled}/${need} thùng`,
      icon: Package,
    });
  }

  if (self.role === "INTERMEDIARY") {
    rows.push({
      label: "Tồn kho",
      value: `${inventoryUnits} thùng`,
      icon: Package,
    });
    if (listedUnits > 0) {
      rows.push({
        label: "Đang bán",
        value: `${listedUnits} thùng`,
        icon: ShoppingBag,
      });
    }
  }

  if (self.role === "GOVERNMENT") {
    const state = self.roleState as GovernmentRoundState | null;
    if (state?.kind === "GOVERNMENT" && state.policySpendVnd > 0) {
      rows.push({
        label: "Chi chính sách",
        value: formatThousandDong(state.policySpendVnd),
        icon: Coins,
      });
    }
  }

  return rows;
}

export function MapResourcesPanel({
  data,
  className,
}: {
  data: SessionSnapshot;
  className?: string;
}) {
  const resources = resourcesForSelf(data);

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-[320px] shrink-0 flex-col overflow-hidden border-l border-border bg-surface xl:w-[360px]",
        className,
      )}
      aria-label="Tài nguyên và nhật ký"
    >
      <div className="shrink-0 border-b border-border px-4 py-4">
        <SectionLabel>Tài nguyên của bạn</SectionLabel>
        <div className="mt-3 flex flex-col gap-2">
          {resources.length > 0 ? (
            resources.map((row) => (
              <ResourceRow
                key={row.label}
                icon={row.icon}
                label={row.label}
                value={row.value}
              />
            ))
          ) : (
            <p className="text-xs text-muted-foreground">Chưa có tài nguyên.</p>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4">
        <SectionLabel>Nhật ký hành động</SectionLabel>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <MarketActivityFeed
            activity={data.marketActivity}
            variant="insight"
            className="max-h-none overflow-y-visible border-0 bg-transparent p-0"
          />
        </div>
      </div>
    </aside>
  );
}
