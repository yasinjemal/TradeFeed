import {getMarketplaceProducts} from "@/lib/db/marketplace";
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { MARKETPLACE_ELIGIBILITY, marketplaceContentStandard } from "@/lib/marketplace/eligibility";
import {createReview,deleteReview} from "@/lib/db/reviews";
import { db } from "@/lib/db";
import {
  createOrder,
  confirmCodPayment,
  type CreateOrderInput,
} from "@/lib/db/orders";
import {
  transitionOrder,
  recordOrderPayment,
  expireOrderReservations,
} from "@/lib/orders/lifecycle";
const enabled = process.env.RUN_DATABASE_TESTS === "true";
test("real PostgreSQL commerce lifecycle", { skip: !enabled }, async (t) => {
  const url = new URL(process.env.DATABASE_URL!);
  assert.ok(
    ["localhost", "127.0.0.1"].includes(url.hostname) &&
      /test|quality/.test(url.pathname),
    "Integration tests require a local test database",
  );
  const shop = await db.shop.create({
    data: {
      name: "Lifecycle fixture",
      slug: "lifecycle-" + randomUUID(),
      whatsappNumber: "27820000000",
      codEnabled: true,
    },
  });
  t.after(async () => {
    await db.review.deleteMany({where:{shopId:shop.id}});
    await db.shop.delete({ where: { id: shop.id } });
    await db.$disconnect();
  });
  const product = await db.product.create({
    data: {
      shopId: shop.id,
      name: "Fixture sneakers",
      minPriceCents: 10000,
      variants: { create: { size: "M", priceInCents: 10000, stock: 10 } },
    },
    include: { variants: true },
  });
  const variant = product.variants[0]!;
  const input = (extra: Partial<CreateOrderInput> = {}): CreateOrderInput => ({
    shopId: shop.id,
    shopSlug: shop.slug,
    checkoutKey: randomUUID(),
    items: [
      {
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        option1Label: "Size",
        option1Value: "M",
        option2Label: "Colour",
        option2Value: null,
        priceInCents: 1,
        quantity: 2,
        orderType: "retail",
      },
    ],
    paymentMethod: "MANUAL",
    shippingMethod: "COLLECTION",
    ...extra,
  });
  const stock = async () =>
    (await db.productVariant.findUniqueOrThrow({ where: { id: variant.id } }))
      .stock;
  await t.test(
    "duplicate checkout reserves once and uses authoritative price",
    async () => {
      const payload = input();
      const results = await Promise.all([
        createOrder(payload),
        createOrder(payload),
      ]);
      for (const r of results) assert.ok(r.success);
      if (!results[0]!.success || !results[1]!.success)
        throw new Error("Checkout failed");
      assert.equal(results[0].order.id, results[1].order.id);
      assert.equal(results[0].order.totalCents, 20000);
      assert.equal(await stock(), 8);
      const changed = await createOrder({
        ...payload,
        buyerName: "Changed payload",
      });
      assert.equal(changed.success, false);
      const order = results[0].order;
      const cancelled = await Promise.allSettled([
        transitionOrder({
          orderId: order.id,
          shopId: shop.id,
          status: "CANCELLED",
        }),
        transitionOrder({
          orderId: order.id,
          shopId: shop.id,
          status: "CANCELLED",
        }),
      ]);
      assert.equal(cancelled.filter((r) => r.status === "fulfilled").length, 1);
      assert.equal(await stock(), 10);
      const late = await recordOrderPayment(order.id);
      assert.equal(late.reviewRequired, true);
      assert.equal(late.order.status, "CANCELLED");
      assert.equal(await stock(), 10);
      assert.equal((await recordOrderPayment(order.id)).duplicate, true);
    },
  );
  await t.test(
    "expiry releases new reservations, never legacy stock",
    async () => {
      const r = await createOrder(input());
      assert.ok(r.success);
      if (!r.success) return;
      await db.order.update({
        where: { id: r.order.id },
        data: { reservationExpiresAt: new Date(0) },
      });
      await expireOrderReservations();
      assert.equal(await stock(), 10);
      const legacy = await db.order.create({
        data: {
          shopId: shop.id,
          orderNumber: "legacy-" + randomUUID(),
          totalCents: 100,
          itemCount: 2,
          items: {
            create: {
              productId: product.id,
              variantId: variant.id,
              productName: product.name,
              option1Value: "M",
              quantity: 2,
              priceInCents: 50,
            },
          },
        },
      });
      await transitionOrder({
        orderId: legacy.id,
        shopId: shop.id,
        status: "CANCELLED",
      });
      assert.equal(await stock(), 10);
    },
  );
  await t.test(
    "oversell race allows only one order and rejects unsupported services",
    async () => {
      await db.productVariant.update({
        where: { id: variant.id },
        data: { stock: 2 },
      });
      const results = await Promise.all([
        createOrder(input()),
        createOrder(input()),
      ]);
      assert.equal(results.filter((r) => r.success).length, 1);
      assert.equal(await stock(), 0);
      await db.productVariant.update({
        where: { id: variant.id },
        data: { stock: 10 },
      });
      assert.equal(
        (await createOrder(input({ paymentMethod: "PAYFAST" }))).success,
        false,
      );
      assert.equal(
        (await createOrder(input({ shippingMethod: "PLATFORM_COURIER" })))
          .success,
        false,
      );
    },
  );
  await t.test(
    "tenant scope, paid cancellation and COD state checks",
    async () => {
      const r = await createOrder(input({ paymentMethod: "COD" }));
      assert.ok(r.success);
      if (!r.success) return;
      await assert.rejects(
        transitionOrder({
          orderId: r.order.id,
          shopId: "another-shop",
          status: "CANCELLED",
        }),
      );
      await assert.rejects(confirmCodPayment(r.order.id, shop.id));
      await transitionOrder({
        orderId: r.order.id,
        shopId: shop.id,
        status: "CONFIRMED",
      });
      await transitionOrder({
        orderId: r.order.id,
        shopId: shop.id,
        status: "SHIPPED",
      });
      await confirmCodPayment(r.order.id, shop.id);
      const paid = await db.order.findUniqueOrThrow({
        where: { id: r.order.id },
      });
      assert.equal(paid.status, "DELIVERED");
      assert.ok(paid.deliveredAt);
      await assert.rejects(
        transitionOrder({
          orderId: r.order.id,
          shopId: shop.id,
          status: "CANCELLED",
        }),
      );
    },
  );
  await t.test("new listing standards and grandfathered repair window", async()=>{
    await db.product.update({where:{id:product.id},data:{images:{create:{url:"/landing/demo-sneakers.webp",position:3}}}});
    const eligible=()=>db.product.count({where:{id:product.id,AND:[MARKETPLACE_ELIGIBILITY,marketplaceContentStandard()]}});
    assert.equal(await eligible(),0);
    await db.product.update({where:{id:product.id},data:{discoveryGraceUntil:new Date(Date.now()+86400000)}});
    assert.equal(await eligible(),1);
    const results=await getMarketplaceProducts({search:product.name});
    assert.equal(results.products.find(p=>p.id===product.id)?.imageUrl,"/landing/demo-sneakers.webp");
    await db.product.update({where:{id:product.id},data:{discoveryGraceUntil:new Date(0)}});
    assert.equal(await eligible(),0);
  });
  await t.test("unverified reviews queue for moderation and seller reports preserve published feedback",async()=>{
    const review=await createReview({shopId:shop.id,productId:product.id,rating:1,buyerName:"Fixture reviewer",comment:"An honest negative test review."});assert.equal(review.isApproved,false);
    await db.review.update({where:{id:review.id},data:{isApproved:true}});
    await deleteReview(review.id,shop.id);
    const kept=await db.review.findUniqueOrThrow({where:{id:review.id}});assert.equal(kept.isApproved,true);assert.ok(kept.reportedAt);
  });

});
