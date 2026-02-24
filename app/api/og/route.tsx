// ============================================================
// Dynamic OG Image Generation (/api/og)
// ============================================================
// Generates rich Open Graph images for WhatsApp link previews
// and social sharing. Uses Next.js ImageResponse (Satori).
//
// QUERY PARAMS:
//   ?type=shop&name=...&description=...&city=...&productCount=...
//   ?type=product&name=...&shopName=...&price=...&image=...
//
// WHY:
// - WhatsApp groups are the primary traffic channel
// - A branded OG image makes shared links look professional
// - Builds trust before the buyer even clicks
// ============================================================

import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") || "shop";

  if (type === "product") {
    return generateProductOG(searchParams);
  }

  if (type === "marketplace") {
    return generateMarketplaceOG(searchParams);
  }

  return generateShopOG(searchParams);
}

// ── Shop OG Image ──────────────────────────────────────────
function generateShopOG(params: URLSearchParams) {
  const name = params.get("name") || "Shop";
  const description = params.get("description") || "Browse our catalog on TradeFeed";
  const city = params.get("city") || "";
  const productCount = params.get("productCount") || "0";
  const verified = params.get("verified") === "true";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#1c1917",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top gradient accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #10b981, #059669, #047857)",
            display: "flex",
          }}
        />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #10b981, #047857)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "24px",
              fontWeight: 800,
            }}
          >
            T
          </div>
          <span style={{ color: "#a8a29e", fontSize: "20px", fontWeight: 600 }}>
            TradeFeed
          </span>
        </div>

        {/* Shop name + verified */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
          {/* Shop initial circle */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "32px",
              fontWeight: 800,
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ color: "white", fontSize: "42px", fontWeight: 800 }}>
                {name.length > 28 ? name.slice(0, 28) + "…" : name}
              </span>
              {verified && (
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "16px",
                  }}
                >
                  ✓
                </div>
              )}
            </div>
            {city && (
              <span style={{ color: "#78716c", fontSize: "20px" }}>
                📍 {city}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p
          style={{
            color: "#a8a29e",
            fontSize: "24px",
            lineHeight: 1.5,
            maxWidth: "900px",
            marginBottom: "auto",
          }}
        >
          {description.length > 120 ? description.slice(0, 120) + "…" : description}
        </p>

        {/* Bottom stats bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "32px",
            borderTop: "1px solid #292524",
            paddingTop: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
                display: "flex",
              }}
            />
            <span style={{ color: "#d6d3d1", fontSize: "18px" }}>
              {productCount} products
            </span>
          </div>
          <span style={{ color: "#78716c", fontSize: "18px" }}>
            WhatsApp Catalog
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

// ── Product OG Image ───────────────────────────────────────
function generateProductOG(params: URLSearchParams) {
  const name = params.get("name") || "Product";
  const shopName = params.get("shopName") || "Shop";
  const price = params.get("price") || "";
  const image = params.get("image") || "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          backgroundColor: "#1c1917",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top gradient accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #10b981, #059669, #047857)",
            display: "flex",
          }}
        />

        {/* Left side — product image */}
        <div
          style={{
            width: "480px",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#292524",
          }}
        >
          {image ? (
            <img
              src={image}
              alt={name}
              width={480}
              height={630}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          ) : (
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "24px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "48px",
                fontWeight: 800,
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Right side — product info */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "60px 50px",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #10b981, #047857)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "18px",
                fontWeight: 800,
              }}
            >
              T
            </div>
            <span style={{ color: "#78716c", fontSize: "16px", fontWeight: 600 }}>
              {shopName}
            </span>
          </div>

          {/* Product name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <span
              style={{
                color: "white",
                fontSize: "40px",
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              {name.length > 50 ? name.slice(0, 50) + "…" : name}
            </span>
            {price && (
              <span
                style={{
                  color: "#10b981",
                  fontSize: "36px",
                  fontWeight: 700,
                }}
              >
                {price}
              </span>
            )}
          </div>

          {/* CTA */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              backgroundColor: "#10b981",
              padding: "16px 28px",
              borderRadius: "16px",
              width: "fit-content",
            }}
          >
            <span style={{ color: "white", fontSize: "20px", fontWeight: 700 }}>
              Order on WhatsApp
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

// ── Marketplace OG Image ───────────────────────────────
function generateMarketplaceOG(params: URLSearchParams) {
  const category = params.get("category") || "";
  const productCount = params.get("productCount") || "1,000+";
  const sellerCount = params.get("sellerCount") || "";

  const title = category
    ? `${category} — TradeFeed Marketplace`
    : "TradeFeed Marketplace";
  const subtitle = category
    ? `Browse ${productCount} ${category.toLowerCase()} products from SA sellers`
    : `Browse ${productCount} products from South Africa's top sellers`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#1c1917",
          padding: "60px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top gradient accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #10b981, #059669, #047857)",
            display: "flex",
          }}
        />

        {/* Background decorative grid */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            right: "-40px",
            display: "flex",
            flexWrap: "wrap",
            width: "400px",
            gap: "12px",
            opacity: 0.08,
          }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "16px",
                backgroundColor: "#10b981",
                display: "flex",
              }}
            />
          ))}
        </div>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "48px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #10b981, #047857)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "24px",
              fontWeight: 800,
            }}
          >
            T
          </div>
          <span style={{ color: "#a8a29e", fontSize: "20px", fontWeight: 600 }}>
            TradeFeed
          </span>
        </div>

        {/* Title */}
        <span
          style={{
            color: "white",
            fontSize: "52px",
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: "20px",
            maxWidth: "800px",
          }}
        >
          {title}
        </span>

        {/* Subtitle */}
        <p
          style={{
            color: "#a8a29e",
            fontSize: "26px",
            lineHeight: 1.5,
            maxWidth: "700px",
            marginBottom: "auto",
          }}
        >
          {subtitle}
        </p>

        {/* Bottom stats bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "32px",
            borderTop: "1px solid #292524",
            paddingTop: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
                display: "flex",
              }}
            />
            <span style={{ color: "#d6d3d1", fontSize: "18px" }}>
              {productCount} products
            </span>
          </div>
          {sellerCount && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#059669",
                  display: "flex",
                }}
              />
              <span style={{ color: "#d6d3d1", fontSize: "18px" }}>
                {sellerCount} sellers
              </span>
            </div>
          )}
          <span style={{ color: "#78716c", fontSize: "18px" }}>
            South Africa&apos;s Wholesale Fashion Hub
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
