import assert from "node:assert/strict";
import type { QueryClient } from "@tanstack/react-query";
import type { SessionSnapshot } from "./session-service";
import {
  applySessionGameEvent,
  parseSessionEventRow,
  parseSessionSignalRow,
  patchSessionSnapshot,
} from "./session-stream-utils";

function snapshot(): SessionSnapshot {
  return {
    stateVersion: 4,
    participants: [
      {
        id: "participant-1",
        presence: "OFFLINE",
        lastSeenAt: new Date(0).toISOString(),
        controlMode: "BOT_TAKEOVER",
      },
    ],
  } as unknown as SessionSnapshot;
}

function verifyEventRowParsing(): void {
  assert.deepEqual(
    parseSessionEventRow({
      sessionId: "session-1",
      stateVersion: 5,
      type: "market:trade_completed",
      data: '{"transactionId":"tx-1"}',
    }),
    {
      sessionId: "session-1",
      stateVersion: 5,
      type: "market:trade_completed",
      data: { transactionId: "tx-1" },
    },
  );

  assert.deepEqual(
    parseSessionSignalRow({
      $id: "session-1",
      stateVersion: 6,
      type: "round:settled",
      data: '{"round":2}',
    }),
    {
      sessionId: "session-1",
      stateVersion: 6,
      type: "round:settled",
      data: { round: 2 },
    },
  );
}

function verifyPresencePatch(): void {
  const updated = patchSessionSnapshot(snapshot(), {
    sessionId: "session-1",
    stateVersion: 5,
    type: "participant:presence",
    data: {
      participantId: "participant-1",
      presence: "ONLINE",
      controlMode: "HUMAN",
      lastSeenAt: "2026-07-04T00:00:00.000Z",
    },
  });

  assert.equal(updated?.participants[0]?.presence, "ONLINE");
  assert.equal(updated?.participants[0]?.controlMode, "HUMAN");
  assert.equal(updated?.participants[0]?.lastSeenAt, "2026-07-04T00:00:00.000Z");
}

function verifyPhaseRefetch(): void {
  const calls: string[] = [];
  const queryClient = {
    refetchQueries: () => {
      calls.push("refetch");
      return Promise.resolve();
    },
    invalidateQueries: () => Promise.resolve(),
  } as unknown as QueryClient;

  applySessionGameEvent(queryClient, ["session", "session-1"], {
    sessionId: "session-1",
    stateVersion: 5,
    type: "round:phase_changed",
    data: { phase: "EVENT" },
  });

  assert.deepEqual(calls, ["refetch"]);
}

verifyEventRowParsing();
verifyPresencePatch();
verifyPhaseRefetch();
