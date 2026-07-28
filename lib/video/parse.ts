// ============================================================
// Video URL parsing — single source of truth for classifying a
// seller-pasted video link. Pure and isomorphic: the client uses
// it for instant feedback/previews, the server RE-RUNS it as the
// authority (never trust the client's classification — that's
// the shop-gallery bug we're deliberately not repeating).
//
// Supported:
// - YouTube (watch, youtu.be, Shorts, embed, live, m., nocookie)
//   → canonical watch URL + privacy-enhanced nocookie embed +
//     i.ytimg.com thumbnail (hqdefault ALWAYS exists;
//     maxresdefault 404s for many videos — never store it)
// - Direct https links to video files (.mp4 .webm .mov .m4v)
// Everything else is rejected with a human error message.
// ============================================================

export type ParsedVideo =
  | {
      source: "YOUTUBE";
      videoId: string;
      /** Canonical https watch URL (what we store) */
      url: string;
      /** Privacy-enhanced embed URL (no autoplay params) */
      embedUrl: string;
      thumbnailUrl: string;
    }
  | { source: "DIRECT"; url: string };

export type ParseResult =
  | { ok: true; video: ParsedVideo }
  | { ok: false; error: string };

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const DIRECT_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v"];

function youtubeIdFrom(url: URL): string | null {
  const host = url.hostname.replace(/^(www\.|m\.)/, "");

  if (host === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const match = url.pathname.match(/^\/(shorts|embed|live)\/([^/]+)/);
    if (match) return match[2] ?? null;
  }

  return null;
}

/** Classify and normalize a pasted video URL. */
export function parseVideoUrl(raw: string): ParseResult {
  const input = raw.trim();
  if (!input) return { ok: false, error: "Paste a video link first." };

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, error: "That doesn't look like a link. Paste a full URL starting with https://." };
  }

  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  const isYouTubeHost =
    host === "youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com";

  // YouTube accepts http and normalizes; everything else must be https.
  if (isYouTubeHost) {
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { ok: false, error: "Only web links are supported." };
    }
    const videoId = youtubeIdFrom(url);
    if (!videoId || !YOUTUBE_ID_RE.test(videoId)) {
      return {
        ok: false,
        error: "We couldn't find a video in that YouTube link. Copy the link from the Share button on the video.",
      };
    }
    return {
      ok: true,
      video: {
        source: "YOUTUBE",
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: youtubeEmbedUrl(videoId),
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      },
    };
  }

  if (url.protocol !== "https:") {
    return { ok: false, error: "Video links must use https://." };
  }

  const pathname = url.pathname.toLowerCase();
  if (DIRECT_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return { ok: true, video: { source: "DIRECT", url: url.toString() } };
  }

  return {
    ok: false,
    error: "Paste a YouTube link or a direct link to a video file (.mp4, .webm, .mov).",
  };
}

/** Privacy-enhanced YouTube embed URL; autoplay variant for tap-to-play. */
export function youtubeEmbedUrl(videoId: string, opts?: { autoplay?: boolean }): string {
  const base = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
  return opts?.autoplay ? `${base}&autoplay=1&mute=1` : base;
}

/**
 * True when a URL points at the UploadThing CDN. The upload save
 * action uses this so a client can't smuggle an arbitrary URL in
 * as a hosted "upload" (and bypass the paid-plan gate).
 */
export function isUploadThingUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:") return false;
    return url.hostname === "utfs.io" || url.hostname.endsWith(".ufs.sh");
  } catch {
    return false;
  }
}
