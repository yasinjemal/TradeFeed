import test from "node:test";
import assert from "node:assert/strict";
import {
  createProductAction,
  updateProductAction,
  type ProductActionDeps,
} from "@/app/actions/product";

function buildBaseDeps(): ProductActionDeps {
  return {
    requireShopAccess: async () => ({ shopId: "shop_1", userId: "user_1", role: "OWNER" }),
    createProduct: async () => ({ id: "prod_1" }),
    updateProduct: async () => ({ id: "prod_1" }),
    deleteProduct: async () => ({ id: "prod_1" }),
    createVariant: async () => ({ id: "var_1" }),
    deleteVariant: async () => ({ id: "var_1" }),
    batchCreateVariants: async () => ({ count: 1 }),
    revalidatePath: () => {},
    redirect: () => {},
    checkProductLimit: async () => ({ allowed: true, current: 1, limit: 10 }),
    countActiveProducts: async () => 0,
    addProductImage: async () => ({ id: "img_1", url: "https://utfs.io/f/abc123" }),
    afterProductCreated: async () => {},
  } as unknown as ProductActionDeps;
}

// ── Recording deps: every write the action makes, in order ──────────

type Call = { fn: string; args: unknown[] };

function buildRecordingDeps(overrides: Partial<Record<keyof ProductActionDeps, unknown>> = {}) {
  const calls: Call[] = [];
  const record =
    <T>(fn: string, result: T) =>
    async (...args: unknown[]) => {
      calls.push({ fn, args });
      return result;
    };

  const deps = {
    ...buildBaseDeps(),
    createProduct: record("createProduct", { id: "prod_1" }),
    updateProduct: record("updateProduct", { id: "prod_1" }),
    createVariant: record("createVariant", { id: "var_1" }),
    batchCreateVariants: async (...args: unknown[]) => {
      calls.push({ fn: "batchCreateVariants", args });
      return { count: (args[2] as unknown[]).length };
    },
    addProductImage: record("addProductImage", { id: "img_1", url: "https://utfs.io/f/abc123" }),
    afterProductCreated: record("afterProductCreated", undefined),
    revalidatePath: (...args: unknown[]) => {
      calls.push({ fn: "revalidatePath", args });
    },
    ...overrides,
  } as unknown as ProductActionDeps;

  const callsTo = (fn: string) => calls.filter((call) => call.fn === fn);
  return { deps, calls, callsTo };
}

const PHOTO = {
  imageUrl: "https://utfs.io/f/abc123",
  imageKey: "abc123",
  imageName: "red-hoodie.jpg",
};

function listingForm(fields: Record<string, string> = {}): FormData {
  const form = new FormData();
  form.set("name", "Red Fleece Hoodie");
  form.set("isActive", "on");
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return form;
}

test("createProductAction returns access denied when auth boundary fails", async () => {
  const deps = buildBaseDeps();
  deps.requireShopAccess = async () => null;

  const form = new FormData();
  form.set("name", "Product Name");

  const result = await createProductAction("shop-slug", null, form, deps);
  assert.equal(result.success, false);
  assert.equal(result.error, "Shop not found or access denied.");
});

test("createProductAction enforces product limit before creation", async () => {
  const { deps, callsTo } = buildRecordingDeps({
    checkProductLimit: async () => ({ allowed: false, current: 10, limit: 10 }),
  });

  const result = await createProductAction("shop-slug", null, listingForm({ priceInRands: "150" }), deps);
  assert.equal(result.success, false);
  assert.match(result.error ?? "", /Product limit reached/);
  assert.equal(callsTo("createProduct").length, 0);
});

// ── Missing price: a draft, and the result says so ──────────────────

