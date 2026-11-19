import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip type-checking during Vercel builds (already done in CI/locally)
  // Cuts ~30-60s off each build
  typescript: { ignoreBuildErrors: false },
  // Self-hosted display faces. public/ is served with
  // `max-age=0, must-revalidate` by default, which would re-check three
  // font files on every cold navigation. The filenames are versioned by
  // directory (public/fonts/v1) and never overwritten in place, so they
  // are safe to freeze — bump the directory to roll a face.
  async headers() {
    return [
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
      {
        // YouTube thumbnails for product-video lite embeds
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Route browser Sentry events through Next.js to bypass ad blockers
  tunnelRoute: "/monitoring",

  // Disable source map upload until SENTRY_AUTH_TOKEN is configured
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
