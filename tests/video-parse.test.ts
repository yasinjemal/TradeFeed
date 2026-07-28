import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { parseVideoUrl, youtubeEmbedUrl, isUploadThingUrl } from "../lib/video/parse";

const ID = "dQw4w9WgXcQ";

function expectYouTube(raw: string, videoId = ID) {
  const result = parseVideoUrl(raw);
  assert.equal(result.ok, true, `expected ok for ${raw}: ${!result.ok ? result.error : ""}`);
  if (!result.ok) return;
  assert.equal(result.video.source, "YOUTUBE");
  if (result.video.source !== "YOUTUBE") return;
  assert.equal(result.video.videoId, videoId);
  assert.equal(result.video.url, `https://www.youtube.com/watch?v=${videoId}`);
  assert.equal(
    result.video.embedUrl,
    `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`,
  );
  assert.equal(result.video.thumbnailUrl, `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
}

describe("parseVideoUrl — YouTube", () => {
  test("standard watch URL", () => expectYouTube(`https://www.youtube.com/watch?v=${ID}`));
  test("watch URL with timestamp and playlist params", () =>
    expectYouTube(`https://www.youtube.com/watch?v=${ID}&t=42s&list=PLx`));
  test("youtu.be short link", () => expectYouTube(`https://youtu.be/${ID}`));
  test("youtu.be with query params", () => expectYouTube(`https://youtu.be/${ID}?si=share123`));
  test("Shorts link", () => expectYouTube(`https://www.youtube.com/shorts/${ID}`));
  test("embed link", () => expectYouTube(`https://www.youtube.com/embed/${ID}`));
  test("live link", () => expectYouTube(`https://www.youtube.com/live/${ID}`));
  test("mobile m.youtube.com", () => expectYouTube(`https://m.youtube.com/watch?v=${ID}`));
  test("nocookie embed", () => expectYouTube(`https://www.youtube-nocookie.com/embed/${ID}`));
  test("http is normalized to https canonical", () =>
    expectYouTube(`http://youtube.com/watch?v=${ID}`));
  test("ID with dash and underscore", () => expectYouTube("https://youtu.be/a-b_c-d_e-f", "a-b_c-d_e-f"));
  test("whitespace-padded input", () => expectYouTube(`  https://youtu.be/${ID}  `));

  test("10-char ID rejected", () => {
    const r = parseVideoUrl("https://youtu.be/shortid123");
    assert.equal(r.ok, false);
  });
  test("watch URL without v param rejected", () => {
    const r = parseVideoUrl("https://www.youtube.com/watch?list=PLx");
    assert.equal(r.ok, false);
  });
  test("channel URL rejected", () => {
    const r = parseVideoUrl("https://www.youtube.com/@somechannel");
    assert.equal(r.ok, false);
  });
});

describe("parseVideoUrl — direct file links", () => {
  test("https .mp4", () => {
    const r = parseVideoUrl("https://cdn.example.com/videos/demo.mp4");
    assert.deepEqual(r, {
      ok: true,
      video: { source: "DIRECT", url: "https://cdn.example.com/videos/demo.mp4" },
    });
  });
  test(".webm", () => {
    const r = parseVideoUrl("https://example.com/clip.webm");
    assert.equal(r.ok && r.video.source === "DIRECT", true);
  });
  test("uppercase .MOV", () => {
    const r = parseVideoUrl("https://example.com/CLIP.MOV");
    assert.equal(r.ok && r.video.source === "DIRECT", true);
  });
  test(".m4v with query string", () => {
    const r = parseVideoUrl("https://example.com/v/clip.m4v?token=abc&x=1");
    assert.equal(r.ok && r.video.source === "DIRECT", true);
  });
  test("http .mp4 rejected (https only)", () => {
    const r = parseVideoUrl("http://example.com/demo.mp4");
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.error, /https/);
  });
  test("extension in query but not pathname rejected", () => {
    const r = parseVideoUrl("https://example.com/page?file=demo.mp4");
    assert.equal(r.ok, false);
  });
});

describe("parseVideoUrl — rejections", () => {
  test("empty string", () => {
    const r = parseVideoUrl("");
    assert.equal(r.ok, false);
  });
  test("not a URL", () => {
    const r = parseVideoUrl("my cool video");
    assert.equal(r.ok, false);
  });
  test("javascript: scheme rejected", () => {
    const r = parseVideoUrl("javascript:alert(1)");
    assert.equal(r.ok, false);
  });
  test("plain webpage URL rejected with guidance", () => {
    const r = parseVideoUrl("https://example.com/products/nice-shoes");
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.error, /YouTube|video file/);
  });
  test("vimeo rejected with helpful message", () => {
    const r = parseVideoUrl("https://vimeo.com/123456789");
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.error, /YouTube/);
  });
  test("tiktok rejected", () => {
    const r = parseVideoUrl("https://www.tiktok.com/@user/video/123");
    assert.equal(r.ok, false);
  });
});

describe("youtubeEmbedUrl", () => {
  test("no autoplay by default", () => {
    assert.equal(
      youtubeEmbedUrl(ID),
      `https://www.youtube-nocookie.com/embed/${ID}?rel=0&modestbranding=1&playsinline=1`,
    );
  });
  test("autoplay adds muted autoplay params", () => {
    assert.equal(
      youtubeEmbedUrl(ID, { autoplay: true }),
      `https://www.youtube-nocookie.com/embed/${ID}?rel=0&modestbranding=1&playsinline=1&autoplay=1&mute=1`,
    );
  });
});

describe("isUploadThingUrl", () => {
  test("utfs.io accepted", () => {
    assert.equal(isUploadThingUrl("https://utfs.io/f/abc123"), true);
  });
  test("*.ufs.sh accepted", () => {
    assert.equal(isUploadThingUrl("https://x1abc.ufs.sh/f/abc123"), true);
  });
  test("lookalike host rejected", () => {
    assert.equal(isUploadThingUrl("https://evil-utfs.io/f/abc"), false);
    assert.equal(isUploadThingUrl("https://utfs.io.evil.com/f/abc"), false);
    assert.equal(isUploadThingUrl("https://ufs.sh/f/abc"), false);
  });
  test("http rejected", () => {
    assert.equal(isUploadThingUrl("http://utfs.io/f/abc"), false);
  });
  test("garbage rejected", () => {
    assert.equal(isUploadThingUrl("not a url"), false);
  });
});