test("createProductAction saves a draft and says so when there is no price", async () => {
  const { deps, callsTo } = buildRecordingDeps();

  const result = await createProductAction("shop-slug", null, listingForm(), deps);

  assert.equal(result.success, true);
  assert.equal(result.productId, "prod_1");
  assert.equal(result.status, "draft");
  assert.equal(result.draftReason, "missing_price");
  assert.equal(result.variantCount, 0);
  assert.equal(result.isFirstProduct, false, "a hidden draft is not a first live product");
  assert.match(result.warning ?? "", /saved as a draft/);

  // The product is created hidden and never published.
  const [created] = callsTo("createProduct");
  assert.equal((created!.args[0] as { isActive: boolean }).isActive, false);
  assert.equal(callsTo("updateProduct").length, 0);
  assert.equal(callsTo("createVariant").length, 0);
  assert.equal(callsTo("batchCreateVariants").length, 0);
  // The public catalogue did not change, so it is not revalidated.
  assert.deepEqual(
    callsTo("revalidatePath").map((call) => call.args[0]),
    ["/dashboard/shop-slug/products"],
  );
});

test("createProductAction treats a whitespace-only price as missing", async () => {
  const { deps } = buildRecordingDeps();

  const result = await createProductAction("shop-slug", null, listingForm({ priceInRands: "   " }), deps);

  assert.equal(result.status, "draft");
  assert.equal(result.draftReason, "missing_price");
});

test("createProductAction still attaches the photo to a draft with no price", async () => {
  const { deps, callsTo } = buildRecordingDeps();

  const result = await createProductAction("shop-slug", null, listingForm(PHOTO), deps);

  assert.equal(result.status, "draft");
  assert.equal(result.photo, "attached");
  assert.equal(callsTo("addProductImage").length, 1);
});

// ── A price that cannot be saved is a form error, not a product ─────

for (const badPrice of ["0", "-5", "abc", "12abc", "1000000"]) {
  test(`createProductAction rejects the price "${badPrice}" without creating anything`, async () => {
    const { deps, callsTo } = buildRecordingDeps();

    const result = await createProductAction("shop-slug", null, listingForm({ priceInRands: badPrice }), deps);

    assert.equal(result.success, false);
    assert.ok(result.fieldErrors?.priceInRands?.[0], "the price field carries the error");
    assert.equal(result.status, undefined);
    assert.equal(callsTo("createProduct").length, 0);
    assert.equal(callsTo("addProductImage").length, 0);
  });
}

// ── Priced listing: live, with the photo, in the right order ────────

test("createProductAction publishes a priced listing and reports it live", async () => {
  const { deps, calls, callsTo } = buildRecordingDeps();

  const result = await createProductAction(
    "shop-slug",
    null,
    listingForm({ priceInRands: "149.99", stock: "7", ...PHOTO }),
    deps,
  );

  assert.equal(result.success, true);
  assert.equal(result.status, "live");
  assert.equal(result.draftReason, undefined);
  assert.equal(result.warning, undefined);
  assert.equal(result.photo, "attached");
  assert.equal(result.imageId, "img_1");
  assert.equal(result.variantCount, 1);
  assert.equal(result.isFirstProduct, true);

  // One default option at the typed price (in cents) and stock.
  const [variant] = callsTo("createVariant");
  assert.deepEqual(variant!.args.slice(0, 2), ["prod_1", "shop_1"]);
  assert.deepEqual(variant!.args[2], {
    size: "Default",
    priceInRands: 14999,
    retailPriceInRands: undefined,
    stock: 7,
  });

  // Hidden first, then price + photo, and only then published.
  const order = calls
    .map((call) => call.fn)
    .filter((fn) => ["createProduct", "createVariant", "addProductImage", "updateProduct"].includes(fn));
  assert.deepEqual(order, ["createProduct", "createVariant", "addProductImage", "updateProduct"]);
  assert.equal((callsTo("createProduct")[0]!.args[0] as { isActive: boolean }).isActive, false);
  assert.deepEqual(callsTo("updateProduct")[0]!.args, ["prod_1", "shop_1", { isActive: true }]);

  assert.deepEqual(
    callsTo("revalidatePath").map((call) => call.args[0]),
    ["/dashboard/shop-slug/products", "/catalog/shop-slug"],
  );
  assert.equal(
    (callsTo("afterProductCreated")[0]!.args[0] as { status: string }).status,
    "live",
  );
});

