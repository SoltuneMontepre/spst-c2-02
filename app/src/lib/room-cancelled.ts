/** Redirect target + copy when a LOBBY session is cancelled. */

export const ROOM_CANCELLED_PARAM = "room_cancelled";

export type RoomCancelledReason = "solo_timeout" | "host_cancelled";

export function roomCancelledHomeHref(reason?: RoomCancelledReason): string {
  const params = new URLSearchParams({ [ROOM_CANCELLED_PARAM]: "1" });
  if (reason) params.set("reason", reason);
  return `/home?${params.toString()}`;
}

export function roomCancelledMessage(reason?: string | null): string {
  switch (reason) {
    case "solo_timeout":
      return "Phòng đã tự hủy vì không có người tham gia trong thời gian chờ.";
    case "host_cancelled":
      return "Phòng đã được host hủy.";
    default:
      return "Phòng đã bị hủy.";
  }
}
