"use client";

import Link from "next/link";
import { ChevronRight, KeyRound, MonitorSmartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function SecurityRow({
  href,
  icon: Icon,
  label,
  disabled,
}: {
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  disabled?: boolean;
}) {
  const inner = (
  <>
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted/50">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
    </>
  );

  const className = cn(
    "flex items-center justify-between rounded-xl border border-border bg-muted/10 px-4 py-3 transition-colors",
    disabled ? "opacity-50" : "hover:bg-muted/30",
  );

  if (disabled || !href) {
    return (
      <div className={className} aria-disabled>
        {inner}
      </div>
    );
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

export function ProfileSecurityCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bảo mật tài khoản</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <SecurityRow
          href="/auth/forgot"
          icon={KeyRound}
          label="Đổi mật khẩu"
        />
        <SecurityRow
          icon={MonitorSmartphone}
          label="Quản lý thiết bị đăng nhập"
          disabled
        />
      </CardContent>
    </Card>
  );
}
