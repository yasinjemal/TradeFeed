// ============================================================
// GET /api/cron/domain-health — Domain Health Monitor
// ============================================================
// Hourly cron to auto-verify pending custom domains and detect
// issues with active domains (DNS misconfiguration, SSL expiry).
//
// What it does:
// 1. Fetch all shops with customDomain set
// 2. Check DNS config + SSL via Vercel API
// 3. Update domainStatus (PENDING→ACTIVE or ACTIVE→ERROR)
// 4. Send WhatsApp alerts on status transitions
//
// Schedule: Every hour via Vercel Cron (vercel.json)
// Auth: Protected by CRON_SECRET header
// ============================================================

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkDomainHealth } from "@/lib/vercel/domains";
import { sendTextMessage } from "@/lib/whatsapp/business-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // ── Verify cron secret ──────────────────────────────
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[domain-health] CRON_SECRET is not set");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    console.warn("[domain-health] ⚠ No CRON_SECRET — running unprotected (dev)");
  } else if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all shops with a custom domain
    const shops = await db.shop.findMany({
      where: { customDomain: { not: null }, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        customDomain: true,
        domainStatus: true,
        whatsappNumber: true,
      },
    });

    if (shops.length === 0) {
      return NextResponse.json({ checked: 0, transitions: [] });
    }

    const transitions: { shop: string; domain: string; from: string; to: string }[] = [];

    for (const shop of shops) {
      if (!shop.customDomain) continue;

      const health = await checkDomainHealth(shop.customDomain);

      let newStatus = shop.domainStatus;

      if (health.configured && health.sslReady) {
        newStatus = "ACTIVE";
      } else if (health.configured && !health.sslReady) {
        // DNS OK but SSL still provisioning — keep pending, don't error
        newStatus = shop.domainStatus === "ACTIVE" ? "ACTIVE" : "PENDING";
      } else {
        newStatus = shop.domainStatus === "ACTIVE" ? "ERROR" : "PENDING";
      }

      // Only update + notify if status changed
      if (newStatus !== shop.domainStatus) {
        await db.shop.update({
          where: { id: shop.id },
          data: {
            domainStatus: newStatus,
            ...(newStatus === "ACTIVE" ? { domainVerifiedAt: new Date() } : {}),
          },
        });

        transitions.push({
          shop: shop.slug,
          domain: shop.customDomain,
          from: shop.domainStatus ?? "null",
          to: newStatus!,
        });

        // WhatsApp notification on key transitions
        if (shop.whatsappNumber) {
          if (newStatus === "ACTIVE" && shop.domainStatus !== "ACTIVE") {
            sendTextMessage(
              shop.whatsappNumber,
              `🎉 Great news! Your custom domain *${shop.customDomain}* is now live!\n\n` +
              `Your TradeFeed shop "${shop.name}" is accessible at https://${shop.customDomain}\n\n` +
              `SSL certificate is active — your buyers will see the secure 🔒 padlock.\n\n` +
              `— TradeFeed`,
            ).catch(() => {});
          } else if (newStatus === "ERROR" && shop.domainStatus === "ACTIVE") {
            sendTextMessage(
              shop.whatsappNumber,
              `⚠️ Domain alert for *${shop.customDomain}*\n\n` +
              `We detected a DNS configuration issue. Your shop "${shop.name}" may not be reachable on this domain.\n\n` +
              `Please check your DNS settings or visit your dashboard:\n` +
              `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${shop.slug}/settings\n\n` +
              `— TradeFeed`,
            ).catch(() => {});
          }
        }
      }
    }

    console.log(`[domain-health] Checked ${shops.length} domains, ${transitions.length} transitions`);
    return NextResponse.json({
      checked: shops.length,
      transitions,
    });
  } catch (err) {
    console.error("[domain-health] Cron failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
