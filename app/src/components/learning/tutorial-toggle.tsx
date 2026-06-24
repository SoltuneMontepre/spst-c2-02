"use client";

import { BookOpen, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTutorial } from "./tutorial-provider";

export function TutorialToggle({ className }: { className?: string }) {
  const { enabled, toggle } = useTutorial();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggle}
      className={className}
      aria-pressed={enabled}
      aria-label={enabled ? "Tắt hướng dẫn" : "Bật hướng dẫn"}
    >
      {enabled ? (
        <BookOpenCheck className="size-4 text-accent" aria-hidden />
      ) : (
        <BookOpen className="size-4" aria-hidden />
      )}
      Hướng dẫn: {enabled ? "Bật" : "Tắt"}
    </Button>
  );
}
