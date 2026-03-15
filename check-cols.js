import { PrismaClient } from './node_modules/@prisma/client/index.js';
const p = new PrismaClient();

async function check() {
  // Check if search_vector column exists
  const cols = await p.$queryRawUnsafe(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'search_vector'"
  );
  console.log('search_vector column exists:', cols.length > 0);

  // Check if trigger still exists
  const triggers = await p.$queryRawUnsafe(
    "SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'Product' AND trigger_name = 'product_search_vector_trigger'"
  );
  console.log('search_vector trigger exists:', triggers.length > 0);

  // Check if the function still exists
  const funcs = await p.$queryRawUnsafe(
    "SELECT routine_name FROM information_schema.routines WHERE routine_name = 'product_search_vector_update'"
  );
  console.log('search_vector function exists:', funcs.length > 0);

  // Check trgm extension
  const ext = await p.$queryRawUnsafe(
    "SELECT extname FROM pg_extension WHERE extname = 'pg_trgm'"
  );
  console.log('pg_trgm extension exists:', ext.length > 0);

  await p.$disconnect();
}
check().catch(e => { console.error(e); process.exit(1); });
