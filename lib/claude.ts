// Claude API client (Anthropic SDK) — lazy singleton
// Reads ANTHROPIC_API_KEY from process.env only.
// Next.js loads .env.local + .env at startup; production uses platform secrets.

import Anthropic from "@anthropic-ai/sdk";

const globalForClaude = globalThis as unknown as {
  claude?: Anthropic;
};

export function getClaude(): Anthropic {
  if (globalForClaude.claude) return globalForClaude.claude;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY ไม่ถูกตั้งค่า — ดูที่ https://console.anthropic.com/settings/keys"
    );
  }

  const client = new Anthropic({ apiKey });

  if (process.env.NODE_ENV !== "production") {
    globalForClaude.claude = client;
  }

  return client;
}

// ─────────────────────────────────────────────
// Models
// ─────────────────────────────────────────────

// AI Model — Anthropic Claude Opus 4.5 (ตามคำสั่ง user)
// ราคา ~$15/$75 per MTok (input/output) — สูงกว่า Haiku ~15x
export const MODELS = {
  OPUS: "claude-opus-4-5",
  /** @deprecated ใช้ MODELS.OPUS แทน — alias เพื่อ backward-compat */
  HAIKU: "claude-opus-4-5",
  /** @deprecated ใช้ MODELS.OPUS แทน — alias เพื่อ backward-compat */
  SONNET: "claude-opus-4-5",
} as const;

export const DEFAULT_MAX_TOKENS = 2048;

// ─────────────────────────────────────────────
// Shared JSON parser — strips code fences, parses safely
// ─────────────────────────────────────────────

/**
 * Parse JSON response from Claude. Strips markdown code fences.
 * Returns fallback if parse fails.
 */
export function parseClaudeJson<T>(text: string, fallback: T): T {
  const cleaned = text
    .trim()
    .replace(/^```json\n?/i, "")
    .replace(/^```\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}
