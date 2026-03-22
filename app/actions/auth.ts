"use server";

import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { whatsappLoginSchema, normalizeToE164 } from "@/lib/validation/auth";
import { sendTextMessage } from "@/lib/whatsapp/business-api";
import { SITE_URL } from "@/lib/config/site";

const MAGIC_LINK_TTL_SECONDS = 300; // 5 minutes
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 3; // max requests per phone in the window

type MagicLinkResult = {
  success: boolean;
  error?: string;
};

/**
 * Request a WhatsApp magic login link.
 *
 * Flow:
 * 1. Validate SA phone number
 * 2. Rate-limit (max 3 per phone per 15 min)
 * 3. Generate secure random token → store MagicLink row
 * 4. Send WhatsApp message with verification link
 */
export async function requestWhatsappMagicLink(
  phoneNumber: string
): Promise<MagicLinkResult> {
  // ── Validate ────────────────────────────────────────
  const parsed = whatsappLoginSchema.safeParse({ phoneNumber });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid phone number";
    return { success: false, error: msg };
  }

  const normalizedPhone = normalizeToE164(parsed.data.phoneNumber);

  // ── Rate limit ──────────────────────────────────────
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recentCount = await db.magicLink.count({
    where: {
      phoneNumber: normalizedPhone,
      createdAt: { gte: windowStart },
    },
  });

  if (recentCount >= RATE_LIMIT_MAX) {
    return {
      success: false,
      error: "Too many login attempts. Please try again in 15 minutes.",
    };
  }

  // ── Generate token ──────────────────────────────────
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_SECONDS * 1000);

  await db.magicLink.create({
    data: {
      token,
      phoneNumber: normalizedPhone,
      expiresAt,
    },
  });

  // ── Send WhatsApp message ───────────────────────────
  const verifyUrl = `${SITE_URL}/api/auth/whatsapp-verify?token=${token}`;

  const message =
    `🔐 *TradeFeed Login*\n\n` +
    `Tap the link below to sign in to your TradeFeed account:\n\n` +
    `${verifyUrl}\n\n` +
    `This link expires in 5 minutes. If you didn't request this, you can safely ignore it.`;

  const result = await sendTextMessage(normalizedPhone, message);

  if (!result.success) {
    return {
      success: false,
      error: "Failed to send WhatsApp message. Please try again.",
    };
  }

  return { success: true };
}
