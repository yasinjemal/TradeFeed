import { Webhook } from "svix";
import { z } from "zod";
import { NextResponse } from "next/server";
import { applyAssistanceDeliveryEvent } from "@/lib/email/seller-assistance-webhook";
import type { EmailBouncedEvent, EmailComplainedEvent, EmailDeliveredEvent } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const eventSchema = z.object({
  type: z.enum(["email.delivered", "email.bounced", "email.complained"]),
  data: z.object({ email_id: z.string().min(1), to: z.array(z.string()).min(1), tags: z.record(z.string(), z.string()).optional() }),
});

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret || !process.env.EMAIL_MARKETING_HMAC_SECRET) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const body = await request.text();
  if (body.length > 100_000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  let verified: unknown;
  try {
    verified = new Webhook(secret).verify(body, {
      "svix-id": request.headers.get("svix-id") ?? "",
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    });
  } catch { return NextResponse.json({ error: "Invalid signature" }, { status: 401 }); }
  const parsed = eventSchema.safeParse(verified);
  if (!parsed.success) return NextResponse.json({ ignored: true });
  try {
    await applyAssistanceDeliveryEvent(parsed.data as EmailBouncedEvent | EmailComplainedEvent | EmailDeliveredEvent);
    return NextResponse.json({ received: true });
  } catch { return NextResponse.json({ error: "Unable to record delivery event" }, { status: 500 }); }
}
