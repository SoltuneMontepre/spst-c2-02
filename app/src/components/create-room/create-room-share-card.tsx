"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CreateRoomShareCard({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/home?join=${code}`
      : `/home?join=${code}`;

  useEffect(() => {
    void QRCode.toDataURL(joinUrl, { width: 200, margin: 1 }).then(setQrDataUrl);
  }, [joinUrl]);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <Card className={cn("flex flex-col items-center p-7 text-center", className)}>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Mã tham gia phòng
        </p>
        {qrDataUrl ? (
          <div className="mt-5 rounded-2xl bg-foreground p-3.5 shadow-lg">
            <img
              src={qrDataUrl}
              alt={`QR tham gia phòng ${code}`}
              className="size-44 rounded-lg bg-white"
              width={176}
              height={176}
            />
          </div>
        ) : (
          <div className="mt-5 size-44 animate-pulse rounded-2xl bg-muted" />
        )}
        <p className="mt-5 font-mono text-4xl font-bold tracking-[0.2em] text-primary sm:text-5xl">
          {code}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Chia sẻ mã này với học sinh để họ tham gia phòng
        </p>
        <div className="mt-5 flex w-full max-w-xs gap-2.5">
          <Button variant="outline" className="flex-1 gap-1.5" onClick={copy}>
            <Copy className="size-3.5" aria-hidden />
            {copied ? "Đã sao chép" : "Sao chép"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-1.5"
            onClick={() => setZoomOpen(true)}
          >
            <Maximize2 className="size-3.5" aria-hidden />
            Phóng to
          </Button>
        </div>
      </Card>

      {zoomOpen && qrDataUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-6"
          role="dialog"
          aria-modal
          aria-label="QR phòng toàn màn hình"
          onClick={() => setZoomOpen(false)}
        >
          <div
            className="flex flex-col items-center gap-4 rounded-2xl bg-surface p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={qrDataUrl}
              alt={`QR phòng ${code}`}
              className="size-72 rounded-xl border bg-white p-4"
            />
            <p className="font-mono text-3xl font-bold tracking-[0.25em] text-primary">
              {code}
            </p>
            <Button variant="secondary" onClick={() => setZoomOpen(false)}>
              Đóng
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
