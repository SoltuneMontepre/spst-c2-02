"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

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

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt={`QR tham gia phòng ${code}`}
          className="rounded-lg border bg-white p-2"
          width={160}
          height={160}
        />
      ) : null}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-2xl font-bold tracking-[0.3em]">{code}</span>
        <p className="max-w-xs text-xs text-muted-foreground">
          Quét QR hoặc nhập mã trên trang chủ để tham gia.
        </p>
        <Button variant="outline" size="sm" onClick={copy} className="w-fit">
          {copied ? "Đã sao chép" : "Sao chép mã"}
        </Button>
      </div>
    </div>
  );
}
