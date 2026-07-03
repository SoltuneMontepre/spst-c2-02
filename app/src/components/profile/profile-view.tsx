"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ProfileInfoForm } from "@/components/profile/profile-info-form";
import { ProfileSecurityCard } from "@/components/profile/profile-security-card";
import { apiFetch } from "@/hooks/use-api";
import type { ProfileDashboard } from "@/lib/profile-service";

export function ProfileView() {
  const { data } = useQuery({
    queryKey: ["profile-dashboard"],
    queryFn: () => apiFetch<ProfileDashboard>("/api/me/profile-dashboard"),
  });

  const profile = data?.profile;

  return (
    <div className="flex min-h-screen justify-center bg-background px-4 py-6 sm:px-6">
      <main className="flex w-full max-w-2xl flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label="Về trang chủ"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Cấu hình tài khoản</h1>
        </div>

        {profile ? <ProfileInfoForm profile={profile} /> : null}
        <ProfileSecurityCard />
      </main>
    </div>
  );
}
