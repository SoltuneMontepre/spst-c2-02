"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";

export function AppHeader({ displayName }: { displayName: string }) {
  return (
    <header className="flex items-center justify-between border-b border-border px-5 py-3">
      <Brand />
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">Xin chào, {displayName}</span>
        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/auth" })}>
          Đăng xuất
        </Button>
      </div>
    </header>
  );
}
