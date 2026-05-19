// Claude API client (Anthropic SDK) — lazy singleton
// Used for Day 3+ AI features: command drafting, doc classification, OCR, search

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { resolve } from "path";

const globalForClaude = globalThis as unknown as {
  claude?: Anthropic;
};

/**
 * Resolve ANTHROPIC_API_KEY — prefer the project's .env.local / .env value
 * over any shell-level variable (which Claude Code or CI may have injected).
 */
function resolveApiKey(): string | null {
  // 1) Try .env.local first (highest priority for local dev)
  for (const filename of [".env.local", ".env"]) {
    try {
      const path = resolve(process.cwd(), filename);
      const text = readFileSync(path, "utf-8");
      const match = text.match(/^ANTHROPIC_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/m);
      if (match && match[1] && match[1].trim()) {
        return match[1].trim();
      }
    } catch {
      // file doesn't exist — try next
    }
  }
  // 2) Fall back to whatever the platform provides
  return process.env.ANTHROPIC_API_KEY ?? null;
}

/**
 * Get Claude client — lazy initialized.
 * Called at request time, NOT at module import time
 * (so build-time page collection ไม่ throw error).
 */
export function getClaude(): Anthropic {
  if (globalForClaude.claude) return globalForClaude.claude;

  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY ไม่ถูกตั้งค่า — ใส่ใน .env.local (https://console.anthropic.com/settings/keys)"
    );
  }

  const client = new Anthropic({ apiKey });

  if (process.env.NODE_ENV !== "production") {
    globalForClaude.claude = client;
  }

  return client;
}

// ─────────────────────────────────────────────
// Model selection — TOR ไม่ระบุ model เฉพาะ
// ใช้ Haiku 4.5 = ราคาถูก/เร็ว/ดีพอ สำหรับ draft + classify
// ใช้ Sonnet 4.5 ถ้าต้อง reasoning ลึก (e.g., OCR analysis)
// ─────────────────────────────────────────────

export const MODELS = {
  HAIKU: "claude-haiku-4-5",
  SONNET: "claude-sonnet-4-5",
} as const;

export const DEFAULT_MAX_TOKENS = 2048;
