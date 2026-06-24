"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LobbyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-2xl font-bold tracking-[0.3em]">{code}</span>
      <Button variant="outline" size="sm" onClick={copy}>
        {copied ? "Đã sao chép" : "Sao chép"}
      </Button>
    </div>
  );
}
