import test from "node:test";
import assert from "node:assert/strict";

import { parseOrderMessageBody } from "@/lib/messages/order-message-validation";

test("accepts and trims a normal order message", () => {
  const parsed = parseOrderMessageBody("  Can I collect this afternoon?  ");
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data, "Can I collect this afternoon?");
});

test("rejects empty order messages", () => {
  assert.equal(parseOrderMessageBody("   ").success, false);
});

test("rejects order messages longer than 1,500 characters", () => {
  assert.equal(parseOrderMessageBody("a".repeat(1501)).success, false);
});

test("allows line breaks but rejects hidden control characters", () => {
  assert.equal(parseOrderMessageBody("Line one\nLine two").success, true);
  assert.equal(parseOrderMessageBody("Hello\u0000there").success, false);
});
