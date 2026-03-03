import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";

/**
 * GET /api/test-email?to=you@example.com
 * Quick smoke-test for Resend + verified domain.
 * DELETE THIS ROUTE after confirming it works.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to");

  if (!to) {
    return NextResponse.json(
      { error: "Add ?to=your@email.com to the URL" },
      { status: 400 },
    );
  }

  const result = await sendEmail({
    to,
    subject: "✅ TradeFeed — Email Test",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#16a34a">It works! 🎉</h2>
        <p>This test email was sent from <strong>notifications@tradefeed.co.za</strong>
           via Resend with your verified domain.</p>
        <p style="color:#6b7280;font-size:13px">Sent at ${new Date().toISOString()}</p>
      </div>
    `,
    text: "TradeFeed email test — it works!",
  });

  return NextResponse.json(result);
}
