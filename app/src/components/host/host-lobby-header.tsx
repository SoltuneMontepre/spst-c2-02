"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Brand } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HostLobbyHeader({
  code,
  subtitle,
}: {
  code: string;
  subtitle: string;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/home"
            className={cn(buttonVariants({ variant: "outline", size: "icon" }), "size-7")}
            aria-label="Đóng"
          >
            <X className="size-4" />
          </Link>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <Brand className="shrink-0" />
          <span className="truncate text-sm font-semibold">Bảng điều khiển Host</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-success" aria-hidden />
          <span className="font-mono text-xs font-semibold text-success">
            {code} · Đang mở
          </span>
        </div>
        <p className="hidden text-xs text-muted-foreground lg:block">{subtitle}</p>
      </div>
    </header>
  );
}
