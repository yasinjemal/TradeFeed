"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import {
  getReengagementCampaignPreviewAction,
  sendReengagementTestAction,
  type ReengagementCampaignPreview,
} from "@/app/actions/admin-email-campaigns";

function StatusPill({
  ready,
  readyLabel,
  blockedLabel,
}: {
  ready: boolean;
  readyLabel: string;
  blockedLabel: string;
}) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        ready
          ? "border-emerald-500/25 bg-emerald-950/50 text-emerald-300"
          : "border-amber-500/25 bg-amber-950/40 text-amber-300"
      }`}
    >
      {ready ? readyLabel : blockedLabel}
    </span>
  );
}

export function BulkEmailPanel() {
  const [preview, setPreview] =
    useState<ReengagementCampaignPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showText, setShowText] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadPreview = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await getReengagementCampaignPreviewAction();
      if (!result.success) {
        setError(result.error);
        return;
      }
      setPreview(result.preview);
    });
  }, []);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  function sendTest() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await sendReengagementTestAction();
      if (!result.success) {
        setError(result.error);
        return;
      }
      setNotice(result.message);
    });
  }

  const canSend = preview?.canSend === true;

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900">
      <div className="border-b border-stone-800 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_42%)] px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-400">
              Seller comeback campaign
            </p>
            <h2 className="mt-2 text-xl font-bold text-white">
              Your shop is still here. The hard work got smaller.
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-400">
              A personalised product-news email built around one useful action:
              upload one photo, let AI draft the listing, and return to selling
              through WhatsApp.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill
              ready={preview?.providerReady === true}
              readyLabel="Email provider ready"
              blockedLabel="Provider not configured"
            />
            <StatusPill
              ready={preview?.registryReady === true}
              readyLabel="NCC check recorded"
              blockedLabel="NCC check required"
            />
            <StatusPill
              ready={preview?.sendingEnabled === true}
              readyLabel="Sending enabled"
              blockedLabel="Sending locked"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {isPending && !preview ? (
          <div className="h-28 animate-pulse rounded-xl bg-stone-800/70" />
        ) : preview ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Potential owners",
                  value: preview.potentialOwners,
                  hint: "Active-shop owners with an email",
                },
                {
                  label: "Explicit opt-ins",
                  value: preview.explicitOptIns,
                  hint: "Marketing consent is recorded",
                },
                {
                  label: "Consent unknown",
                  value: preview.unknownConsent,
                  hint: "Excluded from this campaign",
                },
                {
                  label: "Ready to send",
                  value: preview.readyToSend,
                  hint: "Deduplicated and unsuppressed",
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-stone-800 bg-stone-950/45 p-4"
                >
                  <p className="text-xs font-semibold text-stone-500">
                    {card.label}
                  </p>
                  <p className="mt-1 text-3xl font-bold tabular-nums text-white">
                    {card.value.toLocaleString()}
                  </p>
                  <p className="mt-1 text-[11px] text-stone-600">
                    {card.hint}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-4">
                <div className="rounded-xl border border-stone-800 bg-stone-950/45 p-5">
                  <h3 className="text-sm font-bold text-stone-200">
                    Audience safety
                  </h3>
                  <dl className="mt-4 space-y-3 text-xs">
                    {[
                      ["Opted out", preview.optedOut],
                      ["Suppressed", preview.suppressed],
                      ["Banned or invalid", preview.invalidOrBanned],
                      ["Duplicate owner/shop rows removed", preview.deduplicated],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="flex items-center justify-between gap-4"
                      >
                        <dt className="text-stone-500">{label}</dt>
                        <dd className="font-semibold tabular-nums text-stone-300">
                          {Number(value).toLocaleString()}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-950/25 p-5">
                  <h3 className="text-sm font-bold text-amber-200">
                    Why customer sending is locked
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-amber-100/70">
                    Product-news emails are marketing. TradeFeed sends them only
                    to explicit opt-ins, excludes suppression records, includes
                    one-click unsubscribe, and requires a recent NCC
                    Opt-Out Registry cleanse. Existing accounts are never
                    silently treated as consent.
                  </p>
                </div>

                <div className="rounded-xl border border-stone-800 bg-stone-950/45 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    Subject
                  </p>
                  <p className="mt-1 text-sm font-semibold text-stone-200">
                    {preview.subject}
                  </p>
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    Preheader
                  </p>
                  <p className="mt-1 text-xs leading-5 text-stone-400">
                    {preview.preheader}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-stone-800 bg-white">
                <div className="flex items-center justify-between border-b border-stone-200 bg-stone-100 px-4 py-3">
                  <p className="text-xs font-bold text-stone-600">
                    Email preview
                  </p>
                  <div className="flex rounded-lg bg-stone-200 p-0.5 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setShowText(false)}
                      className={`rounded-md px-3 py-1.5 ${
                        showText
                          ? "text-stone-500"
                          : "bg-white text-stone-900 shadow-sm"
                      }`}
                    >
                      Design
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowText(true)}
                      className={`rounded-md px-3 py-1.5 ${
                        showText
                          ? "bg-white text-stone-900 shadow-sm"
                          : "text-stone-500"
                      }`}
                    >
                      Plain text
                    </button>
                  </div>
                </div>
                {showText ? (
                  <pre className="max-h-[720px] min-h-[520px] overflow-auto whitespace-pre-wrap p-6 font-mono text-xs leading-6 text-stone-700">
                    {preview.sampleText}
                  </pre>
                ) : (
                  <iframe
                    title="Seller comeback email preview"
                    sandbox=""
                    srcDoc={preview.sampleHtml}
                    className="h-[720px] w-full bg-stone-50"
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-stone-800 pt-5 sm:flex-row">
              <button
                type="button"
                onClick={sendTest}
                disabled={isPending || !preview.providerReady}
                className="rounded-xl border border-stone-700 bg-stone-800 px-5 py-3 text-sm font-semibold text-stone-200 transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending ? "Working…" : "Send a test to my admin email"}
              </button>
              <button
                type="button"
                disabled={!canSend}
                className="flex-1 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-600"
              >
                {canSend
                  ? `Prepare campaign for ${preview.readyToSend} sellers`
                  : "Customer sending locked — approval workflow not enabled"}
              </button>
              <button
                type="button"
                onClick={loadPreview}
                disabled={isPending}
                className="rounded-xl border border-stone-800 px-4 py-3 text-xs font-semibold text-stone-500 hover:text-stone-300 disabled:opacity-40"
              >
                Refresh counts
              </button>
            </div>
          </>
        ) : null}

        {notice && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/35 px-4 py-3 text-sm text-emerald-300">
            {notice}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-950/35 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}
