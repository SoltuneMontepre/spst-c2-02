// Locked Vietnamese microcopy (UID §0.5, §3.4).

export const PHASE_LABELS: Record<string, string> = {
  EVENT: "Biến cố",
  DECISION: "Ra quyết định",
  MARKET_OPEN: "Chợ đã mở",
  SETTLEMENT: "Đang chốt sổ",
  RECAP: "Tổng kết vòng",
};

export const PHASE_BANNERS: Record<string, string> = {
  EVENT: "Công bố biến cố của vòng",
  DECISION: "Đã tới lúc ra quyết định",
  MARKET_OPEN: "Chợ đã mở",
  SETTLEMENT: "Đang chốt sổ",
  RECAP: "Vòng đã kết thúc",
};

/** Round-specific event copy (SRS §12.3 round:event_announced). */
export const EVENT_COPY: Record<number, { title: string; body: string }> = {
  1: {
    title: "Thị trường cơ sở",
    body: "Giá trị xã hội 10 nghìn Đồng/thùng — mốc so sánh cho cung-cầu.",
  },
  2: {
    title: "Được mùa",
    body: "Năng lực sản xuất tăng 50% nhưng hao phí trên mỗi đơn vị không đổi — dư cung có thể làm giá giảm.",
  },
  3: {
    title: "Thanh long viral",
    body: "Tổng cầu tăng 50% — cầu lớn hơn cung có thể đẩy giá lên.",
  },
  4: {
    title: "Công nghệ phổ biến",
    body: "TGLĐXHCT giảm còn 1; giá trị xã hội từ 10 xuống 6 nghìn Đồng/thùng.",
  },
};

export const ROUND_NAMES: Record<number, string> = {
  1: "Thị trường cơ sở",
  2: "Được mùa",
  3: "Thanh long viral",
  4: "Công nghệ phổ biến",
};

export const BADGE_LABELS: Record<string, string> = {
  EFFICIENT_PRODUCER: "Nhà sản xuất hiệu quả",
  WISE_CONSUMER: "Người tiêu dùng thông thái",
  MARKET_CONNECTOR: "Cầu nối thị trường",
  BALANCED_REGULATOR: "Nhà điều tiết cân bằng",
};

export function scoreLabel(role: string): string {
  switch (role) {
    case "PRODUCER":
      return "Lợi nhuận";
    case "CONSUMER":
      return "Hiệu ích";
    case "INTERMEDIARY":
      return "Lợi nhuận";
    case "GOVERNMENT":
      return "Điểm xã hội";
    default:
      return "Điểm";
  }
}

export const STATUS_LABELS: Record<string, string> = {
  CREATED: "Mới tạo",
  LOBBY: "Phòng chờ",
  INTRO: "Giới thiệu",
  ROUND_1: "Vòng 1",
  ROUND_2: "Vòng 2",
  ROUND_3: "Vòng 3",
  ROUND_4: "Vòng 4",
  DEBRIEF: "Tổng kết phiên",
  COMPLETED: "Đã hoàn tất",
  INCOMPLETE: "Chưa hoàn tất",
  CANCELLED: "Đã hủy",
};
