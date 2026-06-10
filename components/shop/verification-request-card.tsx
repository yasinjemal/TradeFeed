// ============================================================
// Component — Get Verified Card (Shop Settings)
// ============================================================
// Sellers request the Verified badge by submitting business
// details. Shows current status (pending/approved/rejected)
// and allows resubmission after rejection.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { submitVerificationAction } from "@/app/actions/verification";

interface VerificationRequestCardProps {
  shopSlug: string;
  isVerified: boolean;
  verification: {
    status: "PENDING" | "APPROVED" | "REJECTED" | "REVOKED";
    legalName: string;
    decisionNote: string | null;
    submittedAt: Date;
  } | null;
}

export function VerificationRequestCard({
  shopSlug,
  isVerified,
  verification,
}: VerificationRequestCardProps) {
  const [isPending, startTransition] = useTransition();
  const [legalName, setLegalName] = useState(verification?.legalName ?? "");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [sellerNote, setSellerNote] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // ── Already verified ────────────────────────────────────
  if (isVerified) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200/60 px-4 py-3">
        <span className="text-xl">✅</span>
        <div>
          <p className="text-sm font-semibold text-emerald-800">Your shop is verified</p>
          <p className="text-xs text-emerald-600">
            Buyers see the Verified badge on your catalog and the marketplace.
          </p>
        </div>
      </div>
    );
  }

  // ── Pending review ──────────────────────────────────────
  if (verification?.status === "PENDING") {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200/60 px-4 py-3">
        <span className="text-xl">⏳</span>
        <div>
          <p className="text-sm font-semibold text-amber-800">Verification under review</p>
          <p className="text-xs text-amber-600">
            Submitted {new Date(verification.submittedAt).toLocaleDateString("en-ZA")} — we
            typically review within 2 business days.
          </p>
        </div>
      </div>
    );
  }

  const wasRejected = verification?.status === "REJECTED";
  const wasRevoked = verification?.status === "REVOKED";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await submitVerificationAction(shopSlug, {
        legalName,
        registrationNumber,
        vatNumber,
        sellerNote,
      });
      if (res.success) {
        setFeedback({ ok: true, text: res.message ?? "Submitted!" });
      } else {
        setFeedback({ ok: false, text: res.error });
      }
    });
  };

  return (
    <div className="space-y-4">
      {(wasRejected || wasRevoked) && (
        <div className="rounded-xl bg-red-50 border border-red-200/60 px-4 py-3">
          <p className="text-sm font-semibold text-red-800">
            {wasRejected ? "Your previous request was not approved" : "Your badge was removed"}
          </p>
          {verification?.decisionNote && (
            <p className="text-xs text-red-600 mt-0.5">Reason: {verification.decisionNote}</p>
          )}
          <p className="text-xs text-red-500 mt-1">You can update your details and resubmit below.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Registered business / owner name *
          </label>
          <input
            type="text"
            required
            minLength={2}
            maxLength={200}
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder="e.g. Marble Tower Fashions (Pty) Ltd"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              CIPC registration number
            </label>
            <input
              type="text"
              maxLength={50}
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">VAT number</label>
            <input
              type="text"
              maxLength={20}
              value={vatNumber}
              onChange={(e) => setVatNumber(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Anything else we should know?
          </label>
          <textarea
            maxLength={1000}
            rows={2}
            value={sellerNote}
            onChange={(e) => setSellerNote(e.target.value)}
            placeholder="e.g. links to your social media, how long you've been trading…"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none resize-none"
          />
        </div>

        {feedback && (
          <p className={`text-xs font-medium ${feedback.ok ? "text-emerald-600" : "text-red-600"}`}>
            {feedback.text}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending || legalName.trim().length < 2}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
        >
          {isPending ? "Submitting…" : wasRejected || wasRevoked ? "Resubmit for review" : "Request verification"}
        </button>
      </form>
    </div>
  );
}
