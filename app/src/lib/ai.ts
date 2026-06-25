// Gemini access with multi-key + multi-model rotation.
//
// Keys: GEMINI_KEY_<number>. Models: GEMINI_MODELS (comma-separated) or default list.
// On each request, tries (model × key) pairs until one succeeds or all are exhausted.

import { GoogleGenAI } from "@google/genai";

const KEY_PATTERN = /^GEMINI_KEY_(\d+)$/;

/** Smoke-test order: most reliable free-tier models first. */
export const DEFAULT_MODEL_ROTATION = [
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3.5-flash",
] as const;

const PAIR_BACKOFF_MS = 24 * 60 * 60 * 1000;

/** Detect and order all configured Gemini keys. */
export function collectGeminiKeys(): string[] {
  return Object.entries(process.env)
    .map(([name, value]) => {
      const match = name.match(KEY_PATTERN);
      if (!match || !value || value.trim() === "") return null;
      return { index: Number(match[1]), value: value.trim() };
    })
    .filter(
      (entry): entry is { index: number; value: string } => entry !== null,
    )
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.value);
}

/** Model rotation list from GEMINI_MODELS or defaults. */
export function collectGeminiModels(): string[] {
  const raw = process.env.GEMINI_MODELS?.trim();
  if (raw) {
    const models = raw
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    if (models.length > 0) return models;
  }
  return [...DEFAULT_MODEL_ROTATION];
}

const clientCache = new Map<string, GoogleGenAI>();

function clientFor(apiKey: string): GoogleGenAI {
  let client = clientCache.get(apiKey);
  if (!client) {
    client = new GoogleGenAI({ apiKey });
    clientCache.set(apiKey, client);
  }
  return client;
}

let modelCursor = 0;
let keyCursor = 0;

/** Per (keyIndex, model) backoff after quota exhaustion (429). */
const pairBackoffUntil = new Map<string, number>();

function pairKey(keyIndex: number, model: string): string {
  return `${keyIndex}:${model}`;
}

function isPairAvailable(keyIndex: number, model: string): boolean {
  const until = pairBackoffUntil.get(pairKey(keyIndex, model));
  return until === undefined || Date.now() >= until;
}

function markPairExhausted(
  keyIndex: number,
  model: string,
  retryDelayMs = PAIR_BACKOFF_MS,
): void {
  pairBackoffUntil.set(pairKey(keyIndex, model), Date.now() + retryDelayMs);
}

function errorMessage(error: unknown): string {
  return String((error as { message?: string })?.message ?? error);
}

function errorStatus(error: unknown): number | undefined {
  return (error as { status?: number })?.status;
}

/** Daily / per-key quota (429, RESOURCE_EXHAUSTED). */
function isQuotaExhausted(error: unknown): boolean {
  const status = errorStatus(error);
  const message = errorMessage(error);
  return (
    status === 429 ||
    /RESOURCE_EXHAUSTED|quota exceeded|GenerateRequestsPerDay/i.test(message)
  );
}

/** Temporary overload — try another pair, do not mark exhausted. */
function isTransient(error: unknown): boolean {
  const status = errorStatus(error);
  const message = errorMessage(error);
  return (
    status === 503 ||
    status === 500 ||
    /high demand|overloaded|unavailable/i.test(message)
  );
}

/** Invalid model/request on this key — skip pair for this request. */
function isInvalidRequest(error: unknown): boolean {
  const status = errorStatus(error);
  const message = errorMessage(error);
  return status === 400 || /invalid argument|not found|not supported/i.test(message);
}

/** Parse RetryInfo.retryDelay from Gemini error JSON when present. */
function parseRetryDelayMs(error: unknown): number | undefined {
  const message = errorMessage(error);
  try {
    const parsed = JSON.parse(message) as {
      error?: {
        details?: { "@type"?: string; retryDelay?: string }[];
      };
    };
    for (const d of parsed.error?.details ?? []) {
      if (d.retryDelay) {
        const sec = parseFloat(d.retryDelay.replace(/s$/, ""));
        if (Number.isFinite(sec) && sec > 0) return Math.ceil(sec * 1000);
      }
    }
  } catch {
    const m = message.match(/retry in ([\d.]+)s/i);
    if (m) return Math.ceil(parseFloat(m[1]) * 1000);
  }
  return undefined;
}

