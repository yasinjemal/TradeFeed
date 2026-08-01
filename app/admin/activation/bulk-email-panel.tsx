"use client";

import {
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";

import {
  getAccountReminderCampaignPreviewAction,
  sendAccountReminderOnceAction,
  sendAccountReminderTestAction,
  type AccountReminderCampaignPreview,
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

function CampaignStatusPill({
  status,
}: {
  status: AccountReminderCampaignPreview["campaignStatus"];
}) {
  const complete = status === "COMPLETED";
  const untouched =
    status === "NOT_STARTED" || status === "DRAFT";
  const label =
    status === "NOT_STARTED"
      ? "Not sent"
      : status
          .toLowerCase()
          .replace(/^\w/, (letter) => letter.toUpperCase());

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        complete
          ? "border-emerald-500/25 bg-emerald-950/50 text-emerald-300"
          : untouched
            ? "border-stone-700 bg-stone-950/45 text-stone-300"
            : "border-amber-500/25 bg-amber-950/40 text-amber-300"
      }`}
    >
      Campaign: {label}
    </span>
  );
}

export function BulkEmailPanel() {
  const [preview, setPreview] =
    useState<AccountReminderCampaignPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showText, setShowText] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadPreview = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result =
        await getAccountReminderCampaignPreviewAction();
      if (!result.success) {
        setError(result.error);
        return;
      }
      setPreview(result.preview);
      setConfirmed(false);
    });
  }, []);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  function sendTest() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await sendAccountReminderTestAction();
      if (!result.success) {
        setError(result.error);
        return;
      }
      setNotice(result.message);
    });
  }

  function sendOnce() {
    if (!preview || !confirmed) return;

    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await sendAccountReminderOnceAction({
        confirmation: "SEND_ACCOUNT_REMINDER_ONCE",
        expectedCount: preview.readyToSend,
      });
      if (!result.success) {
        setError(result.error);
      } else {
        setNotice(result.message);
      }

      const refreshed =
        await getAccountReminderCampaignPreviewAction();
      if (refreshed.success) {
        setPreview(refreshed.preview);
      }
      setConfirmed(false);
    });
  }

  const excludedCount = preview
    ? preview.optedOut +
      preview.suppressed +
      preview.invalidOrBanned +
      preview.sharedEmailAccounts
    : 0;
  const canSend =
    preview?.canSend === true && confirmed && !isPending;
  const isCompleted =
    preview?.campaignStatus === "COMPLETED";
  const isFailed = preview?.campaignStatus === "FAILED";

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900">
      <div className="border-b border-stone-800 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_42%)] px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-400">
              One-time account reminder
            </p>
            <h2 className="mt-2 text-xl font-bold text-white">
              Remind sellers that their TradeFeed shop is still here.
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-400">
              One short, factual email with one action: continue the shop
              already connected to their account. It contains no promotion,
              discount, urgency, or claim that the seller opted in.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill
              ready={preview?.providerReady === true}
              readyLabel="Email provider ready"
              blockedLabel="Provider not configured"
            />
            <StatusPill
              ready={preview?.hmacReady === true}
              readyLabel="Once-only guard ready"
              blockedLabel="Security secret missing"
            />
            {preview && (
              <CampaignStatusPill
                status={preview.campaignStatus}
              />
            )}
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
                  label: "Active shop owners",
                  value: preview.potentialOwners,
                  hint: "One row per unique account owner",
                },
                {
                  label: "Ready for this one send",
                  value: preview.readyToSend,
                  hint: "Unique, valid, and not suppressed",
                },
                {
                  label: "Already reserved or sent",
                  value: preview.alreadyReservedOrSent,
                  hint: "Permanently blocked from a second run",
                },
                {
                  label: "Excluded",
                  value: excludedCount,
                  hint: "Opt-outs, suppressions, invalid or shared emails",
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

            {isCompleted && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/35 p-5">
                <h3 className="text-sm font-bold text-emerald-200">
                  The once-only send is complete.
                </h3>
                <p className="mt-2 text-xs leading-5 text-emerald-100/75">
                  The provider accepted{" "}
                  {preview.providerAcceptedCount.toLocaleString()} message
                  {preview.providerAcceptedCount === 1 ? "" : "s"}.
                  {preview.finalSkippedCount > 0
                    ? ` ${preview.finalSkippedCount.toLocaleString()} account${preview.finalSkippedCount === 1 ? " was" : "s were"} skipped by the final safety check.`
                    : ""}{" "}
                  This campaign cannot be sent again.
                </p>
              </div>
            )}

            {isFailed && (
              <div className="rounded-xl border border-red-500/25 bg-red-950/35 p-5">
                <h3 className="text-sm font-bold text-red-200">
                  The batch failed closed.
                </h3>
                <p className="mt-2 text-xs leading-5 text-red-100/75">
                  TradeFeed will not retry this one-time campaign
                  automatically. Do not start another send until the provider
                  and campaign records have been reconciled.
                </p>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-4">
                <div className="rounded-xl border border-stone-800 bg-stone-950/45 p-5">
                  <h3 className="text-sm font-bold text-stone-200">
                    Audience safeguards
                  </h3>
                  <dl className="mt-4 space-y-3 text-xs">
                    {[
                      ["Explicitly opted out", preview.optedOut],
                      ["Suppressed addresses", preview.suppressed],
                      [
                        "Banned or invalid accounts",
                        preview.invalidOrBanned,
                      ],
                      [
                        "Shared email accounts excluded",
                        preview.sharedEmailAccounts,
                      ],
                      [
                        "Duplicate shop memberships removed",
                        preview.duplicateShopMemberships,
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="flex items-center justify-between gap-4"
                      >
                        <dt className="text-stone-500">
                          {label}
                        </dt>
                        <dd className="font-semibold tabular-nums text-stone-300">
                          {Number(value).toLocaleString()}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/25 p-5">
                  <h3 className="text-sm font-bold text-emerald-200">
                    What the button does
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-emerald-100/70">
                    TradeFeed freezes the reviewed audience, creates one
                    personalised message per account, submits them in one
                    provider batch, and records every provider message ID.
                    Addresses are never exposed through BCC. A fixed campaign
                    key prevents a second run.
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
                    Exact email preview
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
                  <pre className="max-h-[650px] min-h-[520px] overflow-auto whitespace-pre-wrap p-6 font-mono text-xs leading-6 text-stone-700">
                    {preview.sampleText}
                  </pre>
                ) : (
                  <iframe
                    title="One-time account reminder email preview"
                    sandbox=""
                    srcDoc={preview.sampleHtml}
                    className="h-[650px] w-full bg-stone-50"
                  />
                )}
              </div>
            </div>

            {!isCompleted && !isFailed && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-950/25 p-4">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) =>
                    setConfirmed(event.target.checked)
                  }
                  disabled={
                    isPending ||
                    !preview.canSend ||
                    preview.readyToSend === 0
                  }
                  className="mt-0.5 size-4 accent-emerald-500"
                />
                <span className="text-xs leading-5 text-amber-100/80">
                  I reviewed the exact email and audience. Send it once to{" "}
                  <strong className="text-amber-100">
                    {preview.readyToSend.toLocaleString()} eligible account
                    {preview.readyToSend === 1 ? "" : "s"}
                  </strong>
                  . This cannot be undone or sent a second time.
                </span>
              </label>
            )}

            <div className="flex flex-col gap-3 border-t border-stone-800 pt-5 sm:flex-row">
              <button
                type="button"
                onClick={sendTest}
                disabled={isPending || !preview.providerReady}
                className="rounded-xl border border-stone-700 bg-stone-800 px-5 py-3 text-sm font-semibold text-stone-200 transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending
                  ? "Working…"
                  : "Send a test to my admin email"}
              </button>
              <button
                type="button"
                onClick={sendOnce}
                disabled={!canSend}
                className="flex-1 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-600"
              >
                {isCompleted
                  ? "One-time reminder already sent"
                  : isFailed
                    ? "Campaign locked after failure"
                    : preview.readyToSend >
                        preview.maxRecipients
                      ? `Audience exceeds the ${preview.maxRecipients} message limit`
                      : preview.canSend
                        ? `Send one-time reminder to ${preview.readyToSend.toLocaleString()} accounts`
                        : "One-time reminder is not ready"}
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
