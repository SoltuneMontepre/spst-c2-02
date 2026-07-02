"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Home,
  LogIn,
  LogOut,
  Plus,
  Settings,
  User,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type HomeNavItem = "home" | "create" | "join" | "history" | "profile";

const menuItems: {
  id: HomeNavItem;
  label: string;
  href: string;
  icon: typeof Home;
}[] = [
  { id: "home", label: "Trang chủ", href: "/home", icon: Home },
  { id: "create", label: "Tạo phòng", href: "/home/create", icon: Plus },
  { id: "join", label: "Vào phòng", href: "/home", icon: LogIn },
  { id: "history", label: "Lịch sử", href: "/home/history", icon: History },
  { id: "profile", label: "Hồ sơ", href: "/profile", icon: User },
];

export function HomeSidebar({
  active,
  user,
}: {
  active: HomeNavItem;
  user?: { name?: string | null; email?: string | null; image?: string | null } | null;
}) {
  function navClass(isActive: boolean) {
    return cn(
      "flex items-center gap-[10.5px] rounded-[14px] px-[10.5px] py-[8.75px] text-[13px] font-semibold transition-colors",
      isActive
        ? "bg-secondary text-primary"
        : "text-foreground hover:bg-muted/60",
    );
  }

  return (
    <aside className="hidden min-h-0 w-[240px] shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-[14.5px] bg-gradient-to-br from-[#c94a2d] to-[#e06040]" />
          <div className="flex flex-col leading-none">
            <span className="text-[12px] font-black tracking-[-0.3px]">PHIÊN CHỢ</span>
            <span className="text-[9px] font-bold uppercase tracking-[1.35px] text-primary">GIÁ TRỊ ONLINE</span>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Điều hướng chính">
        <p className="px-[10.5px] pb-1 text-[9px] font-bold uppercase tracking-[1.35px] text-muted-foreground">
          Menu chính
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={navClass(item.id === active)}
            >
              <Icon className="size-[16px] shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/settings"
          className={navClass(false)}
        >
          <Settings className="size-[16px] shrink-0" aria-hidden />
          Cài đặt
        </Link>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/auth" })}
          className="flex w-full items-center gap-[10.5px] rounded-[14px] px-[10.5px] py-[8.75px] text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted/60"
        >
          <LogOut className="size-[16px] shrink-0" aria-hidden />
          Đăng xuất
        </button>

        {user ? (
          <div className="mt-2 flex items-center gap-2 rounded-[14px] border border-border p-2">
            <div className="size-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[12px] font-semibold">{user.name || "Người dùng"}</span>
              <span className="text-[10px] text-muted-foreground">{user.email || ""}</span>
            </div>
            <div className="ml-auto w-[3px] h-full rounded-full bg-primary" />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
