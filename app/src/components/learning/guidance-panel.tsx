"use client";

import { Lightbulb } from "lucide-react";
import type { GuidanceContent } from "@/lib/game-guidance";

export function GuidancePanel({
  content,
  embedded,
  wide,
}: {
  content: GuidanceContent;
  embedded?: boolean;
  /** Use horizontal multi-column layout on large screens (full-width tiles). */
  wide?: boolean;
}) {
  return (
    <div
      className={
        embedded
          ? "text-sm"
          : "flex gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm lg:px-6 lg:py-4"
      }
      role="region"
      aria-label="Hướng dẫn chơi"
    >
      {!embedded ? (
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
      ) : null}
      <div className="min-w-0 flex-1">
        {!embedded ? (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              Hướng dẫn
            </p>
            <p className="mt-0.5 font-semibold text-foreground">{content.title}</p>
          </>
        ) : null}
        <ul
          className={
            embedded
              ? "list-disc space-y-1.5 pl-4 text-muted-foreground"
              : wide
                ? "mt-2 list-disc space-y-1.5 pl-4 text-muted-foreground lg:columns-2 lg:gap-x-10 xl:columns-3"
                : "mt-2 list-disc space-y-1.5 pl-4 text-muted-foreground"
          }
        >
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
