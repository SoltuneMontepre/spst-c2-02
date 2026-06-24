"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brand } from "@/components/brand";
import { GoogleButton } from "./google-button";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { cn } from "@/lib/utils";

type Tab = "login" | "register";

export function AuthCard({ callbackUrl }: { callbackUrl: string }) {
  const [tab, setTab] = useState<Tab>("login");

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <Brand size={48} withText={false} />
        <CardTitle>Thanh Long Market</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <GoogleButton callbackUrl={callbackUrl} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> hoặc{" "}
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md py-1.5 font-medium transition-colors",
                tab === t ? "bg-surface shadow-sm" : "text-muted-foreground",
              )}
            >
              {t === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          ))}
        </div>
        {tab === "login" ? <LoginForm callbackUrl={callbackUrl} /> : <RegisterForm />}
      </CardContent>
    </Card>
  );
}
