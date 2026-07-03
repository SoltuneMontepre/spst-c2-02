"use client";

import Image from "next/image";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function formatDateLine(): string {
  return new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function HomeDashboardHeader({ displayName }: { displayName: string }) {
  return (
    <div className="flex items-center gap-4 py-1">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm text-muted-foreground capitalize">{formatDateLine()}</p>
        <h1 className="text-2xl font-bold tracking-tight">
          {getGreeting()},{" "}
          <span className="text-primary">{displayName}</span>
        </h1>
      </div>
      <Image
        src="/dragonfruit.svg"
        alt="Thanh long"
        width={88}
        height={88}
        priority
        className="hidden size-16 shrink-0 object-contain drop-shadow-sm sm:block"
      />
    </div>
  );
}
