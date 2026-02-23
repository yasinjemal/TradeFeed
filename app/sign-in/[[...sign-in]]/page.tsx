// ============================================================
// Page — Sign In (/sign-in/[[...sign-in]])
// ============================================================
// Clerk's drop-in sign-in component.
// Catch-all route handles all Clerk sign-in flows (MFA, SSO, etc.)
// ============================================================

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Trade<span className="text-green-600">Feed</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to manage your catalog
        </p>
      </div>
      <SignIn
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
