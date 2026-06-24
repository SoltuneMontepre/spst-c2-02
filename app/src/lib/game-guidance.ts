import type { Role } from "@/generated/prisma/enums";
import { PHASE_DURATIONS_SEC } from "./scenario";

export interface GuidanceContent {
  title: string;
  tips: string[];
}

export type GuidanceContext =
  | { screen: "lobby"; autoHost: boolean }
  | {
      screen: "map";
      status: string;
      phase: string | null;
      role: Role | null;
      autoHost: boolean;
    }
  | { screen: "producer"; phase: string | null; round: number }
  | { screen: "consumer"; phase: string | null }
  | { screen: "intermediary"; phase: string | null }
  | { screen: "government"; phase: string | null; round: number }
  | { screen: "observatory"; round: number }
  | { screen: "debrief" };

const PHASE_FLOW = `Mỗi vòng gồm: Biến cố (${PHASE_DURATIONS_SEC.EVENT}s) → Ra quyết định (${PHASE_DURATIONS_SEC.DECISION}s) → Chợ mở (${PHASE_DURATIONS_SEC.MARKET_OPEN}s) → Chốt sổ → Tổng kết.`;

const VALUE_VS_PRICE =
  "Giá trị xã hội (10 nghìn Đồng/thùng ở vòng 1–3) đo lao động xã hội cần thiết; giá cả là mức giao dịch thực tế — cung-cầu kéo giá lên/xuống quanh giá trị, không tạo ra giá trị mới.";

function phaseMapTips(
  phase: string | null,
  role: Role | null,
  autoHost: boolean,
): string[] {
  const ready = autoHost
    ? "Xong việc trong giai đoạn? Bấm «Sẵn sàng — chuyển giai đoạn» để nhóm chuyển tiếp sớm (khi mọi người đều sẵn sàng)."
    : "Host điều phối timer; hãy hoàn thành hành động trước khi hết giờ.";

  switch (phase) {
    case "EVENT":
      return [
        "Đọc biến cố vòng — đây là «cú sốc» cung hoặc cầu, không phải lệnh mua bán.",
        VALUE_VS_PRICE,
        "Chưa cần vào khu — xem bản đồ và nhớ khu sáng là của bạn; chờ «Ra quyết định».",
        "Giai đoạn biến cố kéo dài khoảng 22 giây để đọc.",
      ];
    case "DECISION":
      return [
        role
          ? `Chạm khu «${roleZoneLabel(role)}» (đang sáng) để vào nhiệm vụ — bạn có ~60 giây.`
          : "Chọn khu phù hợp vai trò của bạn trên bản đồ.",
        role === "PRODUCER"
          ? "Nhà sản xuất: chọn sản lượng, có thể đầu tư nâng cấp (áp dụng vòng sau)."
          : role === "GOVERNMENT"
            ? "Nhà nước (từ vòng 2): chọn một chính sách can thiệp hoặc không can thiệp."
            : role === "CONSUMER" || role === "INTERMEDIARY"
              ? "Giai đoạn này chủ yếu chờ sản xuất và chính sách; chuẩn bị cho chợ mở."
              : "Quan sát viên: xem Tháp quan sát để theo dõi cung-cầu.",
        ready,
      ];
    case "MARKET_OPEN":
      return [
        role === "CONSUMER"
          ? "Vào Quầy chợ: mua thùng thanh long hoặc gửi đề nghị giá thấp hơn."
          : role === "PRODUCER" || role === "INTERMEDIARY"
            ? "Niêm yết giá bán, nhận đề nghị mua, hoặc mua buôn từ nhà sản xuất."
            : "Theo dõi giao dịch tại Tháp quan sát.",
        "Tiền trong ví là phương tiện lưu thông; mỗi giao dịch chuyển quyền sở hữu hàng và tiền.",
        ready,
      ];
    case "RECAP":
      return [
        "Xem tổng kết vòng: giá thị trường so với giá trị xã hội.",
        "Mở Tháp quan sát để xem biểu đồ giá–giá trị qua các vòng.",
        ready,
      ];
    case "SETTLEMENT":
      return ["Hệ thống đang chốt sổ: hàng hỏng, thanh toán, cập nhật điểm — chờ vài giây."];
    default:
      return [PHASE_FLOW, VALUE_VS_PRICE];
  }
}

