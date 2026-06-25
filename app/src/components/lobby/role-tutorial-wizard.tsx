"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { Button } from "@/components/ui/button";
import { RoleTutorialProgress } from "@/components/lobby/role-tutorial-callouts";
import {
  getRoleTutorialContent,
  markRoleTutorialSkipped,
} from "@/lib/role-tutorial";

export function RoleTutorialWizard({
  role,
  onClose,
}: {
  role: Role;
  onClose: () => void;
}) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const content = getRoleTutorialContent(role);
  const current = content.steps[step];
  const StepIcon = current.icon;
  const isLast = step === 2;

  const finish = () => {
    markRoleTutorialSkipped(role);
    onClose();
  };

  return (
    <div className="flex w-full flex-col">
      <RoleTutorialProgress step={step} />

      <div className="mt-7 flex flex-col">
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-sm">
            <StepIcon className="size-8 text-primary" aria-hidden />
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Bước {step + 1}/3
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight">{current.title}</h2>
            <p className="mt-3.5 text-sm leading-relaxed text-muted-foreground">
              {current.body}
            </p>
          </div>

          <div className="mt-3.5 flex gap-2.5">
            {isLast ? (
              <Button
                type="button"
                size="lg"
                className="min-w-0 flex-1 rounded-xl"
                onClick={finish}
              >
                Vào chợ
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                className="min-w-0 flex-1 rounded-xl"
                onClick={() => setStep((s) => (s + 1) as 0 | 1 | 2)}
              >
                Tiếp theo
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="shrink-0 rounded-xl px-5"
              onClick={finish}
            >
              Bỏ qua
            </Button>
          </div>
        </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {ROLE_LABELS[role]} · 3 bước
      </p>
    </div>
  );
}
