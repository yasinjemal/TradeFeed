import test from "node:test";
import assert from "node:assert/strict";
import { createProductAction, updateProductAction } from "@/app/actions/product";

function buildBaseDeps() {
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
  };
}

test("createProductAction returns access denied when auth boundary fails", async () => {
  const deps = buildBaseDeps();
  deps.requireShopAccess = async () => null;

  const form = new FormData();
  form.set("name", "Product Name");

  const result = await createProductAction("shop-slug", null, form, deps as never);
  assert.equal(result.success, false);
  assert.equal(result.error, "Shop not found or access denied.");
});

test("createProductAction enforces product limit before creation", async () => {
  const deps = buildBaseDeps();
  deps.checkProductLimit = async () => ({ allowed: false, current: 10, limit: 10 });

  const form = new FormData();
  form.set("name", "Product Name");

  const result = await createProductAction("shop-slug", null, form, deps as never);
  assert.equal(result.success, false);
  assert.match(result.error ?? "", /Product limit reached/);
});

test("updateProductAction returns not found when data layer does not find product", async () => {
  const deps = buildBaseDeps();
  deps.updateProduct = async () => null;

  const form = new FormData();
  form.set("name", "Updated Name");
  form.set("isActive", "on");

  const result = await updateProductAction("shop-slug", "prod_404", null, form, deps as never);
  assert.equal(result.success, false);
  assert.equal(result.error, "Product not found.");
});
