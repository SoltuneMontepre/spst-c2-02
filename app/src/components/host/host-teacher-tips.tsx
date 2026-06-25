import { Card } from "@/components/ui/card";

export function HostTeacherTips() {
  return (
    <Card className="border-dashed bg-muted/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Gợi ý cho giáo viên
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Chiếu mã QR hoặc màn hình này lên máy chiếu. Hướng dẫn học sinh vào phòng,
        bấm sẵn sàng, rồi bạn bấm <strong className="font-semibold text-foreground">Bắt đầu phiên chợ</strong> khi
        danh sách kiểm tra đủ điều kiện.
      </p>
    </Card>
  );
}
