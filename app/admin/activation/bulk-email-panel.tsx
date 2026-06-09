"use client";

import { useState } from "react";
import { sendBulkReengagementAction, type ReengagementFilter } from "@/app/actions/admin";

const FILTER_OPTIONS: { value: ReengagementFilter; label: string; description: string }[] = [
  { value: "all",         label: "All sellers",       description: "Every active shop" },
  { value: "no_products", label: "No products",        description: "Signed up but never added a product" },
];

export function BulkEmailPanel() {
  const [filter, setFilter]         = useState<ReengagementFilter>("no_products");
  const [message, setMessage]       = useState("");
  const [sending, setSending]       = useState(false);
  const [result, setResult]         = useState<{ sent: number; skipped: number; failed: number } | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [confirmed, setConfirmed]   = useState(false);

  async function handleSend() {
    if (!confirmed) { setConfirmed(true); return; }
    setSending(true);
    setError(null);
    setResult(null);
    setConfirmed(false);

    const res = await sendBulkReengagementAction(filter, message);
    setSending(false);

    if (res.success) {
      setResult({ sent: res.sent, skipped: res.skipped, failed: res.failed });
    } else {
      setError(res.error ?? "Something went wrong.");
    }
  }

  return (
    <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6 space-y-5">
      <div>
        <h2 className="text-sm font-bold text-stone-300">Re-engage Inactive Sellers</h2>
        <p className="text-xs text-stone-600 mt-0.5">
          Send a personalised email + WhatsApp community invite to sellers who haven't activated yet.
        </p>
      </div>

      {/* Filter */}
      <div>
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Send to</p>
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setFilter(opt.value); setConfirmed(false); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                filter === opt.value
                  ? "bg-emerald-900/40 border-emerald-500/40 text-emerald-300"
                  : "bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200"
              }`}
            >
              {opt.label}
              <span className="ml-1.5 opacity-60">{opt.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom message */}
      <div>
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
          Custom message <span className="text-stone-700 font-normal normal-case">(optional — replaces default body text)</span>
        </p>
        <textarea
          value={message}
          onChange={(e) => { setMessage(e.target.value); setConfirmed(false); }}
          placeholder="Leave blank to use the default message, or write a personal note..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 placeholder:text-stone-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 resize-none transition-all"
        />
      </div>

      {/* Result */}
      {result && (
        <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-emerald-900/30 border border-emerald-500/20 text-sm">
          <span className="text-emerald-400 font-bold">✓ Sent {result.sent} emails</span>
          {result.skipped > 0 && <span className="text-stone-500">{result.skipped} skipped (no email)</span>}
          {result.failed > 0  && <span className="text-red-400">{result.failed} failed</span>}
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-900/30 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={sending}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
          confirmed
            ? "bg-red-600 hover:bg-red-500 text-white"
            : "bg-emerald-700 hover:bg-emerald-600 text-white"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {sending
          ? "Sending… this may take a minute"
          : confirmed
            ? "Confirm — send emails now"
            : "Send Re-engagement Emails"}
      </button>

      {confirmed && !sending && (
        <p className="text-xs text-center text-amber-400">
          Click again to confirm. This will send real emails.
        </p>
      )}
    </div>
  );
}
