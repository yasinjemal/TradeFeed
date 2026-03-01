// ============================================================
// Page — Sign In (/sign-in/[[...sign-in]])
// ============================================================
// Clerk's drop-in sign-in component.
// Catch-all route handles all Clerk sign-in flows (MFA, SSO, etc.)
// ============================================================

import { ClerkLoaded, ClerkLoading, SignIn } from "@clerk/nextjs";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mb-8 text-center flex flex-col items-center">
        <TradeFeedLogo size="lg" variant="dark" />
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in to manage your catalog
        </p>
      </div>

      <ClerkLoading>
        <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-4 text-center text-sm text-stone-600 shadow-sm">
          Loading secure sign-in...
        </div>
      </ClerkLoading>

      <ClerkLoaded>
        <SignIn
          fallbackRedirectUrl="/create-shop"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              cardBox: "shadow-lg",
            },
          }}
        />
      </ClerkLoaded>
    </main>
  );
}
