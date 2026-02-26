// ============================================================
// Page — Sign Up (/sign-up/[[...sign-up]])
// ============================================================
// Clerk's drop-in sign-up component.
// Catch-all route handles all Clerk sign-up flows.
// If a ?ref= query param is present, we persist it in a cookie
// so the referral code survives the Clerk auth redirect.
// ============================================================

import { SignUp } from "@clerk/nextjs";
import { cookies } from "next/headers";

interface SignUpPageProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { ref } = await searchParams;

  // Persist referral code in a cookie (30-day expiry) so it survives
  // the Clerk sign-up redirect → /create-shop flow.
  if (ref) {
    const cookieStore = await cookies();
    cookieStore.set("tf_ref", ref, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Trade<span className="text-green-600">Feed</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your account to start selling
        </p>
      </div>
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            cardBox: "shadow-lg",
          },
        }}
      />
    </main>
  );
}
