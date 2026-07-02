"use client";

import { useEffect, useState } from "react";
import { formatThousandDong } from "@/lib/money";

/** UI-OBSERVATORY-03 — round 4 value animation (LT-05). */
export function ValueShiftAnimation({ active }: { active: boolean }) {
  const [labor, setLabor] = useState(2);
  const [value, setValue] = useState(10000);

  useEffect(() => {
    if (!active) return;
    const t1 = setTimeout(() => {
      setLabor(1);
      setValue(6000);
    }, 800);
    return () => clearTimeout(t1);
  }, [active]);

  if (!active) return null;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm transition-all duration-700">
      <p className="font-semibold">Công nghệ phổ biến</p>
      <p className="mt-2 text-muted-foreground">
        Giá trị chuẩn:{" "}
        <span className="font-mono font-bold text-foreground transition-all duration-700">
          {labor}
        </span>{" "}
        giờ chuẩn/thùng
      </p>
      <p className="text-muted-foreground">
        Mốc giá tham chiếu:{" "}
        <span className="font-mono font-bold text-foreground transition-all duration-700">
          {formatThousandDong(value)}
        </span>
        /thùng
      </p>
      <p className="mt-2 text-xs">
        Năng suất chung tăng làm giá trị chuẩn giảm — không phải do cung-cầu tạo ra giá trị.
      </p>
    </div>
  );
}
