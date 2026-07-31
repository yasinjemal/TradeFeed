import sharp from "sharp";

import {
  HUNT_MAX_IMAGE_BYTES,
  detectHuntImageMime,
} from "@/lib/validation/hunt";

const HUNT_PUBLIC_IMAGE_MAX_DIMENSION = 1_600;
const HUNT_PUBLIC_IMAGE_MAX_INPUT_PIXELS = 25_000_000;
const HUNT_WEBP_QUALITIES = [82, 72, 62] as const;

export class HuntImageProcessingError extends Error {
  constructor(message = "The image could not be made safe for public use.") {
    super(message);
    this.name = "HuntImageProcessingError";
  }
}

/**
 * Decode and rebuild a public HUNT image before either AI review or upload.
 * Sharp does not preserve EXIF/XMP/IPTC metadata unless explicitly requested,
 * so the rebuilt WebP cannot carry source GPS, device data or thumbnails.
 */
export async function sanitizeHuntPublicImage(
  input: Uint8Array,
): Promise<{
  bytes: Uint8Array;
  mime: "image/webp";
  extension: "webp";
}> {
  const source = Buffer.from(input);

  try {
    for (const quality of HUNT_WEBP_QUALITIES) {
      const output = await sharp(source, {
        failOn: "warning",
        limitInputPixels: HUNT_PUBLIC_IMAGE_MAX_INPUT_PIXELS,
      })
        .rotate()
        .resize({
          width: HUNT_PUBLIC_IMAGE_MAX_DIMENSION,
          height: HUNT_PUBLIC_IMAGE_MAX_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality,
          effort: 4,
          smartSubsample: true,
        })
        .toBuffer();

      if (
        output.byteLength <= HUNT_MAX_IMAGE_BYTES &&
        detectHuntImageMime(output) === "image/webp"
      ) {
        return {
          bytes: Uint8Array.from(output),
          mime: "image/webp",
          extension: "webp",
        };
      }
    }
  } catch {
    throw new HuntImageProcessingError();
  }

  throw new HuntImageProcessingError(
    "The safely rebuilt image is still too large.",
  );
}
