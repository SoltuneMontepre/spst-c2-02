"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";

export function CreateRoomShareCard({
  code,
  className,
  compact,
}: {
  code: string;
  className?: string;
  /** Smaller layout for host lobby dashboard. */
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/home?join=${code}`
      : `/home?join=${code}`;

  useEffect(() => {
    const qrSize = compact ? 140 : 200;
    void QRCode.toDataURL(joinUrl, { width: qrSize, margin: 1 }).then(setQrDataUrl);
  }, [joinUrl, compact]);

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
    <>
      <Card
        className={cn(
          "flex flex-col items-center text-center",
          compact ? "p-5" : "p-7",
          className,
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Mã tham gia phòng
        </p>
        {qrDataUrl ? (
          <div
            className={cn(
              "rounded-2xl bg-foreground shadow-lg",
              compact ? "mt-3 p-2.5" : "mt-5 p-3.5",
            )}
          >
            <img
              src={qrDataUrl}
              alt={`QR tham gia phòng ${code}`}
              className={cn(
                "rounded-lg bg-white",
                compact ? "size-28" : "size-44",
              )}
              width={compact ? 112 : 176}
              height={compact ? 112 : 176}
            />
          </div>
        ) : (
          <div
            className={cn(
              "animate-pulse rounded-2xl bg-muted",
              compact ? "mt-3 size-28" : "mt-5 size-44",
            )}
          />
        )}
        <p
          className={cn(
            "font-mono font-bold tracking-[0.2em] text-primary",
            compact ? "mt-3 text-2xl" : "mt-5 text-4xl sm:text-5xl",
          )}
        >
          {code}
        </p>
        <p className={cn("text-muted-foreground", compact ? "mt-1.5 text-xs" : "mt-2 text-sm")}>
          Chia sẻ mã này với học sinh để họ tham gia phòng
        </p>
        <div
          className={cn(
            "flex w-full gap-2",
            compact ? "mt-3 max-w-[240px]" : "mt-5 max-w-xs gap-2.5",
          )}
        >
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
