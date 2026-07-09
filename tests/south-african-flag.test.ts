import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("marketplace uses the shared South African flag mark", () => {
  const marketplace = readFileSync("components/tf/marketplace/tf-marketplace-shell.tsx", "utf8");
  const flag = readFileSync("components/ui/south-african-flag.tsx", "utf8");

  assert.match(marketplace, /SouthAfricanFlag/);
  assert.match(flag, /#E03C31/);
  assert.match(flag, /#001489/);
  assert.match(flag, /#FFB81C/);
  assert.match(flag, /#007749/);
});
