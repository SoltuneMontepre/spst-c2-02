"use client";

import { Lightbulb } from "lucide-react";
import type { GuidanceContent } from "@/lib/game-guidance";

export function GuidancePanel({ content }: { content: GuidanceContent }) {
  return (
    <div
      className="flex gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm"
      role="region"
      aria-label="Hướng dẫn chơi"
    >
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">
          Hướng dẫn
        </p>
        <p className="mt-0.5 font-semibold text-foreground">{content.title}</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-4 text-muted-foreground">
          {content.tips.map((tip) => (
            <li key={tip} className="leading-relaxed">
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
