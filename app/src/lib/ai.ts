// Gemini access with multi-key rotation (Todo: keys detection + rotation).
//
// Keys are detected by globbing env vars matching GEMINI_KEY_<number>.
// Calls rotate across keys; on failure or quota exhaustion the next key is
// tried, and the whole key set is retried for one extra round before giving up.

import { GoogleGenAI } from "@google/genai";

const KEY_PATTERN = /^GEMINI_KEY_(\d+)$/;
const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_ROUNDS = 2;

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

const clientCache = new Map<string, GoogleGenAI>();

function clientFor(apiKey: string): GoogleGenAI {
  let client = clientCache.get(apiKey);
  if (!client) {
    client = new GoogleGenAI({ apiKey });
    clientCache.set(apiKey, client);
  }
  return client;
}

// Spread load across keys between requests.
let rotationCursor = 0;

function isRetriable(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  const message = String((error as { message?: string })?.message ?? error);
  return (
    status === 429 ||
    status === 500 ||
    status === 503 ||
    /RESOURCE_EXHAUSTED|quota|rate.?limit|overloaded|unavailable/i.test(message)
  );
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

/** All keys exhausted (quota / rate limit) — callers should use fallback text. */
export class GeminiQuotaError extends Error {
  constructor(message?: string) {
    super(message ?? "Gemini quota or rate limit exceeded");
    this.name = "GeminiQuotaError";
  }
}

export function isGeminiQuotaError(error: unknown): boolean {
  if (error instanceof GeminiQuotaError || error instanceof NoGeminiKeysError) {
    return true;
  }
  const message = String((error as { message?: string })?.message ?? error);
  return /RESOURCE_EXHAUSTED|quota|rate.?limit|\b429\b/i.test(message);
}

/** Skip API calls after quota exhaustion (free tier is per-day). */
let quotaBackoffUntil = 0;

function enterQuotaBackoff(retryDelayMs = 60 * 60 * 1000): void {
  quotaBackoffUntil = Date.now() + retryDelayMs;
}

/** Generate text, rotating keys on failure with one retry round. */
export async function generateText(options: GenerateOptions): Promise<string> {
  const keys = collectGeminiKeys();
  if (keys.length === 0) throw new NoGeminiKeysError();
  if (Date.now() < quotaBackoffUntil) throw new GeminiQuotaError();

  const model = options.model ?? DEFAULT_MODEL;
  let lastError: unknown;
  let sawQuotaError = false;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    for (let step = 0; step < keys.length; step++) {
      const key = keys[(rotationCursor + step) % keys.length];
      try {
        const response = await clientFor(key).models.generateContent({
          model,
          contents: options.prompt,
          config: {
            systemInstruction: options.systemInstruction,
            responseMimeType: options.responseMimeType,
          },
        });
        const text = response.text;
        if (text && text.trim() !== "") {
          rotationCursor = (rotationCursor + step + 1) % keys.length;
          return text;
        }
        lastError = new Error("Empty response from model");
      } catch (error) {
        lastError = error;
        if (isRetriable(error)) sawQuotaError = true;
        if (!isRetriable(error) && round === 0 && step < keys.length - 1) {
          // Non-retriable on this key: still try the next key once.
          continue;
        }
      }
    }
  }

  if (sawQuotaError) enterQuotaBackoff();

  const detail =
    (lastError as { message?: string })?.message ?? String(lastError);
  if (sawQuotaError || isGeminiQuotaError(lastError)) {
    throw new GeminiQuotaError(detail);
  }

  throw new Error(
    `Gemini generation failed after ${MAX_ROUNDS} rounds over ${keys.length} key(s): ${detail}`,
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
