// ============================================================
// Component — Admin Seller Verification Queue
// ============================================================
// Lists verification requests with approve/reject actions.
// Mirrors the wholesale-buyer-list admin patterns.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { decideVerificationAction } from "@/app/actions/verification";

interface VerificationRequest {
  id: string;
  shopId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVOKED";
  legalName: string;
  registrationNumber: string | null;
  vatNumber: string | null;
  sellerNote: string | null;
  decisionNote: string | null;
  submittedAt: Date;
  verifiedAt: Date | null;
  shop: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    province: string | null;
    createdAt: Date;
    _count: { products: number; orders: number };
  };
}

interface Props {
  requests: VerificationRequest[];
  currentStatus: string;
}

const STATUS_TABS = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Revoked", value: "REVOKED" },
];

export function VerificationQueue({ requests, currentStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const decide = (shopId: string, approve: boolean, decisionNote?: string) => {
    startTransition(async () => {
      await decideVerificationAction(shopId, approve, decisionNote);
      setRejectingId(null);
      setNote("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/verifications?status=${tab.value}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentStatus === tab.value
                ? "bg-emerald-600 text-white"
                : "bg-stone-800 text-stone-400 hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        ))}
        <span className="ml-auto text-xs text-stone-500 self-center">
          {requests.length} shown
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 text-stone-500 text-sm">
          No {currentStatus.toLowerCase()} verification requests.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border border-stone-800 bg-stone-900/80 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/catalog/${req.shop.slug}`}
                      target="_blank"
                      className="font-semibold text-white hover:text-emerald-400 transition-colors truncate"
                    >
                      {req.shop.name}
                    </Link>
                    <span className="text-xs text-stone-500">
                      {[req.shop.city, req.shop.province].filter(Boolean).join(", ") || "No location"}
                    </span>
                  </div>
                  <p className="text-sm text-stone-300 mt-1">
                    Legal name: <span className="text-white">{req.legalName}</span>
                  </p>
                  <div className="flex gap-4 mt-1 text-xs text-stone-500 flex-wrap">
                    {req.registrationNumber && <span>Reg: {req.registrationNumber}</span>}
                    {req.vatNumber && <span>VAT: {req.vatNumber}</span>}
                    <span>{req.shop._count.products} products</span>
                    <span>{req.shop._count.orders} orders</span>
                    <span>
                      Member since {new Date(req.shop.createdAt).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}
                    </span>
                  </div>
                  {req.sellerNote && (
                    <p className="text-xs text-stone-400 mt-2 italic">&ldquo;{req.sellerNote}&rdquo;</p>
                  )}
                  {req.decisionNote && (
                    <p className="text-xs text-amber-400/80 mt-2">Decision note: {req.decisionNote}</p>
                  )}
                </div>
                <span className="text-xs text-stone-500 flex-shrink-0">
                  {new Date(req.submittedAt).toLocaleDateString("en-ZA")}
                </span>
              </div>

              {req.status === "PENDING" && (
                <div className="flex items-center gap-2 pt-1 border-t border-stone-800/60">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => decide(req.shopId, true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                  {rejectingId === req.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Reason (sent to seller)"
                        className="flex-1 rounded-lg bg-stone-800 border border-stone-700 px-3 py-1.5 text-xs text-white placeholder:text-stone-500"
                      />
                      <button
                        type="button"
                        disabled={isPending || !note.trim()}
                        onClick={() => decide(req.shopId, false, note.trim())}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-500 transition-colors disabled:opacity-50"
                      >
                        Confirm Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRejectingId(null); setNote(""); }}
                        className="text-xs text-stone-500 hover:text-stone-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setRejectingId(req.id)}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700 transition-colors disabled:opacity-50"
                    >
                      Reject…
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
