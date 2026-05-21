// MFA TOTP service — TOR ๗.๑.๒
// ใช้ otplib v13 (functional API) — ผ่าน Google Authenticator / Microsoft Authenticator

import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";

const ISSUER = "EOP สำนักงานตำรวจแห่งชาติ";

export function generateMfaSecret(): string {
  return generateSecret();
}

export function buildOtpAuthUrl(email: string, secret: string): string {
  return generateURI({
    issuer: ISSUER,
    label: email,
    secret,
  });
}

export async function buildQrCodeDataUrl(otpAuthUrl: string): Promise<string> {
  return await QRCode.toDataURL(otpAuthUrl, { margin: 1, width: 240 });
}

export function verifyTotp(token: string, secret: string): boolean {
  try {
    const result = verifySync({ token, secret });
    return !!result.valid;
  } catch {
    return false;
  }
}

/** Generate 10 recovery codes — show once, store SHA256 hashes */
export function generateRecoveryCodes(): { plain: string[]; hashes: string[] } {
  const plain: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code =
      crypto.randomBytes(4).toString("hex").toUpperCase() +
      "-" +
      crypto.randomBytes(4).toString("hex").toUpperCase();
    plain.push(code);
    hashes.push(crypto.createHash("sha256").update(code).digest("hex"));
  }
  return { plain, hashes };
}

export function hashRecoveryCode(code: string): string {
  return crypto
    .createHash("sha256")
    .update(code.trim().toUpperCase())
    .digest("hex");
}
