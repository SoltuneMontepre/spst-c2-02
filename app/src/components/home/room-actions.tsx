"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateRoom, useJoinRoom } from "@/hooks/use-session-room";
import { ApiClientError } from "@/hooks/use-api";

const JOIN_ERRORS: Record<string, string> = {
  ROOM_NOT_FOUND: "Không tìm thấy phòng với mã này.",
  LATE_JOIN_FORBIDDEN: "Phiên đã bắt đầu, không thể vào thêm.",
  SESSION_FULL: "Phòng đã đủ 10 người.",
  HOST_CANNOT_JOIN: "Bạn đang là host của phòng này.",
};

export function RoomActions() {
  const create = useCreateRoom();
  const join = useJoinRoom();
  const [code, setCode] = useState("");

  const joinError =
    join.error instanceof ApiClientError
      ? (JOIN_ERRORS[join.error.code] ?? "Không thể tham gia phòng.")
      : null;

  return (
    <div className="flex flex-col gap-5">
      <Button size="lg" disabled={create.isPending} onClick={() => create.mutate()}>
        {create.isPending ? "Đang tạo phòng…" : "Tạo phòng (Host)"}
      </Button>
      {create.error instanceof ApiClientError &&
      create.error.code === "HOST_SESSION_LIMIT" ? (
        <p className="text-sm text-danger">
          Bạn đã mở tối đa 2 phòng host. Hãy hủy hoặc kết thúc một phòng trước.
        </p>
      ) : null}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> hoặc tham gia bằng mã{" "}
        <span className="h-px flex-1 bg-border" />
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim().length === 6) join.mutate(code.trim().toUpperCase());
        }}
      >
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Mã phòng"
          maxLength={6}
          className="uppercase tracking-widest sm:flex-1"
        />
        <Button type="submit" variant="secondary" disabled={join.isPending}>
          Tham gia
        </Button>
      </form>
      {joinError ? <p className="text-sm text-danger">{joinError}</p> : null}
    </div>
  );
}
