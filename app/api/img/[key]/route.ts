// ============================================================
// API Route — Image Proxy for Google Merchant Center
// ============================================================
// GET /api/img/[key]
//
// Fetches an image from UploadThing CDN and serves it back as
// image/jpeg from our own domain. This solves three Google
// Merchant Center rejection issues:
//
//   1. "Unsupported image type" — UploadThing CDN may serve
//      WebP/AVIF or wrong Content-Type headers
//   2. "Text too long [image_link]" — UT URLs with original
//      filenames can exceed Google's 2000-char URL limit
//   3. Redirect chains — UT CDN may 302 before serving,
//      which Google's crawler doesn't always follow
//
// The feed uses short URLs: /api/img/<fileKey>
// This route fetches the original, sets Content-Type: image/jpeg,
// and streams it back with aggressive caching.
// ============================================================

import { NextRequest, NextResponse } from "next/server";

// UploadThing CDN domains to try (old → new format)
const UT_DOMAINS = [
  "utfs.io",
  `${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID ?? "4bggpvf2wh"}.ufs.sh`,
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;

  if (!key || key.length < 10) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  // Try fetching from UploadThing CDN
  let imageResponse: Response | null = null;

  for (const domain of UT_DOMAINS) {
    try {
      const url = `https://${domain}/f/${key}`;
      const res = await fetch(url, {
        redirect: "follow",
        headers: {
          Accept: "image/jpeg, image/png, image/gif, image/*",
        },
      });

      if (res.ok && res.headers.get("content-type")?.startsWith("image/")) {
        imageResponse = res;
        break;
      }

      // Some UT URLs need the /f/ path without redirect
      if (res.ok) {
        imageResponse = res;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!imageResponse) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const imageBuffer = await imageResponse.arrayBuffer();

  return new NextResponse(imageBuffer, {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=604800, s-maxage=604800, immutable",
      "CDN-Cache-Control": "public, max-age=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
