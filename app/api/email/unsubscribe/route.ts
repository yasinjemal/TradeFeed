import { NextRequest, NextResponse } from "next/server";

import {
  applyMarketingUnsubscribe,
  getEmailMarketingHmacSecret,
} from "@/lib/email/marketing-unsubscribe";
import { verifyMarketingUnsubscribeToken } from "@/lib/email/marketing-preferences";

export const dynamic = "force-dynamic";

const MAX_BODY_LENGTH = 2_048;
const MAX_TOKEN_LENGTH = 512;
const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
} as const;

function genericSuccessResponse(): NextResponse {
  return NextResponse.json(
    {
      success: true,
      message: "Your email preference request has been received.",
    },
    { status: 200, headers: RESPONSE_HEADERS },
  );
}

function unavailableResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message:
        "We could not save this preference right now. Please try again later.",
    },
    { status: 503, headers: RESPONSE_HEADERS },
  );
}

async function readUrlEncodedBody(
  request: NextRequest,
): Promise<URLSearchParams | null> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/x-www-form-urlencoded")) {
    return null;
  }

  const body = await request.text();
  if (body.length > MAX_BODY_LENGTH) return null;

  return new URLSearchParams(body);
}

function isBoundedToken(value: string | null): value is string {
  return (
    value !== null &&
    value.length > 0 &&
    value.length <= MAX_TOKEN_LENGTH &&
    !/[\s\u0000-\u001f\u007f]/.test(value)
  );
}

/**
 * POST only by design. Link scanners may visit GET URLs, but a visit must
 * never change a seller's preference.
 *
 * Browser form:
 *   token=<signed token>
 *
 * RFC 8058 one-click:
 *   POST /api/email/unsubscribe?token=<signed token>
 *   List-Unsubscribe=One-Click
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = getEmailMarketingHmacSecret();
  if (!secret) return unavailableResponse();

  let params: URLSearchParams | null;
  try {
    params = await readUrlEncodedBody(request);
  } catch {
    return genericSuccessResponse();
  }

  if (!params) return genericSuccessResponse();

  const isOneClick =
    params.get("List-Unsubscribe") === "One-Click";
  const formToken = params.get("token");
  const queryToken = request.nextUrl.searchParams.get("token");
  const token = formToken ?? (isOneClick ? queryToken : null);

  if (!isBoundedToken(token)) return genericSuccessResponse();

  let verified:
    | ReturnType<typeof verifyMarketingUnsubscribeToken>
    | null = null;
  try {
    verified = verifyMarketingUnsubscribeToken(token, secret);
  } catch {
    return unavailableResponse();
  }

  // Return the same success for invalid, unknown and already-used tokens.
  // This prevents the endpoint from becoming an account-membership oracle.
  if (!verified) return genericSuccessResponse();

  try {
    await applyMarketingUnsubscribe({
      emailHash: verified.emailHash,
      source: isOneClick
        ? "rfc8058_one_click"
        : "email_unsubscribe_form",
    });
  } catch {
    // Do not log the token, hash, request URL, or database error. Some
    // infrastructure errors include query values in their diagnostic text.
    console.error("[email-unsubscribe] Preference update failed.");
    return unavailableResponse();
  }

  return genericSuccessResponse();
}
