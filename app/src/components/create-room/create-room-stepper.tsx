import { cn } from "@/lib/utils";

export function CreateRoomStepper({ step }: { step: 1 | 2 }) {
  const steps = [
    { n: 1, label: "Cấu hình phòng" },
    { n: 2, label: "Xem trước & Tạo" },
  ] as const;

  return (
    <div className="flex items-center gap-3.5">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-3.5">
          {i > 0 ? <div className="h-px w-14 bg-border" /> : null}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                step >= s.n
                  ? "bg-primary text-primary-foreground"
                  : "border-2 border-border text-muted-foreground",
              )}
            >
              {s.n}
            </span>
            <span
              className={cn(
                "text-sm font-semibold",
                step >= s.n ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
