"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionSnapshot } from "@/hooks/use-session-room";
import { useSessionCancelledRedirect } from "@/hooks/use-session-cancelled-redirect";
import { GameBentoShell } from "@/components/session/game-bento-shell";
import { MapZones } from "./map-zones";
import { RoundRecapCard } from "@/components/observatory/round-recap-card";
import { ROLE_LABELS } from "@/components/lobby/role-badge";
import { zoneLabelForRole } from "@/lib/game-zones";
import type { Role } from "@/generated/prisma/enums";

const ENDED = ["COMPLETED", "INCOMPLETE"];

function MapPhaseHint({
  status,
  phase,
  role,
}: {
  status: string;
  phase: string | null;
  role: Role | null;
}) {
  if (status === "INTRO") {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
        <p className="font-semibold">Làm quen bản đồ</p>
        <p className="mt-1 text-muted-foreground">
          Khu sáng là nơi bạn làm việc theo vai trò
          {role ? ` (${ROLE_LABELS[role]})` : ""}. Chọn khu ở cột trái khi đến lúc.
        </p>
      </div>
    );
  }

  if (phase === "EVENT") {
    return (
      <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
        <p className="font-semibold">Đang công bố biến cố</p>
        <p className="mt-1 text-muted-foreground">
          Đọc timer & hướng dẫn bên phải — chờ «Ra quyết định» rồi vào khu của bạn.
        </p>
      </div>
    );
  }

  if (phase === "DECISION" && role) {
    return (
      <div className="rounded-xl border border-primary bg-primary/10 px-4 py-3 text-sm">
        <p className="font-semibold">Ra quyết định</p>
        <p className="mt-1 text-muted-foreground">
          Chọn <span className="font-medium text-foreground">{zoneLabelForRole(role)}</span>{" "}
          ở cột trái hoặc ô bên dưới.
        </p>
      </div>
    );
  }

  if (phase === "MARKET_OPEN" && role) {
    return (
      <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm">
        <p className="font-semibold">Chợ đã mở</p>
        <p className="mt-1 text-muted-foreground">
          Vào <span className="font-medium text-foreground">{zoneLabelForRole(role)}</span>{" "}
          để mua bán.
        </p>
      </div>
    );
  }

  return null;
}

export function MapShell({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { data, isLoading } = useSessionSnapshot(sessionId);

  useSessionCancelledRedirect(data?.status, "solo_timeout");

  useEffect(() => {
    if (!data) return;
    if (data.status === "LOBBY") router.replace(`/session/${sessionId}/lobby`);
    else if (data.isHost && !data.autoHost) router.replace(`/host/session/${sessionId}`);
    else if (ENDED.includes(data.status) || data.status === "DEBRIEF")
      router.replace(`/session/${sessionId}/debrief`);
  }, [data, router, sessionId]);

  if (isLoading || !data) {
    return <p className="p-6 text-muted-foreground">Đang tải phiên…</p>;
  }

  const recapRound = data.analytics.find((r) => r.number === data.currentRound);
  const role = data.self?.role ?? null;
  const mapInteractive =
    data.status !== "INTRO" &&
    (data.phase === "DECISION" || data.phase === "MARKET_OPEN");

  return (
    <GameBentoShell
      sessionId={sessionId}
      activeZone="map"
      guidanceContext={{
        screen: "map",
        status: data.status,
        phase: data.phase,
        role,
        autoHost: data.autoHost,
      }}
    >
      <div className="flex flex-col gap-4">
        <MapPhaseHint status={data.status} phase={data.phase} role={role} />
        {data.phase === "RECAP" && recapRound ? (
          <RoundRecapCard sessionId={sessionId} round={recapRound} />
        ) : (
          <MapZones
            sessionId={sessionId}
            role={role}
            participants={data.participants}
            interactive={mapInteractive}
          />
        )}
      </div>
    </GameBentoShell>
  );
}
