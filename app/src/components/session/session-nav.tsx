"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, Home, User } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { TutorialToggle } from "@/components/learning/tutorial-toggle";

export function SessionNav({
  displayName,
  sessionLabel,
  sessionCode,
  onLeave,
  leavePending,
  hideHomeLink,
}: {
  displayName: string;
  sessionLabel: string;
  sessionCode?: string;
  onLeave?: () => void;
  leavePending?: boolean;
  hideHomeLink?: boolean;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="flex h-14 w-full items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/home"
          className="flex shrink-0 items-center gap-2 text-foreground hover:opacity-90"
        >
          <Brand size={24} />
        </Link>

        <div className="hidden h-6 w-px bg-border sm:block" aria-hidden />

        <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-3">
          <span className="truncate text-sm font-medium">{sessionLabel}</span>
          {sessionCode ? (
            <span className="font-mono text-xs tracking-widest text-muted-foreground sm:text-sm">
              {sessionCode}
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <TutorialToggle className="hidden sm:inline-flex" />
          {!hideHomeLink ? (
            <Link
              href="/home"
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground md:inline-flex"
            >
              <Home className="size-4" />
              Trang chủ
            </Link>
          ) : null}
          <Link
            href="/profile"
            className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground md:inline-flex"
          >
            <User className="size-4" />
            Hồ sơ
          </Link>
          {onLeave ? (
            <Button
              variant="outline"
              size="sm"
              disabled={leavePending}
              onClick={onLeave}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Rời phòng</span>
            </Button>
          ) : null}
          <span className="hidden text-sm text-muted-foreground lg:inline">
            {displayName}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:inline-flex"
            onClick={() => signOut({ callbackUrl: "/auth" })}
          >
            Đăng xuất
          </Button>
        </div>
      </div>
    </header>
  );
}
