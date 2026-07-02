"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** UI-COMMODITY-01 — commodity card (LT-01, LT-02). */
export function CommodityCard({ listedUnits = 0 }: { listedUnits?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Thùng thanh long</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <div className="rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950/40">
          <p className="font-medium text-emerald-800 dark:text-emerald-200">Giá trị sử dụng</p>
          <p className="text-muted-foreground">Thực phẩm — thỏa mãn nhu cầu tiêu dùng.</p>
        </div>
        <div className="rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-950/40">
          <p className="font-medium text-amber-900 dark:text-amber-200">Giá trị chuẩn</p>
          <p className="text-muted-foreground">
            Mốc so sánh giá; trong bài học tương ứng với TGLĐXHCT.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Trạng thái:{" "}
          {listedUnits > 0
            ? `Đã đưa ${listedUnits} thùng ra trao đổi`
            : "Chưa đưa ra thị trường"}
        </p>
      </CardContent>
    </Card>
  );
}
