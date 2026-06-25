/**
 * Smoke test: each GEMINI_KEY_<n> × each text model, one call each.
 * Run: bun --env-file=.env scripts/gemini-smoke-test.ts
 */

import { GoogleGenAI } from "@google/genai";
import { DEFAULT_MODEL_ROTATION } from "../src/lib/ai";

const KEY_PATTERN = /^GEMINI_KEY_(\d+)$/;

const MODELS: { label: string; id: string }[] = [
  { label: "Gemini 3.1 Flash Lite", id: "gemini-3.1-flash-lite" },
  { label: "Gemini 3 Flash", id: "gemini-3-flash-preview" },
  { label: "Gemini 2.5 Flash Lite", id: "gemini-2.5-flash-lite" },
  { label: "Gemini 2.5 Flash", id: "gemini-2.5-flash" },
  { label: "Gemini 3.5 Flash", id: "gemini-3.5-flash" },
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

async function probe(
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const keys = collectKeys();
if (keys.length === 0) {
  console.error("No GEMINI_KEY_<n> found in environment.");
  process.exit(1);
}

const rotationIds = DEFAULT_MODEL_ROTATION.join(" → ");
console.log(`Keys: ${keys.map((k) => k.name).join(", ")}`);
console.log(`App rotation: ${rotationIds}`);
console.log(`Models: ${MODELS.length} | Calls: ${keys.length * MODELS.length}\n`);

type Row = { key: string; model: string; modelId: string; ok: boolean; detail: string };

const rows: Row[] = [];

for (const key of keys) {
  for (const model of MODELS) {
    const result = await probe(key.value, model.id);
    rows.push({
      key: key.name,
      model: model.label,
      modelId: model.id,
      ok: result.ok,
      detail: result.detail,
    });
    const mark = result.ok ? "OK" : "FAIL";
    console.log(`${mark.padEnd(4)} ${key.name.padEnd(14)} ${model.label}`);
    await sleep(1200);
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
