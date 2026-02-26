// ============================================================
// Resend Email Client — Singleton
// ============================================================
// Centralized Resend instance for all transactional emails.
// Set RESEND_API_KEY in your .env to enable.
//
// NOTE: In development without a key, emails are logged to console.
// ============================================================

import { Resend } from "resend";

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
}) {
  const resend = getResend();
  const from = options.from ?? "TradeFeed <notifications@tradefeed.co.za>";

  if (!resend) {
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
    });

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
