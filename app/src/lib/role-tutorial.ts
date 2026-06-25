import {
  Sprout,
  ShoppingCart,
  Link2,
  Landmark,
  BarChart3,
  Zap,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { GAME_ZONES } from "@/lib/game-zones";

export interface RoleTutorialStep {
  title: string;
  body: string;
  icon: LucideIcon;
}

export interface RoleTutorialAction {
  icon: LucideIcon;
  label: string;
  iconClassName: string;
}

export interface RoleTutorialContent {
  zoneSubtitle: string;
  roleBlurb: string;
  theoryCallout: string;
  goalCallout: (totalRounds: number) => string;
  actions: RoleTutorialAction[];
  steps: [RoleTutorialStep, RoleTutorialStep, RoleTutorialStep];
}

const THEORY =
  "Giá trị hàng hóa = lượng lao động xã hội cần thiết. Năng suất cao hơn bình quân → lợi nhuận thặng dư.";

function zoneIcon(role: Role): LucideIcon {
  return GAME_ZONES.find((z) => z.role === role)?.icon ?? Sprout;
}

const PRODUCER: RoleTutorialContent = {
  zoneSubtitle: "Nông trại / Xưởng sản xuất",
  roleBlurb:
    "Sản xuất và bán thanh long. Tối ưu số lượng và chọn kênh bán phù hợp.",
  theoryCallout: THEORY,
  goalCallout: (n) =>
    `Tối đa hóa lợi nhuận trong ${n} vòng bằng cách điều chỉnh sản lượng và chiến lược theo biến cố thị trường.`,
  actions: [
    { icon: Sprout, label: "Sản xuất thùng thanh long", iconClassName: "bg-success/15 text-success" },
    { icon: Store, label: "Đưa ra chợ bán lẻ", iconClassName: "bg-blue-500/10 text-blue-600" },
    { icon: Truck, label: "Bán sỉ cho trung gian", iconClassName: "bg-violet-500/10 text-violet-600" },
    { icon: Zap, label: "Nâng cấp công nghệ", iconClassName: "bg-amber-500/10 text-amber-600" },
  ],
  steps: [
    {
      icon: Sprout,
      title: "Vai trò của bạn",
      body: "Bạn là Người sản xuất – chủ nông trại thanh long. Bạn sở hữu nguồn cung và quyết định chiến lược sản xuất, định giá cho từng vòng chơi.",
    },
    {
      icon: BarChart3,
      title: "Giá trị hàng hóa",
      body: "Giá trị một thùng thanh long phụ thuộc vào thời gian lao động xã hội cần thiết (TGLĐXHCT) = 85k Đ — không phải thời gian cá biệt của bạn.",
    },
    {
      icon: Zap,
      title: "Hành động trong chợ",
      body: "Mỗi vòng bạn có thể: Sản xuất thêm, bán sỉ cho trung gian, bán lẻ trực tiếp, hoặc đầu tư công nghệ để giảm chi phí cá biệt.",
    },
  ],
};

const CONSUMER: RoleTutorialContent = {
  zoneSubtitle: "Quầy chợ / Tiêu dùng",
  roleBlurb:
    "Mua thanh long để đáp ứng nhu cầu vòng. So sánh giá và chọn kênh mua phù hợp.",
  theoryCallout: THEORY,
  goalCallout: (n) =>
    `Đáp ứng nhu cầu tiêu dùng trong ${n} vòng với chi phí hợp lý — giá cả dao động quanh giá trị xã hội.`,
  actions: [
    { icon: ShoppingCart, label: "Mua theo giá niêm yết", iconClassName: "bg-blue-500/10 text-blue-600" },
    { icon: Store, label: "Gửi đề nghị giá thấp hơn", iconClassName: "bg-success/15 text-success" },
    { icon: BarChart3, label: "Theo dõi nhu cầu từng vòng", iconClassName: "bg-amber-500/10 text-amber-600" },
  ],
  steps: [
    {
      icon: ShoppingCart,
      title: "Vai trò của bạn",
      body: "Bạn là Người tiêu dùng — đại diện cầu trên thị trường. Mỗi vòng bạn cần đủ số thùng thanh long theo nhu cầu để nhận hiệu ích (điểm).",
    },
    {
      icon: BarChart3,
      title: "Giá trị và giá cả",
      body: "Giá trị xã hội phản ánh lao động cần thiết; giá giao dịch thực tế có thể cao hơn hoặc thấp hơn tùy cung-cầu. Đừng nhầm giá mua với giá trị hàng hóa.",
    },
    {
      icon: Store,
      title: "Hành động trong chợ",
      body: "Khi chợ mở: mua ngay theo giá niêm yết hoặc gửi đề nghị giá thấp hơn. Tiền trợ cấp mỗi vòng giúp bạn tham gia thị trường.",
    },
  ],
};

const INTERMEDIARY: RoleTutorialContent = {
  zoneSubtitle: "Trung tâm phân phối",
  roleBlurb:
    "Mua buôn từ nhà sản xuất, bán lẻ với biên lợi nhuận. Kết nối cung và cầu.",
  theoryCallout: THEORY,
  goalCallout: (n) =>
    `Kiếm lợi nhuận từ chênh lệch mua buôn – bán lẻ trong ${n} vòng, quản lý tồn kho để tránh hàng hỏng.`,
  actions: [
    { icon: Truck, label: "Mua buôn từ nhà sản xuất", iconClassName: "bg-violet-500/10 text-violet-600" },
    { icon: Store, label: "Niêm yết bán lẻ", iconClassName: "bg-blue-500/10 text-blue-600" },
    { icon: BarChart3, label: "Quản lý tồn kho", iconClassName: "bg-amber-500/10 text-amber-600" },
  ],
  steps: [
    {
      icon: Link2,
      title: "Vai trò của bạn",
      body: "Bạn là Trung gian — cầu nối giữa sản xuất và tiêu dùng. Mua buôn giá thấp, bán lẻ với biên lợi nhuận hợp lý.",
    },
    {
      icon: BarChart3,
      title: "Giá trị và biên lợi nhuận",
      body: "Lợi nhuận đến từ chênh lệch giữa giá mua buôn và giá bán lẻ. Giá cả vẫn dao động quanh giá trị xã hội — đừng chỉ đuổi giá mà bỏ qua rủi ro tồn kho.",
    },
    {
      icon: Truck,
      title: "Hành động trong chợ",
      body: "Khi chợ mở: đề nghị mua buôn từ nhà sản xuất, niêm yết bán lẻ, chấp nhận đề nghị từ người tiêu dùng. Hàng không bán hết có thể hỏng cuối vòng.",
    },
  ],
};

const GOVERNMENT: RoleTutorialContent = {
  zoneSubtitle: "Bảng chính sách / Nhà nước",
  roleBlurb:
    "Can thiệp thị trường bằng chính sách từ vòng 2. Cân bằng lợi ích xã hội và ngân sách.",
  theoryCallout: THEORY,
  goalCallout: (n) =>
    `Đạt điểm xã hội cao trong ${n} vòng bằng chính sách phù hợp — minh bạch thông tin, hỗ trợ công nghệ, hoặc xuất khẩu khi cần.`,
  actions: [
    { icon: Landmark, label: "Ban hành chính sách (vòng 2+)", iconClassName: "bg-blue-500/10 text-blue-600" },
    { icon: BarChart3, label: "Công bố thông tin thị trường", iconClassName: "bg-success/15 text-success" },
    { icon: Truck, label: "Xuất khẩu khi thị trường bão hòa", iconClassName: "bg-amber-500/10 text-amber-600" },
  ],
  steps: [
    {
      icon: Landmark,
      title: "Vai trò của bạn",
      body: "Bạn đại diện Nhà nước — can thiệp thị trường bằng chính sách (từ vòng 2). Vòng 1 chủ yếu quan sát cung-cầu và chuẩn bị.",
    },
    {
      icon: BarChart3,
      title: "Giá trị và vai trò nhà nước",
      body: "Nhà nước không tạo giá trị hàng hóa trực tiếp nhưng ảnh hưởng điều kiện giao dịch: thông tin, hỗ trợ công nghệ, xuất khẩu. Mục tiêu là thị trường minh bạch và ổn định hơn.",
    },
    {
      icon: Landmark,
      title: "Hành động trong chợ",
      body: "Mỗi vòng (từ vòng 2): chọn một chính sách hoặc không can thiệp. Giai đoạn MARKET_OPEN có thể xuất khẩu hàng tồn với giá ≤ giá trị xã hội.",
    },
  ],
};

const CONTENT: Record<Role, RoleTutorialContent> = {
  PRODUCER,
  CONSUMER,
  INTERMEDIARY,
  GOVERNMENT,
};

export function getRoleTutorialContent(role: Role): RoleTutorialContent {
  return CONTENT[role];
}

export function roleTutorialIcon(role: Role): LucideIcon {
  return zoneIcon(role);
}

const SKIP_PREFIX = "pcg-role-tutorial-skipped:";

export function isRoleTutorialSkipped(role: Role): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${SKIP_PREFIX}${role}`) === "1";
}

export function markRoleTutorialSkipped(role: Role): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${SKIP_PREFIX}${role}`, "1");
}
