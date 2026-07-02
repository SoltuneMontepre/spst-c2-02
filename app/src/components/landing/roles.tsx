import { Sprout, ShoppingCart, Link2, Landmark, type LucideIcon } from "lucide-react";

const ROLES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Sprout, title: "Nhà cung cấp", body: "Sản xuất, định giá và bán hàng; quản lý chi phí riêng để thực hiện giá trị." },
  { icon: ShoppingCart, title: "Khách hàng", body: "Đáp ứng nhu cầu với ngân sách hợp lý bằng mua ngay hoặc trả giá." },
  { icon: Link2, title: "Đại lý phân phối", body: "Mua sỉ, chịu rủi ro lưu thông và niêm yết bán lẻ để kết nối hai phía." },
  { icon: Landmark, title: "Cơ quan quản lý thị trường", body: "Đọc dữ liệu tổng hợp và dùng chính sách hữu hạn để cải thiện kết quả chung." },
];

export function Roles() {
  return (
    <section className="bg-muted/50 py-16">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-2 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Bốn chủ thể thị trường</h2>
          <p className="text-muted-foreground">
            Mỗi vai có thông tin, quyền và mục tiêu riêng — không có bảng xếp hạng chung.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r) => (
            <div
              key={r.title}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5"
            >
              <r.icon className="size-7 text-primary" />
              <h3 className="font-semibold">{r.title}</h3>
              <p className="text-sm text-muted-foreground">{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
