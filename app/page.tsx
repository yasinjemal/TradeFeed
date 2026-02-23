import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export default async function HomePage() {
  // Check if user is signed in and has shops
  const { userId: clerkId } = await auth();
  let dashboardSlug: string | null = null;

  if (clerkId) {
    const user = await db.user.findUnique({
      where: { clerkId },
      select: {
        shops: {
          select: { shop: { select: { slug: true } } },
          take: 1,
          orderBy: { createdAt: "asc" },
        },
      },
    });
    dashboardSlug = user?.shops[0]?.shop.slug ?? null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Trade<span className="text-green-600">Feed</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Digital catalogs for South African clothing wholesalers.
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Replace chaotic WhatsApp selling with structured digital catalogs.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          {clerkId ? (
            <>
              {/* Signed in — go to dashboard or create shop */}
              {dashboardSlug ? (
                <Link
                  href={`/dashboard/${dashboardSlug}`}
                  className="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                >
                  Go to Dashboard →
                </Link>
              ) : (
                <Link
                  href="/create-shop"
                  className="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                >
                  Create Your Shop →
                </Link>
              )}
            </>
          ) : (
            <>
              {/* Not signed in — show auth options */}
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 transition-colors w-48"
              >
                Get Started Free →
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors w-48"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
