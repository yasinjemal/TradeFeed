// ============================================================
// Client-side image compression before upload
// ============================================================
// Sellers shoot on phone cameras (4–12MB) and pay for mobile
// data by the megabyte. Everything is resized to 1200px wide
// JPEG at 0.85 quality before it leaves the device.
//
// Browser-only (uses Image + canvas). If the photo cannot be
// decoded or re-encoded, the original file is returned so the
// upload can still be attempted.
// ============================================================

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 0.85;

export function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    const finish = (result: File) => {
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        finish(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            finish(file);
            return;
          }
          const name = file.name.replace(/\.[^/.]+$/, "") || "product-photo";
          finish(new File([blob], `${name}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };
    img.onerror = () => finish(file);
    img.src = objectUrl;
  });
}
