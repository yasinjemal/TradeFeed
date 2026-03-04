// ============================================================
// Page — Sign In (/sign-in/[[...sign-in]])
// ============================================================
// Clerk's drop-in sign-in component.
// Catch-all route handles all Clerk sign-in flows (MFA, SSO, etc.)
// ============================================================

import { ClerkLoaded, ClerkLoading, SignIn } from "@clerk/nextjs";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import {
  BarChart3,
  Package,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      {/* ── Left panel — Welcome back ── */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 px-8 py-10 text-white lg:w-1/2 lg:px-16 lg:py-16">
        {/* Background decorative circles */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

        {/* Logo */}
        <div>
          <TradeFeedLogo size="lg" variant="light" />
        </div>

        {/* Hero copy */}
        <div className="relative z-10 my-8 lg:my-0">
          <h1 className="text-3xl font-bold leading-tight tracking-tight lg:text-4xl xl:text-5xl">
            Welcome back,
            <br />
            seller 👋
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/80 lg:text-lg">
            Your catalog is waiting. Sign in to manage your products, check
            orders, and keep selling.
          </p>

          {/* Quick stats reminders */}
          <div className="mt-8 space-y-4">
            {[
              {
                icon: Package,
                title: "Manage your products",
                desc: "Add, edit, and organize your catalog",
              },
              {
                icon: BarChart3,
                title: "Track your sales",
                desc: "See orders, revenue, and analytics",
              },
              {
                icon: MessageCircle,
                title: "Share on WhatsApp",
                desc: "Send catalog links to your buyers",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                  <item.icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="font-semibold leading-snug">{item.title}</p>
                  <p className="text-sm text-white/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust footer */}
        <div className="relative z-10 mt-8 lg:mt-0">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Secure sign-in
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Your data is protected
            </span>
          </div>
        </div>
      </div>

      {/* ── Right panel — Clerk Sign In form ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6 py-10 lg:px-12">
        {/* Mobile-only logo (hidden on desktop since left panel has it) */}
        <div className="mb-6 lg:hidden">
          <TradeFeedLogo size="md" variant="dark" />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick up right where you left off
            </p>
          </div>

          <ClerkLoading>
            <div className="w-full rounded-xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500 shadow-sm">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-emerald-600" />
              Loading secure sign-in…
            </div>
          </ClerkLoading>

          <ClerkLoaded>
            <SignIn
              fallbackRedirectUrl="/create-shop"
              appearance={{
                elements: {
                  rootBox: "mx-auto w-full",
                  cardBox: "shadow-lg rounded-xl border-0 w-full",
                  card: "shadow-none",
                },
              }}
            />
          </ClerkLoaded>
        </div>
      </div>
    </main>
  );
}
