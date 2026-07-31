// ============================================================
// Resend Email Client — Singleton
// ============================================================
// Centralized Resend instance for all transactional emails.
// Set RESEND_API_KEY in your .env to enable.
//
// NOTE: In development without a key, emails are logged to console.
// ============================================================

import { Resend, type Tag } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — emails will be logged only.");
    return null;
  }
  if (!_resend) {
    _resend = new Resend(key);
  }
  return _resend;
}

/**
 * Send an email via Resend. Falls back to console.log in dev/no-key mode.
 */
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string | string[];
  headers?: Record<string, string>;
  tags?: Tag[];
  topicId?: string;
  idempotencyKey?: string;
}) {
  const resend = getResend();
  const from = options.from ?? "TradeFeed <notifications@tradefeed.co.za>";

  if (!resend) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[email] Delivery unavailable because RESEND_API_KEY is not configured.",
      );
      return {
        success: false,
        error: new Error("Email delivery is not configured."),
      };
    }

    console.log("[email] Would send:", {
      from,
      to: options.to,
      subject: options.subject,
      htmlLength: options.html.length,
    });
    return { success: true, fallback: true };
  }

  try {
    const result = await resend.emails.send({
      from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      ...(options.text ? { text: options.text } : {}),
      ...(options.replyTo ? { replyTo: options.replyTo } : {}),
      ...(options.headers ? { headers: options.headers } : {}),
      ...(options.tags ? { tags: options.tags } : {}),
      ...(options.topicId ? { topicId: options.topicId } : {}),
    }, options.idempotencyKey
      ? { idempotencyKey: options.idempotencyKey }
      : undefined);

    if (result.error) {
      console.error("[email] Resend error:", result.error);
      return { success: false, error: result.error };
    }

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("[email] Failed to send:", error);
    return { success: false, error };
  }
}
