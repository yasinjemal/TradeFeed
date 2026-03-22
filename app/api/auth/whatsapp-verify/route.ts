import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/config/site";

/**
 * GET /api/auth/whatsapp-verify?token=<token>
 *
 * Clicked from the WhatsApp magic link message. Validates the
 * one-time token, finds or creates a Clerk user for the phone
 * number, generates a Clerk sign-in token, and redirects to the
 * client-side verification page that finalizes the session.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return redirectWithError("Missing login token.");
  }

  // ── Look up + validate token ────────────────────────
  const magicLink = await db.magicLink.findUnique({ where: { token } });

  if (!magicLink) {
    return redirectWithError("Invalid or expired login link.");
  }

  if (magicLink.usedAt) {
    return redirectWithError("This login link has already been used.");
  }

  if (new Date() > magicLink.expiresAt) {
    return redirectWithError("This login link has expired. Please request a new one.");
  }

  // ── Mark token as used (prevent replay) ─────────────
  await db.magicLink.update({
    where: { id: magicLink.id },
    data: { usedAt: new Date() },
  });

  // ── Find or create Clerk user by phone ──────────────
  const clerk = await clerkClient();
  let clerkUserId: string;

  try {
    const existingUsers = await clerk.users.getUserList({
      phoneNumber: [magicLink.phoneNumber],
    });

    if (existingUsers.data.length > 0 && existingUsers.data[0]) {
      clerkUserId = existingUsers.data[0].id;
    } else {
      const newUser = await clerk.users.createUser({
        phoneNumber: [magicLink.phoneNumber],
        skipPasswordRequirement: true,
      });
      clerkUserId = newUser.id;
    }
  } catch (err) {
    console.error("[whatsapp-verify] Clerk user lookup/create failed:", err);
    return redirectWithError("Could not create your account. Please try again.");
  }

  // ── Store Clerk userId back on the MagicLink row ────
  await db.magicLink.update({
    where: { id: magicLink.id },
    data: { userId: clerkUserId },
  });

  // ── Create a Clerk sign-in token ────────────────────
  try {
    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: clerkUserId,
      expiresInSeconds: 300,
    });

    const verifyUrl = new URL("/whatsapp-login/verify", SITE_URL);
    verifyUrl.searchParams.set("token", signInToken.token);

    return NextResponse.redirect(verifyUrl.toString());
  } catch (err) {
    console.error("[whatsapp-verify] Sign-in token creation failed:", err);
    return redirectWithError("Login failed. Please try again.");
  }
}

function redirectWithError(message: string) {
  const url = new URL("/whatsapp-login", SITE_URL);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url.toString());
}
