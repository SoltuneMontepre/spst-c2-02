"use client";

import { Sparkles } from "lucide-react";

/** AI director narration (TFT-style announcer). */
export function AiHostNarration({ text }: { text: string | null | undefined }) {
  if (!text) return null;
  return (
    <div className="flex gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          Điều phối viên AI
        </p>
        <p className="mt-0.5 leading-relaxed text-foreground">{text}</p>
      </div>
    </div>
  );
}
