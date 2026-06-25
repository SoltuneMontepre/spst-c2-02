"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";

export function LobbyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/home?join=${code}`
      : `/home?join=${code}`;

  useEffect(() => {
    void QRCode.toDataURL(joinUrl, { width: 160, margin: 1 }).then(setQrDataUrl);
  }, [joinUrl]);

  const copy = () => {
    void (async () => {
      try {
        const ok = await copyTextToClipboard(code);
        if (!ok) return;
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // Clipboard blocked (unfocused tab, embedded preview, etc.)
      }
    })();
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt={`QR tham gia phòng ${code}`}
          className="rounded-xl border bg-white p-3 shadow-sm"
          width={180}
          height={180}
        />
      ) : (
        <div className="size-[180px] animate-pulse rounded-xl bg-muted" />
      )}
      <div className="flex w-full flex-col items-center gap-2 text-center">
        <span className="font-mono text-3xl font-bold tracking-[0.35em]">{code}</span>
        <p className="max-w-xs text-sm text-muted-foreground">
          Quét QR hoặc nhập mã trên trang chủ để tham gia.
        </p>
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? "Đã sao chép" : "Sao chép mã"}
        </Button>
      </div>
    </div>
  );
}
