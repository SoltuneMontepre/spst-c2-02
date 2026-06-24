"use client";

/** UI-SUPPLY-DEMAND-01 — supply/demand meter (LT-11). */
export function SupplyDemandMeter({
  supply,
  demand,
  theoryTrend,
  embedded,
}: {
  supply: number;
  demand: number;
  theoryTrend?: "down" | "up" | "neutral";
  embedded?: boolean;
}) {
  const relation = supply > demand ? ">" : supply < demand ? "<" : "=";
  const relationLabel =
    relation === ">"
      ? "Cung lớn hơn cầu — xu hướng lý thuyết: giá có thể giảm"
      : relation === "<"
        ? "Cung nhỏ hơn cầu — xu hướng lý thuyết: giá có thể tăng"
        : "Cung cân bằng cầu — giá có thể xấp xỉ giá trị";

  return (
    <div className={embedded ? "text-sm" : "rounded-xl border bg-card p-4 text-sm"}>
      {!embedded ? <p className="mb-2 font-semibold">Cung – Cầu</p> : null}
      <div className="flex items-center justify-center gap-3 font-mono text-lg">
        <span>Cung {supply}</span>
        <span className="text-2xl font-bold text-primary">{relation}</span>
        <span>Cầu {demand}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{relationLabel}</p>
      {theoryTrend ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Kịch bản vòng:{" "}
          {theoryTrend === "down"
            ? "dư cung"
            : theoryTrend === "up"
              ? "thiếu cung"
              : "cơ sở"}
        </p>
      ) : null}
    </div>
  );
}
