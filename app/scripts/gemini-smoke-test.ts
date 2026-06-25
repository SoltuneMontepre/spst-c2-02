/**
 * Smoke test: each GEMINI_KEY_<n> × each model/agent, one call each.
 * Run: bun --env-file=.env scripts/gemini-smoke-test.ts
 */

import { GoogleGenAI } from "@google/genai";

const KEY_PATTERN = /^GEMINI_KEY_(\d+)$/;
const INTERACTIONS_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

type TextModel = { label: string; id: string; kind: "text" };
type AgentModel = { label: string; id: string; kind: "agent" };

const MODELS: (TextModel | AgentModel)[] = [
  { label: "Gemini 2.5 Flash", id: "gemini-2.5-flash", kind: "text" },
  { label: "Gemini 2.5 Flash Lite", id: "gemini-2.5-flash-lite", kind: "text" },
  { label: "Gemini 3 Flash", id: "gemini-3-flash-preview", kind: "text" },
  { label: "Gemini 3.1 Flash Lite", id: "gemini-3.1-flash-lite", kind: "text" },
  { label: "Gemini 3.5 Flash", id: "gemini-3.5-flash", kind: "text" },
  {
    label: "Antigravity",
    id: "antigravity-preview-05-2026",
    kind: "agent",
  },
];

function collectKeys(): { name: string; value: string }[] {
  return Object.entries(process.env)
    .map(([name, value]) => {
      const match = name.match(KEY_PATTERN);
      if (!match || !value?.trim()) return null;
      return { name, value: value.trim(), index: Number(match[1]) };
    })
    .filter((e): e is { name: string; value: string; index: number } => e !== null)
    .sort((a, b) => a.index - b.index)
    .map(({ name, value }) => ({ name, value }));
}

function shortError(error: unknown): string {
  const raw = String((error as { message?: string })?.message ?? error);
  try {
    const parsed = JSON.parse(raw) as { error?: { code?: number; message?: string } };
    if (parsed.error?.message) {
      const msg = parsed.error.message.split("\n")[0];
      return `[${parsed.error.code ?? "?"}] ${msg.slice(0, 120)}`;
    }
  } catch {
    /* not JSON */
  }
  return raw.slice(0, 140);
}

async function probeText(
  apiKey: string,
  modelId: string,
): Promise<{ ok: boolean; detail: string }> {
  const client = new GoogleGenAI({ apiKey });
  try {
    const response = await client.models.generateContent({
      model: modelId,
      contents: "Reply with exactly: OK",
    });
    const text = response.text?.trim();
    if (text) return { ok: true, detail: text.slice(0, 40) };
    return { ok: false, detail: "empty text" };
  } catch (error) {
    return { ok: false, detail: shortError(error) };
  }
}

interface InteractionResponse {
  name?: string;
  id?: string;
  status?: string;
  error?: { code?: number; message?: string };
  outputs?: { type?: string; text?: string }[];
  steps?: { summary?: { text?: string }[] }[];
}

function interactionText(body: InteractionResponse): string {
  const fromOutputs = body.outputs?.map((o) => o.text).filter(Boolean).join(" ");
  if (fromOutputs?.trim()) return fromOutputs.trim();
  const fromSteps = body.steps
    ?.flatMap((s) => s.summary?.map((x) => x.text) ?? [])
    .filter(Boolean)
    .join(" ");
  return fromSteps?.trim() ?? "";
}

function isTerminal(status: string | undefined): boolean {
  const s = status?.toLowerCase();
  return s === "completed" || s === "failed" || s === "cancelled";
}

async function probeAgent(
  apiKey: string,
  agentId: string,
): Promise<{ ok: boolean; detail: string }> {
  try {
    const createRes = await fetch(INTERACTIONS_URL, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent: agentId,
        input: "Reply with exactly: OK",
        environment: "remote",
      }),
    });

    const body = (await createRes.json()) as InteractionResponse & {
      error?: { code?: number; message?: string };
    };

    if (!createRes.ok) {
      const msg = body.error?.message ?? JSON.stringify(body).slice(0, 120);
      return { ok: false, detail: `[${createRes.status}] ${msg}` };
    }

    if (isTerminal(body.status)) {
      if (body.status?.toLowerCase() === "completed") {
        const text = interactionText(body);
        return { ok: true, detail: (text || "completed").slice(0, 40) };
      }
      return { ok: false, detail: `status=${body.status}` };
    }

    const interactionId = (body.name ?? body.id ?? "").replace(/^interactions\//, "");
    if (!interactionId) {
      const text = interactionText(body);
      if (text) return { ok: true, detail: text.slice(0, 40) };
      return { ok: false, detail: "no interaction id in response" };
    }

    const pollUrl = `${INTERACTIONS_URL}/${interactionId}`;

    for (let i = 0; i < 20; i++) {
      await sleep(3000);
      const pollRes = await fetch(pollUrl, {
        headers: { "x-goog-api-key": apiKey },
      });
      const poll = (await pollRes.json()) as InteractionResponse & {
        error?: { code?: number; message?: string };
      };

      if (!pollRes.ok) {
        return {
          ok: false,
          detail: `[poll ${pollRes.status}] ${poll.error?.message ?? "poll failed"}`,
        };
      }

      if (isTerminal(poll.status)) {
        if (poll.status?.toLowerCase() === "completed") {
          const text = interactionText(poll);
          return { ok: true, detail: (text || "completed").slice(0, 40) };
        }
        return { ok: false, detail: `status=${poll.status}` };
      }
    }

    return { ok: false, detail: "timed out waiting for agent" };
  } catch (error) {
    return { ok: false, detail: shortError(error) };
  }
}

async function probe(
  apiKey: string,
  model: (typeof MODELS)[number],
): Promise<{ ok: boolean; detail: string }> {
  if (model.kind === "agent") return probeAgent(apiKey, model.id);
  return probeText(apiKey, model.id);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const keys = collectKeys();
if (keys.length === 0) {
  console.error("No GEMINI_KEY_<n> found in environment.");
  process.exit(1);
}

console.log(`Keys: ${keys.map((k) => k.name).join(", ")}`);
console.log(`Models: ${MODELS.length} | Calls: ${keys.length * MODELS.length}\n`);

type Row = { key: string; model: string; modelId: string; ok: boolean; detail: string };

const rows: Row[] = [];

for (const key of keys) {
  for (const model of MODELS) {
    const result = await probe(key.value, model);
    rows.push({
      key: key.name,
      model: model.label,
      modelId: model.id,
      ok: result.ok,
      detail: result.detail,
    });
    const mark = result.ok ? "OK" : "FAIL";
    console.log(`${mark.padEnd(4)} ${key.name.padEnd(14)} ${model.label}`);
    await sleep(model.kind === "agent" ? 500 : 1200);
  }
}

console.log("\n--- Summary ---\n");

const col = (s: string, w: number) => s.padEnd(w);
const wKey = 14;
const wModel = 22;
console.log(col("Key", wKey) + col("Model", wModel) + "Status  Detail");
console.log("-".repeat(90));

for (const r of rows) {
  console.log(
    col(r.key, wKey) +
      col(r.model, wModel) +
      (r.ok ? "OK      " : "FAIL    ") +
      r.detail,
  );
}

const okCount = rows.filter((r) => r.ok).length;
console.log(`\n${okCount}/${rows.length} succeeded.`);

process.exit(okCount === rows.length ? 0 : 1);
