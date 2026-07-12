import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABELS } from "@/lib/display-labels";
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
  "Giá trị chuẩn (10 nghìn Đồng/thùng ở vòng 1–3) là mốc so sánh của thị trường; giá cả là mức giao dịch thực tế — cung-cầu kéo giá lên/xuống quanh mốc này.";

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
          ? "Nhà cung cấp: chọn sản lượng, có thể đầu tư nâng cấp (áp dụng vòng sau)."
          : role === "GOVERNMENT"
            ? "Cơ quan quản lý (từ vòng 2): chọn một chính sách can thiệp hoặc không can thiệp."
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
            ? "Niêm yết giá bán, nhận đề nghị mua, hoặc mua buôn từ nhà cung cấp."
            : "Theo dõi giao dịch tại Tháp quan sát.",
        "Tiền trong ví là phương tiện lưu thông; mỗi giao dịch chuyển quyền sở hữu hàng và tiền.",
        ready,
      ];
    case "RECAP":
      return [
        "Xem tổng kết vòng: giá thị trường so với giá trị chuẩn.",
        "Mở Tháp quan sát để xem biểu đồ giá và giá trị chuẩn qua các vòng.",
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
      return "Cơ quan quản lý";
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
          `Bốn vai: ${ROLE_LABELS.PRODUCER}, ${ROLE_LABELS.CONSUMER}, ${ROLE_LABELS.INTERMEDIARY} (từ 5 người), ${ROLE_LABELS.GOVERNMENT} (từ 6 người). Bot lấp chỗ trống.`,
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
            "Tháp quan sát mở cho mọi người — xem giá trị chuẩn và giá cả.",
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
            "Chọn số thùng sản xuất (tối đa theo sức sản xuất còn lại và ví hiện có).",
            "Đầu tư nâng cấp: Thủ công → Cơ bản → Hiện đại — chi phí trừ ví, hiệu lực vòng sau.",
            "15 giây đầu DECISION có thể bị khóa nếu cơ quan quản lý ban hành chính sách.",
            "Giá trị chuẩn mỗi thùng là mốc so sánh giá; trong bài học, mốc này tương ứng với TGLĐXHCT.",
          ],
        };
      }
      if (ctx.phase === "MARKET_OPEN") {
        return {
          title: "Nông trại · Chợ mở",
          tips: [
            "Niêm yết giá bán lẻ hoặc chấp nhận đề nghị mua từ khách hàng/đại lý.",
            "Bán buôn cho đại lý: đăng giá buôn hoặc chấp nhận đề nghị mua buôn.",
            "Giá bán cao hơn giá trị chuẩn → lợi nhuận lớn nhưng có thể ế hàng nếu cung > cầu.",
            "Có thể đóng quầy để gỡ niêm yết khi không muốn bán thêm.",
          ],
        };
      }
      return {
        title: "Nông trại",
        tips: [
          "Chờ giai đoạn DECISION để sản xuất, MARKET_OPEN để bán.",
          ctx.round === 4
            ? "Vòng 4: giá trị chuẩn giảm còn 6 nghìn Đồng/thùng do công nghệ phổ biến."
            : "Vòng 1–3: giá trị chuẩn 10 nghìn Đồng/thùng.",
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
          "Khách hàng chỉ mua ở giai đoạn MARKET_OPEN.",
          "Xem danh sách quầy khi chợ mở; so sánh giá các người bán.",
          VALUE_VS_PRICE,
        ],
      };

    case "intermediary":
      if (ctx.phase === "MARKET_OPEN") {
        return {
          title: "Đại lý · Buôn bán",
          tips: [
            "Mua buôn từ nhà cung cấp (giá thường thấp hơn bán lẻ).",
            "Niêm yết bán lẻ với biên lợi nhuận — kết nối cung và cầu giúp bạn giành huy hiệu Cầu nối thị trường.",
            "Hàng không bán hết được giữ sang vòng sau — vẫn có thể bán tiếp.",
          ],
        };
      }
      return {
        title: "Trung tâm phân phối",
        tips: [
          "Đại lý kiếm lời từ chênh lệch mua buôn – bán lẻ.",
          "Chờ MARKET_OPEN để giao dịch.",
        ],
      };

    case "government":
      if (ctx.phase === "DECISION" && ctx.round >= 2) {
        return {
          title: "Quản lý · Chính sách",
          tips: [
            "Mỗi vòng chọn tối đa một chính sách (hoặc Không can thiệp).",
            "Công bố thông tin: lộ tổng cầu — giúp thị trường minh bạch.",
            "Kho lạnh: bảo quản hàng, giảm hỏng (chọn lô hàng khi áp dụng).",
            "Hỗ trợ công nghệ (vòng 2–3): giảm chi phí nâng cấp cho một nhà cung cấp.",
          ],
        };
      }
      if (ctx.phase === "MARKET_OPEN" && ctx.round >= 2) {
        return {
          title: "Quản lý · Xuất khẩu",
          tips: [
            "15 giây đầu MARKET_OPEN: có thể xuất khẩu hàng tồn với giá ≤ giá trị chuẩn.",
            "Xuất khẩu tiêu ngân sách quản lý; dùng khi thị trường nội địa bão hòa.",
          ],
        };
      }
      return {
        title: "Bảng chính sách",
        tips: [
          "Cơ quan quản lý can thiệp từ vòng 2; vòng 1 chủ yếu quan sát cung-cầu.",
          "Điểm xã hội phản ánh cân bằng thị trường và hiệu quả chính sách.",
        ],
      };

    case "observatory":
      return {
        title: "Tháp quan sát",
        tips: [
          "Đường hồng: giá trị chuẩn; đường xanh: giá giao dịch trung bình.",
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
          "Xem lại biểu đồ: giá cả dao động quanh giá trị chuẩn theo cung-cầu.",
          "Huy hiệu ghi nhận hành vi tốt: cung ứng hiệu quả, mua hàng thông thái, cầu nối thị trường…",
          VALUE_VS_PRICE,
        ],
      };
  }
}
