import { Card, CardContent } from "@/components/ui/card";
import { Users, LineChart, Radio, Scale } from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "4–10 người chơi",
    body: "Host mở phòng, chia sẻ mã hoặc QR; bot lấp vai còn thiếu để phiên luôn đủ bốn chủ thể.",
  },
  {
    icon: Radio,
    title: "Thời gian thực",
    body: "Quyết định, niêm yết và giao dịch đồng bộ tức thì cho cả phòng qua bốn vòng.",
  },
  {
    icon: LineChart,
    title: "Giá trị vs giá thị trường",
    body: "Tháp quan sát vẽ đường giá trị và giá giao dịch thật — không bao giờ bịa giá.",
  },
  {
    icon: Scale,
    title: "Bám sát lý thuyết",
    body: "Mọi khái niệm truy vết tới slide Chương 2: TGLĐXHCT, cung–cầu, quy luật giá trị.",
  },
];

export function Features() {
  return (
    <section className="w-full px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardContent className="flex flex-col gap-3 p-5">
              <f.icon className="size-7 text-primary" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
