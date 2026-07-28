import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildGeoapifyAutocompleteUrl,
  parseGeoapifySuggestions,
} from "@/lib/location/geoapify";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit-upstash";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const requestSchema = z.object({
  query: z.string().trim().min(3).max(160),
});

function json(
  body: Record<string, unknown>,
  status: number,
  extraHeaders?: Record<string, string>,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return json({ enabled: true, suggestions: [] }, 200);
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    return json(
      {
        enabled: false,
        suggestions: [],
        reason: "Location suggestions are not configured.",
      },
      503,
    );
  }

  const rateLimit = await checkRateLimit(
    "api",
    `location:${getClientIp(request)}`,
  );
  if (!rateLimit.allowed) {
    return json(
      { enabled: true, suggestions: [], error: "Too many requests." },
      429,
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
  }

  try {
    const response = await fetch(
      buildGeoapifyAutocompleteUrl(parsed.data.query, apiKey),
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(4_000),
      },
    );

    if (!response.ok) {
      console.warn("[location-autocomplete] Geoapify request failed", {
        status: response.status,
      });
      return json(
        {
          enabled: true,
          suggestions: [],
          error: "Location suggestions are temporarily unavailable.",
        },
        502,
      );
    }

    const suggestions = parseGeoapifySuggestions(await response.json());
    return json({ enabled: true, suggestions }, 200);
  } catch {
    // Fetch errors can include the request URL. The API key is a query
    // parameter, so keep the public/server log deliberately generic.
    console.warn("[location-autocomplete] Geoapify request error");
    return json(
      {
        enabled: true,
        suggestions: [],
        error: "Location suggestions are temporarily unavailable.",
      },
      502,
    );
  }
}
