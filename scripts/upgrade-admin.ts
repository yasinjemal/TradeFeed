import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  // Find admin user
  const adminClerkId = "user_3A5dCNudyttCoQRoQNA4QmOFpHd";
  const user = await db.user.findUnique({ where: { clerkId: adminClerkId } });
  if (!user) { console.log("Admin user not found"); return; }

  const memberships = await db.shopUser.findMany({
    where: { userId: user.id },
    include: { shop: { include: { subscription: { include: { plan: true } } } } },
  });

  for (const m of memberships) {
    console.log(`Shop: ${m.shop.slug} | Plan: ${m.shop.subscription?.plan.slug ?? "none"} | ShopID: ${m.shop.id}`);
  }

  // Upgrade all admin shops to pro-ai
  const proAiPlan = await db.plan.findUnique({ where: { slug: "pro-ai" } });
  if (!proAiPlan) { console.log("pro-ai plan not found. Run seed:plans first."); return; }

  for (const m of memberships) {
    await db.subscription.upsert({
      where: { shopId: m.shop.id },
      update: { planId: proAiPlan.id, status: "ACTIVE" },
      create: { shopId: m.shop.id, planId: proAiPlan.id, status: "ACTIVE" },
    });
    console.log(`✅ ${m.shop.slug} upgraded to pro-ai`);
  }

  await db.$disconnect();
}
main();
