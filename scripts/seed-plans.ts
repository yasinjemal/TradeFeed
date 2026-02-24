#!/usr/bin/env tsx
// ============================================================
// Seed Script — Plans
// ============================================================
// Seeds the Free and Pro plans into the database.
// Idempotent — safe to run multiple times.
//
// USAGE: npx tsx scripts/seed-plans.ts
// ============================================================

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding subscription plans...\n");

  // Free plan
  const freePlan = await db.plan.upsert({
    where: { slug: "free" },
    update: {
      name: "Free",
      priceInCents: 0,
      productLimit: 10,
      features: JSON.stringify([
        "Up to 10 products",
        "WhatsApp checkout",
        "Public catalog page",
        "Basic analytics",
      ]),
      isActive: true,
    },
    create: {
      name: "Free",
      slug: "free",
      priceInCents: 0,
      productLimit: 10,
      features: JSON.stringify([
        "Up to 10 products",
        "WhatsApp checkout",
        "Public catalog page",
        "Basic analytics",
      ]),
      isActive: true,
    },
  });
  console.log(`  ✅ Free plan: ${freePlan.id}`);

  // Pro plan
  const proPlan = await db.plan.upsert({
    where: { slug: "pro" },
    update: {
      name: "Pro",
      priceInCents: 19900, // R199.00
      productLimit: 0, // 0 = unlimited
      features: JSON.stringify([
        "Unlimited products",
        "WhatsApp checkout",
        "Public catalog page",
        "Advanced analytics",
        "Priority support",
        "Custom branding (coming soon)",
      ]),
      isActive: true,
    },
    create: {
      name: "Pro",
      slug: "pro",
      priceInCents: 19900,
      productLimit: 0,
      features: JSON.stringify([
        "Unlimited products",
        "WhatsApp checkout",
        "Public catalog page",
        "Advanced analytics",
        "Priority support",
        "Custom branding (coming soon)",
      ]),
      isActive: true,
    },
  });
  console.log(`  ✅ Pro plan:  ${proPlan.id}`);

  console.log("\n🎉 Plans seeded successfully!");
}

main()
  .catch((err) => {
    console.error("💥 Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
