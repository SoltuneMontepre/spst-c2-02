// Vietnamese user-facing error messages (SRS §7.5).

export const ERROR_MESSAGES: Record<string, string> = {
  INSUFFICIENT_BALANCE: "Số dư không đủ cho giao dịch này.",
  INSUFFICIENT_FUNDS: "Số dư không đủ cho giao dịch này.",
  INSUFFICIENT_INVENTORY: "Hàng đã được bán hoặc không còn đủ số lượng.",
  INSUFFICIENT_LISTING: "Hàng đã được bán hoặc không còn đủ số lượng.",
  OFFER_EXPIRED: "Lượt chợ đã đóng; đề nghị này không còn hiệu lực.",
  STALE_STATE: "Thị trường vừa thay đổi. Dữ liệu đang được cập nhật.",
  ROLE_FORBIDDEN: "Vai của bạn không có quyền thực hiện thao tác này.",
  WRONG_ROLE: "Vai của bạn không có quyền thực hiện thao tác này.",
  PHASE_FORBIDDEN: "Thao tác không khả dụng trong giai đoạn hiện tại.",
  WRONG_PHASE: "Thao tác không khả dụng trong giai đoạn hiện tại.",
  PRODUCER_INPUT_LOCKED: "Nhà nước đang chọn chính sách. Sản xuất mở sau 15 giây.",
  INVALID_MONEY_STEP: "Giá phải là bội số của 1 nghìn Đồng.",
  SESSION_FULL: "Phòng đã đủ 10 người chơi.",
  LATE_JOIN_FORBIDDEN: "Phiên đã bắt đầu; chỉ thành viên cũ có thể kết nối lại.",
  ROOM_EXPIRED: "Mã phòng đã hết hạn.",
  ROOM_NOT_FOUND: "Không tìm thấy phòng.",
  READ_ONLY_TAB: "Tab này chỉ xem. Tab khác đang điều khiển vai của bạn.",
  DUPLICATE_OFFER: "Bạn đã có một đề nghị đang mở cho quầy này.",
  POLICY_ROUND_FORBIDDEN: "Chính sách chỉ áp dụng từ vòng 2.",
  POLICY_ALREADY_USED: "Nhà nước đã dùng chính sách trong vòng này.",
  UPGRADE_NOT_AVAILABLE: "Nâng cấp không khả dụng cho hồ sơ hoặc vòng hiện tại.",
  UNDER_MIN_PLAYERS: "Cần ít nhất 4 người chơi để bắt đầu.",
  NOT_ALL_READY: "Mọi người chơi cần sẵn sàng trước khi bắt đầu.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  INVALID_STATE: "Thao tác không khả dụng trong trạng thái phiên hiện tại.",
  SESSION_LOCKED: "Phiên đã bắt đầu; thao tác này chỉ dùng trong phòng chờ.",
  NOT_ALL_ROLES_ASSIGNED: "Mọi người chơi cần được gán vai trước khi bắt đầu.",
  SOLO_EXTEND_USED: "Bạn đã gia hạn phòng một lần trong lần chờ này.",
  INTERNAL_ERROR: "Đã xảy ra lỗi máy chủ. Vui lòng thử lại.",
};

export function errorMessage(code: string, fallback?: string): string {
  return ERROR_MESSAGES[code] ?? fallback ?? code;
}
