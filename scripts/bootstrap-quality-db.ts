import {execFileSync} from "node:child_process";
import {PrismaClient} from "@prisma/client";
const db=new PrismaClient();
async function main(){
 const url=new URL(process.env.DATABASE_URL!);
 if(!["localhost","127.0.0.1"].includes(url.hostname)||!/test|quality/.test(url.pathname))throw new Error("Bootstrap only supports an empty local test database.");
 const rows=await db.$queryRaw<Array<{count:bigint}>>`SELECT count(*) FROM information_schema.tables WHERE table_schema='public'`;
 if(Number(rows[0]?.count)!==0)throw new Error("Database is not empty. Refusing to overwrite it.");
 for(const file of ["prisma/baseline/20260916_schema.sql","prisma/migrations/20260916180000_order_reservations/migration.sql","prisma/migrations/20260916190000_review_moderation/migration.sql","prisma/migrations/20260916200000_support_cases/migration.sql","prisma/migrations/20260916210000_restore_product_search/migration.sql","prisma/migrations/20260916220000_listing_quality_grace/migration.sql"]){
   execFileSync(process.execPath,["node_modules/prisma/build/index.js","db","execute","--file",file,"--schema","prisma/schema.prisma"],{stdio:"inherit"});
 }
 console.log("Baseline and release migrations replayed successfully.");
}
main().finally(()=>db.$disconnect());
