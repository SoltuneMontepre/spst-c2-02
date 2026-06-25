import type { CreateSessionInput } from "@/lib/create-session-schema";
import { Card } from "@/components/ui/card";
import { ROUND_NAMES } from "@/lib/labels";

export function formatConfigSummary(config: CreateSessionInput) {
  const events = Array.from({ length: config.totalRounds }, (_, i) => ROUND_NAMES[i + 1]).filter(
    Boolean,
  );
  return {
    rounds: `${config.totalRounds} vòng`,
    players: `${config.maxPlayers} người`,
    roles: config.autoAssignRoles ? "Tự động" : "Thủ công",
    guidance: config.guidanceEnabled ? "Bật" : "Tắt",
    roundDuration: "8 phút",
    events: events.join(", "),
  };
}

export function CreateRoomSummary({ config }: { config: CreateSessionInput }) {
  const s = formatConfigSummary(config);
  const rows = [
    ["Số vòng chơi", s.rounds],
    ["Số người tối đa", s.players],
    ["Phân vai", s.roles],
    ["Panel lý thuyết", s.guidance],
    ["Thời gian mỗi vòng", s.roundDuration],
    ["Biến cố ngẫu nhiên", s.events],
  ] as const;

  return (
    <Card className="p-5">
      <h3 className="text-base font-semibold tracking-tight">Tóm tắt cấu hình</h3>
      <dl className="mt-4 space-y-0">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-0"
          >
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-right text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export function CreateRoomSummaryCompact({ config }: { config: CreateSessionInput }) {
  const s = formatConfigSummary(config);
  const rows = [
    ["Số vòng", s.rounds],
    ["Số người", `Tối đa ${config.maxPlayers}`],
    ["Phân vai", s.roles],
    ["Lý thuyết", s.guidance],
  ] as const;

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold tracking-tight">Cấu hình đã chọn</h3>
      <dl className="mt-3.5 space-y-0">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between border-b border-border py-2 last:border-0"
          >
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
