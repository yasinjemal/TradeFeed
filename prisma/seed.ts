// ============================================================
// Prisma Seed Script
// ============================================================
// Creates a dev user so we can test shop creation without Clerk.
// Phase 3 will replace this with real Clerk-synced users.
//
// RUN: npm run db:seed
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create a dev user (simulates Clerk-synced user)
  // WHY: We need a userId to create shops. No auth in Phase 2.
  const devUser = await prisma.user.upsert({
    where: { email: "yasin@tradefeed.dev" },
    update: {},
    create: {
      clerkId: "dev_user_001", // Fake Clerk ID — replaced in Phase 3
      email: "yasin@tradefeed.dev",
      firstName: "Yasin",
      lastName: "Dev",
    },
  });

  console.log(`✅ Dev user created: ${devUser.email} (ID: ${devUser.id})`);
  console.log("");
  console.log("📋 Copy this User ID for testing:");
  console.log(`   USER_ID=${devUser.id}`);
  console.log("");
  console.log("🌱 Seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