function roleZoneLabel(role: Role): string {
  switch (role) {
    case "PRODUCER":
      return "Nông trại";
    case "CONSUMER":
      return "Quầy chợ";
    case "INTERMEDIARY":
      return "Trung tâm phân phối";
    case "GOVERNMENT":
      return "Nhà nước";
  }
}

export function getGuidance(ctx: GuidanceContext): GuidanceContent {
  switch (ctx.screen) {
    case "lobby":
      return {
        title: "Phòng chờ",
        tips: [
          "Chia sẻ mã QR hoặc mã phòng để bạn bè tham gia.",
          ctx.autoHost
            ? "Bấm «Tôi đã sẵn sàng» — khi đủ người và mọi người sẵn sàng, AI sẽ tự bắt đầu phiên."
            : "Host bấm «Bắt đầu phiên» khi đủ 4+ người và mọi người sẵn sàng.",
          "Bốn vai: Nhà sản xuất, Người tiêu dùng, Trung gian (từ 5 người), Nhà nước (từ 6 người). Bot lấp chỗ trống.",
          VALUE_VS_PRICE,
        ],
      };

    case "map":
      if (ctx.status === "INTRO") {
        return {
          title: "Giới thiệu phiên",
          tips: [
            "Dành thời gian xem bản đồ bên dưới — khu sáng là nơi bạn sẽ làm việc.",
            "Bạn sẽ chơi 4 vòng thanh long; mỗi vòng có biến cố thị trường khác nhau.",
            PHASE_FLOW,
            ctx.role
              ? `Vai của bạn: ${roleZoneLabel(ctx.role)} — chạm khu đó khi giai đoạn «Ra quyết định».`
              : "Bản đồ có 5 khu; khu sáng là nhiệm vụ của bạn khi vòng bắt đầu.",
            "Tháp quan sát mở cho mọi người — xem giá trị vs giá cả.",
            VALUE_VS_PRICE,
          ],
        };
      }
      return {
        title: ctx.phase ? `Bản đồ · ${ctx.phase}` : "Bản đồ phiên chợ",
        tips: [
          ...phaseMapTips(ctx.phase, ctx.role, ctx.autoHost),
          "Chạm khu trên bản đồ để vào nhiệm vụ; «Quay lại bản đồ» để trở về đây.",
        ],
      };

    case "producer":
      if (ctx.phase === "DECISION") {
        return {
          title: "Nông trại · Ra quyết định",
          tips: [
            "Chọn số thùng sản xuất (tối đa theo năng lực và điểm lao động còn lại).",
            "Đầu tư nâng cấp: Truyền thống → Trung bình → Tiên phong — chi phí trừ ví, hiệu lực vòng sau.",
            "15 giây đầu DECISION có thể bị khóa nếu Nhà nước ban hành chính sách.",
            "Giá trị mỗi thùng = TGLĐXHCT × 4 nghìn Đồng; hao phí đầu vào 2 nghìn Đồng/thùng.",
          ],
        };
      }
      if (ctx.phase === "MARKET_OPEN") {
        return {
          title: "Nông trại · Chợ mở",
          tips: [
            "Niêm yết giá bán lẻ hoặc chấp nhận đề nghị mua từ người tiêu dùng/trung gian.",
            "Bán buôn cho trung gian: đăng giá buôn hoặc chấp nhận đề nghị mua buôn.",
            "Giá bán cao hơn giá trị → lợi nhuận lớn nhưng có thể ế hàng nếu cung > cầu.",
            "Có thể đóng quầy để gỡ niêm yết khi không muốn bán thêm.",
          ],
        };
      }
      return {
        title: "Nông trại",
        tips: [
          "Chờ giai đoạn DECISION để sản xuất, MARKET_OPEN để bán.",
          ctx.round === 4
            ? "Vòng 4: giá trị xã hội giảm còn 6 nghìn Đồng/thùng do công nghệ phổ biến."
            : "Vòng 1–3: giá trị xã hội 10 nghìn Đồng/thùng.",
        ],
      };

    case "consumer":
      if (ctx.phase === "MARKET_OPEN") {
        return {
          title: "Quầy chợ · Mua hàng",
          tips: [
            "Mua ngay theo giá niêm yết hoặc gửi đề nghị giá thấp hơn — người bán có thể chấp nhận/từ chối.",
            "Mục tiêu: đủ số thùng nhu cầu vòng này để nhận hiệu ích (điểm).",
            "Tiền trợ cấp mỗi vòng giúp bạn tham gia chợ; chi tiêu khôn ngoan khi giá cao.",
            "Theo dõi «Nhu cầu: đã đủ/tổng» trên đầu màn hình.",
          ],
        };
      }
      return {
        title: "Quầy chợ",
        tips: [
          "Người tiêu dùng chỉ mua ở giai đoạn MARKET_OPEN.",
          "Xem danh sách quầy khi chợ mở; so sánh giá các người bán.",
          VALUE_VS_PRICE,
        ],
      };

    case "intermediary":
      if (ctx.phase === "MARKET_OPEN") {
        return {
          title: "Trung gian · Buôn bán",
          tips: [
            "Mua buôn từ nhà sản xuất (giá thường thấp hơn bán lẻ).",
            "Niêm yết bán lẻ với biên lợi nhuận — kết nối cung và cầu giúp bạn giành huy hiệu Cầu nối thị trường.",
            "Hàng không bán hết có thể hỏng cuối vòng — quản lý tồn kho cẩn thận.",
          ],
        };
      }
      return {
        title: "Trung tâm phân phối",
        tips: [
          "Trung gian kiếm lời từ chênh lệch mua buôn – bán lẻ.",
          "Chờ MARKET_OPEN để giao dịch.",
        ],
      };

    case "government":
      if (ctx.phase === "DECISION" && ctx.round >= 2) {
        return {
          title: "Nhà nước · Chính sách",
          tips: [
            "Mỗi vòng chọn tối đa một chính sách (hoặc Không can thiệp).",
            "Công bố thông tin: lộ tổng cầu — giúp thị trường minh bạch.",
            "Kho lạnh: bảo quản hàng, giảm hỏng (chọn lô hàng khi áp dụng).",
            "Hỗ trợ công nghệ (vòng 2–3): giảm chi phí nâng cấp cho một nhà sản xuất.",
          ],
        };
      }
      if (ctx.phase === "MARKET_OPEN" && ctx.round >= 2) {
        return {
          title: "Nhà nước · Xuất khẩu",
          tips: [
            "15 giây đầu MARKET_OPEN: có thể xuất khẩu hàng tồn với giá ≤ giá trị xã hội.",
            "Xuất khẩu tiêu ngân sách nhà nước; dùng khi thị trường nội địa bão hòa.",
          ],
        };
      }
      return {
        title: "Bảng chính sách",
        tips: [
          "Nhà nước can thiệp từ vòng 2; vòng 1 chủ yếu quan sát cung-cầu.",
          "Điểm xã hội phản ánh cân bằng thị trường và hiệu quả chính sách.",
        ],
      };

    case "observatory":
      return {
        title: "Tháp quan sát",
        tips: [
          "Đường hồng: giá trị xã hội (lao động); đường xanh: giá giao dịch trung bình.",
          "Giá > giá trị: cầu mạnh hoặc khan hiếm; Giá < giá trị: dư cung.",
          "Thanh cung-cầu: so sánh sản lượng với nhu cầu mục tiêu vòng.",
          ctx.round === 4 ? "Vòng 4: chú ý bước nhảy giá trị xuống 6 nghìn Đồng." : "",
        ].filter(Boolean),
      };

    case "debrief":
      return {
        title: "Tổng kết & học tập",
        tips: [
          "So sánh điểm vai trò của bạn với người khác — mỗi vai có tiêu chí riêng.",
          "Xem lại biểu đồ: giá cả dao động quanh giá trị theo cung-cầu.",
          "Huy hiệu ghi nhận hành vi tốt: hiệu quả sản xuất, tiêu dùng thông thái, cầu nối thị trường…",
          VALUE_VS_PRICE,
        ],
      };
  }
}