export interface GenerateOptions {
  prompt: string;
  model?: string;
  systemInstruction?: string;
  responseMimeType?: string;
}

export class NoGeminiKeysError extends Error {
  constructor() {
    super("No GEMINI_KEY_<n> environment variables are configured");
    this.name = "NoGeminiKeysError";
  }
}

/** All model × key pairs exhausted — callers should use fallback text. */
export class GeminiQuotaError extends Error {
  constructor(message?: string) {
    super(message ?? "Gemini quota or rate limit exceeded on all models and keys");
    this.name = "GeminiQuotaError";
  }
}

export function isGeminiQuotaError(error: unknown): boolean {
  if (error instanceof GeminiQuotaError || error instanceof NoGeminiKeysError) {
    return true;
  }
  const message = errorMessage(error);
  return /RESOURCE_EXHAUSTED|quota|rate.?limit|\b429\b/i.test(message);
}

function hasAvailablePair(models: string[], keys: string[]): boolean {
  for (let mi = 0; mi < models.length; mi++) {
    for (let ki = 0; ki < keys.length; ki++) {
      if (isPairAvailable(ki, models[mi])) return true;
    }
  }
  return false;
}

/** Generate text, rotating models and keys until success or full exhaustion. */
export async function generateText(options: GenerateOptions): Promise<string> {
  const keys = collectGeminiKeys();
  if (keys.length === 0) throw new NoGeminiKeysError();

  const models = options.model ? [options.model] : collectGeminiModels();
  if (models.length === 0) {
    throw new Error("No Gemini models configured");
  }

  if (!hasAvailablePair(models, keys)) {
    throw new GeminiQuotaError();
  }

  let lastError: unknown;
  let sawQuotaError = false;

  for (let mi = 0; mi < models.length; mi++) {
    const modelIndex = (modelCursor + mi) % models.length;
    const model = models[modelIndex];

    for (let ki = 0; ki < keys.length; ki++) {
      const keyIndex = (keyCursor + ki) % keys.length;
      const apiKey = keys[keyIndex];

      if (!isPairAvailable(keyIndex, model)) continue;

      try {
        const response = await clientFor(apiKey).models.generateContent({
          model,
          contents: options.prompt,
          config: {
            systemInstruction: options.systemInstruction,
            responseMimeType: options.responseMimeType,
          },
        });
        const text = response.text;
        if (text && text.trim() !== "") {
          modelCursor = (modelIndex + 1) % models.length;
          keyCursor = (keyIndex + 1) % keys.length;
          return text;
        }
        lastError = new Error("Empty response from model");
      } catch (error) {
        lastError = error;

        if (isQuotaExhausted(error)) {
          sawQuotaError = true;
          markPairExhausted(
            keyIndex,
            model,
            parseRetryDelayMs(error) ?? PAIR_BACKOFF_MS,
          );
          continue;
        }

        if (isTransient(error)) continue;
        if (isInvalidRequest(error)) continue;
        continue;
      }
    }
  }

  const detail = errorMessage(lastError);
  if (sawQuotaError || !hasAvailablePair(models, keys)) {
    throw new GeminiQuotaError(detail);
  }

  throw new Error(
    `Gemini generation failed over ${models.length} model(s) × ${keys.length} key(s): ${detail}`,
  );
}

/** Generate and parse JSON (used for recap / debrief narration). */
export async function generateJson<T>(options: GenerateOptions): Promise<T> {
  const text = await generateText({
    ...options,
    responseMimeType: "application/json",
  });
  return JSON.parse(text) as T;
}
