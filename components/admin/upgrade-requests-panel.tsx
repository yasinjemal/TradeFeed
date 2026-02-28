// ============================================================
// Component — Upgrade Requests Panel (Admin)
// ============================================================
// Lists all upgrade requests with approve/reject actions.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import {
  approveUpgradeAction,
  rejectUpgradeAction,
} from "@/app/actions/admin";

interface UpgradeRequest {
  id: string;
  upgradeStatus: string;
  requestedPlanSlug: string | null;
  manualPaymentMethod: string | null;
  paymentReference: string | null;
  proofOfPaymentUrl: string | null;
  adminNote: string | null;
  approvedAt: Date | null;
  updatedAt: Date;
  shop: {
    id: string;
    name: string;
    slug: string;
    whatsappNumber: string | null;
  };
  plan: {
    name: string;
    slug: string;
  };
}

interface UpgradeRequestsPanelProps {
  requests: UpgradeRequest[];
}

type TabFilter = "all" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export function UpgradeRequestsPanel({ requests: initialRequests }: UpgradeRequestsPanelProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState<TabFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Admin note state
  const [noteId, setNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const filtered =
    filter === "all"
      ? requests
      : requests.filter((r) => r.upgradeStatus === filter);

  const counts = {
    all: requests.length,
    UNDER_REVIEW: requests.filter((r) => r.upgradeStatus === "UNDER_REVIEW").length,
    APPROVED: requests.filter((r) => r.upgradeStatus === "APPROVED").length,
    REJECTED: requests.filter((r) => r.upgradeStatus === "REJECTED").length,
  };

  const handleApprove = (id: string) => {
    setMessage(null);
    startTransition(async () => {
      const result = await approveUpgradeAction(id, noteText || undefined);
      if (result.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, upgradeStatus: "APPROVED", adminNote: noteText || null, approvedAt: new Date() } : r,
          ),
        );
        setMessage({ type: "success", text: result.message });
        setNoteId(null);
        setNoteText("");
      } else {
        setMessage({ type: "error", text: "error" in result ? result.error : "Failed." });
      }
    });
  };

  const handleReject = (id: string) => {
    if (!noteText.trim()) {
      setMessage({ type: "error", text: "Please add a note explaining the rejection." });
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await rejectUpgradeAction(id, noteText);
      if (result.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, upgradeStatus: "REJECTED", adminNote: noteText } : r,
          ),
        );
        setMessage({ type: "success", text: result.message });
        setNoteId(null);
        setNoteText("");
      } else {
        setMessage({ type: "error", text: "error" in result ? result.error : "Failed." });
      }
    });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "UNDER_REVIEW":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "APPROVED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "REJECTED":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-stone-500/10 text-stone-400 border-stone-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Status message */}
      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-950/50 border-emerald-800 text-emerald-300"
              : "bg-red-950/50 border-red-800 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-1">
        {(["all", "UNDER_REVIEW", "APPROVED", "REJECTED"] as TabFilter[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${
              filter === tab
                ? "text-stone-100 border-red-500"
                : "text-stone-500 border-transparent hover:text-stone-300"
            }`}
          >
            {tab === "all" ? "All" : tab === "UNDER_REVIEW" ? "Pending" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            {counts[tab] > 0 && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-stone-800">
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center">
          <span className="text-3xl block mb-3">⬆️</span>
          <p className="text-sm text-stone-400">No upgrade requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const isExpanded = expandedId === req.id;
            return (
              <div
                key={req.id}
                className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden"
              >
                {/* Header row */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-stone-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-stone-200 truncate">{req.shop.name}</h3>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor(req.upgradeStatus)}`}>
                          {req.upgradeStatus === "UNDER_REVIEW" ? "Pending" : req.upgradeStatus.toLowerCase()}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {req.plan.name} → <span className="text-emerald-400 font-medium">{req.requestedPlanSlug}</span>
                        {" · "}
                        {new Date(req.updatedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-4 h-4 text-stone-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-stone-800/50">
                    <div className="grid gap-4 sm:grid-cols-2 mt-4">
                      {/* Shop info */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Shop Details</h4>
                        <div className="text-xs text-stone-400 space-y-1">
                          <p>Name: <span className="text-stone-200">{req.shop.name}</span></p>
                          <p>Slug: <span className="text-stone-200">{req.shop.slug}</span></p>
                          {req.shop.whatsappNumber && (
                            <p>WhatsApp: <span className="text-stone-200">{req.shop.whatsappNumber}</span></p>
                          )}
                          <a
                            href={`/catalog/${req.shop.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 underline"
                          >
                            View catalog →
                          </a>
                        </div>
                      </div>

                      {/* Payment info */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Payment Details</h4>
                        <div className="text-xs text-stone-400 space-y-1">
                          <p>Method: <span className="text-stone-200">{req.manualPaymentMethod ?? "—"}</span></p>
                          <p>Reference: <span className="text-stone-200 font-mono">{req.paymentReference ?? "—"}</span></p>
                          <p>Requested Plan: <span className="text-emerald-400 font-medium">{req.requestedPlanSlug ?? "—"}</span></p>
                        </div>
                        {req.proofOfPaymentUrl && (
                          <a
                            href={req.proofOfPaymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 underline mt-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            </svg>
                            View Proof of Payment
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Admin note (if already exists) */}
                    {req.adminNote && (
                      <div className="mt-4 p-3 bg-stone-800/50 rounded-xl">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">Admin Note</p>
                        <p className="text-xs text-stone-300">{req.adminNote}</p>
                      </div>
                    )}

                    {/* Approved info */}
                    {req.upgradeStatus === "APPROVED" && req.approvedAt && (
                      <p className="text-xs text-emerald-400 mt-3">
                        ✅ Approved on {new Date(req.approvedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}

                    {/* Actions for pending requests */}
                    {req.upgradeStatus === "UNDER_REVIEW" && (
                      <div className="mt-4 space-y-3">
                        {/* Note input */}
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                            Admin Note {req.upgradeStatus === "UNDER_REVIEW" && "(required for rejection)"}
                          </label>
                          <textarea
                            value={noteId === req.id ? noteText : ""}
                            onChange={(e) => {
                              setNoteId(req.id);
                              setNoteText(e.target.value);
                            }}
                            onFocus={() => {
                              if (noteId !== req.id) {
                                setNoteId(req.id);
                                setNoteText("");
                              }
                            }}
                            placeholder="e.g. Payment verified via bank statement"
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-xs placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 resize-y"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(req.id)}
                            disabled={isPending}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isPending ? "Processing..." : "✅ Approve & Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(req.id)}
                            disabled={isPending}
                            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-medium rounded-lg border border-red-600/30 transition-colors disabled:opacity-50"
                          >
                            {isPending ? "Processing..." : "❌ Reject"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
