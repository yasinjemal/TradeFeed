#!/usr/bin/env tsx
// ============================================================
// Seed Script — Plans
// ============================================================
// Seeds Free, Starter, Pro, and Pro AI plans into the database.
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
      productLimit: 20,
      features: JSON.stringify([
        "Up to 20 products",
        "10 free AI generations",
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
      productLimit: 20,
      features: JSON.stringify([
        "Up to 20 products",
        "10 free AI generations",
        "WhatsApp checkout",
        "Public catalog page",
        "Basic analytics",
      ]),
      isActive: true,
    },
  });
  console.log(`  ✅ Free plan: ${freePlan.id}`);

  // Starter plan
  const starterPlan = await db.plan.upsert({
    where: { slug: "starter" },
    update: {
      name: "Starter",
      priceInCents: 9900, // R99.00
      productLimit: 0, // 0 = unlimited
      features: JSON.stringify([
        "Unlimited products",
        "25 AI generations/month",
        "WhatsApp checkout",
        "Public catalog page",
        "Revenue dashboard",
        "Bulk product upload",
        "Instant order alerts",
        "Buyer reviews & ratings",
      ]),
      isActive: true,
    },
    create: {
      name: "Starter",
      slug: "starter",
      priceInCents: 9900,
      productLimit: 0,
      features: JSON.stringify([
        "Unlimited products",
        "25 AI generations/month",
        "WhatsApp checkout",
        "Public catalog page",
        "Revenue dashboard",
        "Bulk product upload",
        "Instant order alerts",
        "Buyer reviews & ratings",
      ]),
      isActive: true,
    },
  });
  console.log(`  ✅ Starter plan: ${starterPlan.id}`);

  // Pro plan
  const proPlan = await db.plan.upsert({
    where: { slug: "pro" },
    update: {
      name: "Pro",
      priceInCents: 29900, // R299.00
      productLimit: 0, // 0 = unlimited
      features: JSON.stringify([
        "Unlimited products",
        "Unlimited AI generations",
        "Everything in Starter",
        "Priority WhatsApp support",
        "Enhanced promoted listings",
        "Advanced analytics",
        "Team accounts (up to 3)",
      ]),
      isActive: true,
    },
    create: {
      name: "Pro",
      slug: "pro",
      priceInCents: 29900,
      productLimit: 0,
      features: JSON.stringify([
        "Unlimited products",
        "Unlimited AI generations",
        "Everything in Starter",
        "Priority WhatsApp support",
        "Enhanced promoted listings",
        "Advanced analytics",
        "Team accounts (up to 3)",
      ]),
      isActive: true,
    },
  });
  console.log(`  ✅ Pro plan:  ${proPlan.id}`);

  // Pro AI plan
  const proAiPlan = await db.plan.upsert({
    where: { slug: "pro-ai" },
    update: {
      name: "Pro AI",
      priceInCents: 49900, // R499.00
      productLimit: 0, // 0 = unlimited
      features: JSON.stringify([
        "Everything in Pro",
        "Unlimited AI generations",
        "AI auto title from photo",
        "AI product description",
        "AI category suggestion",
        "AI SEO tags & meta",
        "Priority support",
      ]),
      isActive: true,
    },
    create: {
      name: "Pro AI",
      slug: "pro-ai",
      priceInCents: 49900,
      productLimit: 0,
      features: JSON.stringify([
        "Everything in Pro",
        "Unlimited AI generations",
        "AI auto title from photo",
        "AI product description",
        "AI category suggestion",
        "AI SEO tags & meta",
        "Priority support",
      ]),
      isActive: true,
    },
  });
  console.log(`  ✅ Pro AI plan: ${proAiPlan.id}`);

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
