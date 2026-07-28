import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  addVideoLinkSchema,
  saveVideoUploadSchema,
  MAX_VIDEOS_PER_PRODUCT,
} from "../lib/validation/video";

describe("video validation schemas", () => {
  test("v1 caps at one video per product", () => {
    assert.equal(MAX_VIDEOS_PER_PRODUCT, 1);
  });

  test("addVideoLinkSchema trims and accepts a URL-ish string", () => {
    const r = addVideoLinkSchema.safeParse({ url: "  https://youtu.be/dQw4w9WgXcQ " });
    assert.equal(r.success, true);
    if (r.success) assert.equal(r.data.url, "https://youtu.be/dQw4w9WgXcQ");
  });

  test("addVideoLinkSchema rejects empty and oversized input", () => {
    assert.equal(addVideoLinkSchema.safeParse({ url: "   " }).success, false);
    assert.equal(addVideoLinkSchema.safeParse({ url: "x".repeat(2049) }).success, false);
  });

  test("saveVideoUploadSchema requires url/key/name", () => {
    const good = saveVideoUploadSchema.safeParse({
      url: "https://utfs.io/f/abc123",
      key: "abc123",
      name: "demo.mp4",
    });
    assert.equal(good.success, true);

    assert.equal(
      saveVideoUploadSchema.safeParse({ url: "not-a-url", key: "abc", name: "x" }).success,
      false,
    );
    assert.equal(
      saveVideoUploadSchema.safeParse({ url: "https://utfs.io/f/a", key: "", name: "x" }).success,
      false,
    );
  });
});
