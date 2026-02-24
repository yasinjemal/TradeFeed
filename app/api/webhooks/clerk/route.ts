// ============================================================
// Webhook — Clerk User Sync
// ============================================================
// POST /api/webhooks/clerk
//
// Listens for Clerk webhook events and syncs user data to our DB.
// Events handled:
//   - user.created  → Create User record
//   - user.updated  → Update User record
//   - user.deleted  → Soft-delete / remove User record
//
// SECURITY:
//   - Verifies webhook signature using Svix (Clerk's webhook infra)
//   - CLERK_WEBHOOK_SECRET must be set in env
//   - This route is public (no auth) — Clerk calls it server-to-server
//
// FLOW:
//   1. Read raw body + Svix headers
//   2. Verify signature → reject if invalid
//   3. Parse event type + data
//   4. Upsert/delete User in our DB
// ============================================================

import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reportError } from "@/lib/telemetry";

// Clerk webhook event types we care about
type ClerkUserEvent = {
  data: {
    id: string;
    email_addresses: { email_address: string; id: string }[];
    primary_email_address_id: string;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
  };
  type: "user.created" | "user.updated" | "user.deleted";
};

export async function POST(request: Request) {
  // 1. Get raw body (needed for both verified and unverified paths)
  const payload = await request.text();

  // 2. Verify webhook signature (or skip in dev if no secret)
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  let event: ClerkUserEvent;

  if (webhookSecret) {
    // PRODUCTION: Full Svix signature verification
    const headerPayload = await headers();
    const svixId = headerPayload.get("svix-id");
    const svixTimestamp = headerPayload.get("svix-timestamp");
    const svixSignature = headerPayload.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: "Missing Svix headers" },
        { status: 400 }
      );
    }

    const wh = new Webhook(webhookSecret);

    try {
      event = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ClerkUserEvent;
    } catch (err) {
      await reportError("clerk-webhook-signature", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
  } else {
    // DEV ONLY: Skip verification when CLERK_WEBHOOK_SECRET is not set
    // WARNING: Never deploy without CLERK_WEBHOOK_SECRET set!
    console.warn("[clerk-webhook] ⚠ No CLERK_WEBHOOK_SECRET — skipping signature verification (dev only)");
    event = JSON.parse(payload) as ClerkUserEvent;
  }

  // 3. Handle event
  const { type, data } = event;

  switch (type) {
    case "user.created":
    case "user.updated": {
      // Find primary email
      const primaryEmail = data.email_addresses.find(
        (e) => e.id === data.primary_email_address_id
      );

      if (!primaryEmail) {
        await reportError("clerk-webhook-primary-email-missing", new Error("No primary email"), {
          clerkUserId: data.id,
        });
        return NextResponse.json(
          { error: "No primary email" },
          { status: 400 }
        );
      }

      // Upsert user — create if new, update if existing
      await db.user.upsert({
        where: { clerkId: data.id },
        create: {
          clerkId: data.id,
          email: primaryEmail.email_address,
          firstName: data.first_name,
          lastName: data.last_name,
          imageUrl: data.image_url,
        },
        update: {
          email: primaryEmail.email_address,
          firstName: data.first_name,
          lastName: data.last_name,
          imageUrl: data.image_url,
        },
      });

      console.log(`[clerk-webhook] User ${type}: ${data.id}`);
      break;
    }

    case "user.deleted": {
      // Delete user and cascade to ShopUser memberships
      // Products/shops remain (owned by shop, not user personally)
      try {
        await db.user.delete({
          where: { clerkId: data.id },
        });
        console.log(`[clerk-webhook] User deleted: ${data.id}`);
      } catch {
        // User might not exist in our DB — that's fine
        console.log(`[clerk-webhook] User not found for deletion: ${data.id}`);
      }
      break;
    }

    default: {
      // Ignore unknown event types
      console.log(`[clerk-webhook] Unhandled event type: ${type}`);
    }
  }

  return NextResponse.json({ success: true });
}
