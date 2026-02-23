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
  // 1. Get Svix headers for signature verification
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

  // 2. Get raw body for verification
  const payload = await request.text();

  // 3. Verify webhook signature
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[clerk-webhook] CLERK_WEBHOOK_SECRET not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const wh = new Webhook(webhookSecret);
  let event: ClerkUserEvent;

  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent;
  } catch (err) {
    console.error("[clerk-webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  // 4. Handle event
  const { type, data } = event;

  switch (type) {
    case "user.created":
    case "user.updated": {
      // Find primary email
      const primaryEmail = data.email_addresses.find(
        (e) => e.id === data.primary_email_address_id
      );

      if (!primaryEmail) {
        console.error("[clerk-webhook] No primary email for user:", data.id);
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
