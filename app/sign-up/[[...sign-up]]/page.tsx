// ============================================================
// Page — Sign Up (/sign-up/[[...sign-up]])
// ============================================================
// Clerk's drop-in sign-up component.
// Catch-all route handles all Clerk sign-up flows.
// ============================================================

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
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