test("createProductAction defaults blank stock to 1 so a new listing is not sold out", async () => {
  const { deps, callsTo } = buildRecordingDeps();

  await createProductAction("shop-slug", null, listingForm({ priceInRands: "80", stock: "" }), deps);

  assert.equal((callsTo("createVariant")[0]!.args[2] as { stock: number }).stock, 1);
});

test("createProductAction is not the first product when the shop already has live ones", async () => {
  const { deps } = buildRecordingDeps({ countActiveProducts: async () => 4 });

  const result = await createProductAction("shop-slug", null, listingForm({ priceInRands: "80" }), deps);

  assert.equal(result.status, "live");
  assert.equal(result.isFirstProduct, false);
});

// ── The photo is always attached, whichever path was used ───────────

test("createProductAction attaches the chosen photo when the listing was typed by hand", async () => {
  const { deps, callsTo } = buildRecordingDeps();

  // No aiGenerated flag: the seller typed everything themselves.
  const result = await createProductAction(
    "shop-slug",
    null,
    listingForm({ priceInRands: "200", ...PHOTO }),
    deps,
  );

  assert.equal(result.photo, "attached");
  assert.deepEqual(callsTo("addProductImage")[0]!.args, [
    "prod_1",
    "shop_1",
    { url: PHOTO.imageUrl, key: PHOTO.imageKey, name: PHOTO.imageName },
  ]);
  assert.equal((callsTo("createProduct")[0]!.args[0] as { aiGenerated: boolean }).aiGenerated, false);
});

test("createProductAction attaches the chosen photo when AI wrote the listing", async () => {
  const { deps, callsTo } = buildRecordingDeps();

  const result = await createProductAction(
    "shop-slug",
    null,
    listingForm({ priceInRands: "200", aiGenerated: "on", ...PHOTO }),
    deps,
  );

  assert.equal(result.photo, "attached");
  assert.equal(callsTo("addProductImage").length, 1);
  assert.equal((callsTo("createProduct")[0]!.args[0] as { aiGenerated: boolean }).aiGenerated, true);
});

test("createProductAction reports no photo when none was chosen", async () => {
  const { deps, callsTo } = buildRecordingDeps();

  const result = await createProductAction("shop-slug", null, listingForm({ priceInRands: "200" }), deps);

  assert.equal(result.status, "live");
  assert.equal(result.photo, "none");
  assert.equal(result.imageId, undefined);
  assert.equal(callsTo("addProductImage").length, 0);
});

test("createProductAction says the photo failed instead of pretending it attached", async () => {
  const { deps } = buildRecordingDeps({
    addProductImage: async () => {
      throw new Error("db down");
    },
  });

  const result = await createProductAction(
    "shop-slug",
    null,
    listingForm({ priceInRands: "200", ...PHOTO }),
    deps,
  );

  // The listing is still orderable, so it is live — but the photo is not on it.
  assert.equal(result.success, true);
  assert.equal(result.status, "live");
  assert.equal(result.photo, "failed");
  assert.equal(result.imageId, undefined);
});

test("createProductAction refuses a photo that is not on our CDN", async () => {
  const { deps, callsTo } = buildRecordingDeps();

  const result = await createProductAction(
    "shop-slug",
    null,
    listingForm({
      priceInRands: "200",
      imageUrl: "https://evil.example.com/tracker.gif",
      imageKey: "x",
      imageName: "x.gif",
    }),
    deps,
  );

  assert.equal(result.success, false);
  assert.ok(result.fieldErrors?.photo?.[0]);
  assert.equal(callsTo("createProduct").length, 0);
  assert.equal(callsTo("addProductImage").length, 0);
});

// ── Real sizes instead of a single "Default" option ─────────────────

