import type { ParticipantView } from "@/lib/session-service";
import { ParticipantRow } from "./participant-row";

export function LobbyRoster({ participants }: { participants: ParticipantView[] }) {
  if (participants.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Chưa có người chơi. Chia sẻ mã phòng để mời bạn bè vào nhé.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {participants.map((p) => (
        <ParticipantRow key={p.id} p={p} />
      ))}
    </ul>
  );
}
