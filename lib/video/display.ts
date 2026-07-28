// ============================================================
// Video display mapping — DB row → buyer-facing shapes.
// Pure: derives the tap-to-play embed URL for YouTube rows from
// the stored canonical watch URL.
// ============================================================

import { parseVideoUrl, youtubeEmbedUrl } from "./parse";

export interface ProductVideoRow {
  id: string;
  url: string;
  source: "UPLOAD" | "YOUTUBE" | "DIRECT";
  thumbnailUrl: string | null;
}

export interface GalleryVideoShape {
  id: string;
  kind: "upload" | "direct" | "youtube";
  url: string;
  embedUrl?: string;
  thumbnailUrl?: string | null;
}

const KIND_BY_SOURCE = {
  UPLOAD: "upload",
  DIRECT: "direct",
  YOUTUBE: "youtube",
} as const;

/** Map a ProductVideo row to the gallery's display shape. */
export function toGalleryVideo(row: ProductVideoRow | null | undefined): GalleryVideoShape | null {
  if (!row) return null;

  const base: GalleryVideoShape = {
    id: row.id,
    kind: KIND_BY_SOURCE[row.source],
    url: row.url,
    thumbnailUrl: row.thumbnailUrl,
  };

  if (row.source === "YOUTUBE") {
    // Stored URL is the canonical watch URL — re-derive the id for the
    // tap-to-play embed. Rows written by the actions always parse; a
    // malformed legacy row just falls back to no embed (thumbnail link).
    const parsed = parseVideoUrl(row.url);
    if (parsed.ok && parsed.video.source === "YOUTUBE") {
      base.embedUrl = youtubeEmbedUrl(parsed.video.videoId, { autoplay: true });
      base.thumbnailUrl = row.thumbnailUrl ?? parsed.video.thumbnailUrl;
    }
  }

  return base;
}
