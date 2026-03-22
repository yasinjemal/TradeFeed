"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function WhatsAppVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, setActive, isLoaded } = useSignIn();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isLoaded || !signIn || !token) return;

    let cancelled = false;

    async function verify() {
      try {
        const result = await signIn!.create({
          strategy: "ticket",
          ticket: token!,
        });

        if (cancelled) return;

        if (result.status === "complete") {
          setStatus("success");
          await setActive!({ session: result.createdSessionId });
          router.push("/dashboard");
        } else {
          setStatus("error");
          setErrorMessage("Sign-in could not be completed. Please try again.");
        }
      } catch (err: unknown) {
        if (cancelled) return;
        console.error("[whatsapp-verify] Clerk sign-in failed:", err);
        setStatus("error");
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setErrorMessage(message);
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [isLoaded, signIn, setActive, token, router]);

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Missing Token</h1>
          <p className="text-sm text-slate-500 mb-6">
            No login token was found. Please request a new magic link.
          </p>
          <Link
            href="/whatsapp-login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-all"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Login Failed</h1>
          <p className="text-sm text-slate-500 mb-6">{errorMessage}</p>
          <Link
            href="/whatsapp-login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-all"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  // Loading / success — show spinner
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          {status === "success" ? "You're in!" : "Signing you in…"}
        </h1>
        <p className="text-sm text-slate-500">
          {status === "success"
            ? "Redirecting to your dashboard…"
            : "Verifying your WhatsApp login link…"}
        </p>
      </div>
    </div>
  );
}
