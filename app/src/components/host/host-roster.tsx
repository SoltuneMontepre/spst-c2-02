"use client";

import type { Role } from "@/generated/prisma/enums";
import type { ParticipantView } from "@/lib/session-service";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { ProjectorParticipantRow } from "@/components/lobby/participant-row";

const ROLE_ORDER: (Role | "UNASSIGNED")[] = [
  "PRODUCER",
  "CONSUMER",
  "INTERMEDIARY",
  "GOVERNMENT",
  "UNASSIGNED",
];

function groupParticipants(participants: ParticipantView[]) {
  const groups = new Map<Role | "UNASSIGNED", ParticipantView[]>();
  for (const key of ROLE_ORDER) groups.set(key, []);

  for (const p of participants) {
    const key = p.role ?? "UNASSIGNED";
    const bucket = groups.get(key) ?? groups.get("UNASSIGNED")!;
    bucket.push(p);
  }

  return ROLE_ORDER.map((key) => ({
    key,
    label: key === "UNASSIGNED" ? "Chưa phân vai" : ROLE_LABELS[key],
    participants: groups.get(key) ?? [],
  })).filter((g) => g.participants.length > 0);
}

/** Projector-side player list — grouped by role, scrolls inside bento tile. */
export function HostRoster({
  participants,
  inGame = true,
}: {
  participants: ParticipantView[];
  inGame?: boolean;
}) {
  const humans = participants.filter((p) => !p.isBot);
  const online = participants.filter(
    (p) => p.isBot || p.presence === "ONLINE",
  ).length;
  const groups = groupParticipants(participants);

  if (participants.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Chưa có người chơi trong phòng.
      </p>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <dl className="grid shrink-0 grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-muted/30 px-2 py-2">
          <dt className="text-muted-foreground">Tổng</dt>
          <dd className="font-mono text-base font-semibold tabular-nums">
            {participants.length}
          </dd>
        </div>
        <div className="rounded-lg bg-muted/30 px-2 py-2">
          <dt className="text-muted-foreground">Người</dt>
          <dd className="font-mono text-base font-semibold tabular-nums">
            {humans.length}
          </dd>
        </div>
        <div className="rounded-lg bg-muted/30 px-2 py-2">
          <dt className="text-muted-foreground">Trực tuyến</dt>
          <dd className="font-mono text-base font-semibold tabular-nums text-success">
            {online}
          </dd>
        </div>
      </dl>

      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <section key={group.key}>
              <h3 className="mb-1.5 truncate text-xs font-medium text-muted-foreground">
                {group.label} · {group.participants.length}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {group.participants.map((p) => (
                  <ProjectorParticipantRow key={p.id} p={p} inGame={inGame} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
