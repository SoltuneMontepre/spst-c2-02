"use client";

import { useSessionSnapshot } from "@/hooks/use-session-room";
import { ProducerDashboard } from "@/components/roles/producer-dashboard";
import { ConsumerMarket } from "@/components/roles/consumer-market";
import { IntermediaryDashboard } from "@/components/roles/intermediary-dashboard";
import { GovernmentConsole } from "@/components/roles/government-console";
import { ComingSoon } from "./coming-soon";

const TITLES: Record<string, string> = {
  INTERMEDIARY: "Trung tâm phân phối",
  GOVERNMENT: "Bảng chính sách Nhà nước",
};

/** Renders the dashboard for the player's role (task/market zones). */
export function RoleTask({ sessionId }: { sessionId: string }) {
  const { data } = useSessionSnapshot(sessionId);
  if (!data) return <p className="p-6 text-muted-foreground">Đang tải…</p>;

  switch (data.self?.role) {
    case "PRODUCER":
      return <ProducerDashboard sessionId={sessionId} />;
    case "CONSUMER":
      return <ConsumerMarket sessionId={sessionId} />;
    case "INTERMEDIARY":
      return <IntermediaryDashboard sessionId={sessionId} />;
    case "GOVERNMENT":
      return <GovernmentConsole sessionId={sessionId} />;
    default:
      return (
        <ComingSoon
          sessionId={sessionId}
          title={TITLES[data.self?.role ?? ""] ?? "Nhiệm vụ theo vai"}
        />
      );
  }
}