test("createProductAction creates one option per size, each with its own stock", async () => {
  const { deps, callsTo } = buildRecordingDeps();

  const result = await createProductAction(
    "shop-slug",
    null,
    listingForm({
      priceInRands: "299",
      stock: "50", // ignored once real sizes exist
      sizes: JSON.stringify([
        { size: "S", stock: "3" },
        { size: " M ", stock: "" },
        { size: "s", stock: "9" }, // duplicate of S
        { size: "XL", stock: 0 },
      ]),
    }),
    deps,
  );

  assert.equal(result.status, "live");
  assert.equal(result.variantCount, 3);
  assert.equal(callsTo("createVariant").length, 0, "no placeholder Default option");

  const [batch] = callsTo("batchCreateVariants");
  assert.deepEqual(batch!.args.slice(0, 2), ["prod_1", "shop_1"]);
  assert.deepEqual(batch!.args[2], [
    { size: "S", color: null, priceInCents: 29900, stock: 3 },
    { size: "M", color: null, priceInCents: 29900, stock: 1 },
    { size: "XL", color: null, priceInCents: 29900, stock: 0 },
  ]);
});

test("createProductAction rejects unreadable sizes without creating anything", async () => {
  const { deps, callsTo } = buildRecordingDeps();

  const result = await createProductAction(
    "shop-slug",
    null,
    listingForm({ priceInRands: "299", sizes: "not json" }),
    deps,
  );

  assert.equal(result.success, false);
  assert.ok(result.fieldErrors?.sizes?.[0]);
  assert.equal(callsTo("createProduct").length, 0);
});

// ── Draft for honest reasons other than a missing price ─────────────

test("createProductAction keeps a priced listing as a draft when the seller hides it", async () => {
  const { deps, callsTo } = buildRecordingDeps();

  const form = listingForm({ priceInRands: "120", ...PHOTO });
  form.delete("isActive");
  const result = await createProductAction("shop-slug", null, form, deps);

  assert.equal(result.status, "draft");
  assert.equal(result.draftReason, "hidden_by_seller");
  assert.equal(result.variantCount, 1, "the price is saved, ready for when they publish");
  assert.equal(result.photo, "attached");
  assert.equal(result.warning, undefined);
  assert.equal(callsTo("updateProduct").length, 0);
});

test("createProductAction does not go live when the price fails to save", async () => {
  const { deps, callsTo } = buildRecordingDeps({
    createVariant: async () => {
      throw new Error("db down");
    },
  });

  const result = await createProductAction(
    "shop-slug",
    null,
    listingForm({ priceInRands: "120", ...PHOTO }),
    deps,
  );

  assert.equal(result.success, true);
  assert.equal(result.status, "draft");
  assert.equal(result.draftReason, "publish_failed");
  assert.equal(result.variantCount, 0);
  assert.equal(result.isFirstProduct, false);
  assert.equal(callsTo("updateProduct").length, 0, "never published without a price");
  assert.equal(result.photo, "attached", "the photo is kept on the draft");
});

test("createProductAction reports a draft when the publish step itself fails", async () => {
  const { deps } = buildRecordingDeps({ updateProduct: async () => null });

  const result = await createProductAction("shop-slug", null, listingForm({ priceInRands: "120" }), deps);

  assert.equal(result.success, true);
  assert.equal(result.status, "draft");
  assert.equal(result.draftReason, "publish_failed");
  assert.equal(result.variantCount, 1);
});

test("createProductAction result is unaffected by failing side effects", async () => {
  const { deps } = buildRecordingDeps({
    afterProductCreated: async () => {
      throw new Error("activity log down");
    },
  });

  const result = await createProductAction("shop-slug", null, listingForm({ priceInRands: "120" }), deps);

  assert.equal(result.success, true);
  assert.equal(result.status, "live");
});

test("updateProductAction returns not found when data layer does not find product", async () => {
  const deps = buildBaseDeps();
  deps.updateProduct = async () => null;

  const form = new FormData();
  form.set("name", "Updated Name");
  form.set("description", "");
  form.set("isActive", "on");

  const result = await updateProductAction("shop-slug", "prod_404", null, form, deps);
  assert.equal(result.success, false);
  assert.equal(result.error, "Product not found.");
});
