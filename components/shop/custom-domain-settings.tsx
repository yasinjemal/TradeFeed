// ============================================================
// Component — Custom Domain Settings
// ============================================================
// Pro sellers can connect a custom domain to their storefront.
// Shows domain input, DNS instructions, verification, status.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import {
  addCustomDomainAction,
  verifyCustomDomainAction,
  removeCustomDomainAction,
} from "@/app/actions/domains";
import Link from "next/link";

interface CustomDomainSettingsProps {
  shopSlug: string;
  isPro: boolean;
  currentDomain?: string | null;
  domainStatus?: string | null;
}

export function CustomDomainSettings({
  shopSlug,
  isPro,
  currentDomain,
  domainStatus,
}: CustomDomainSettingsProps) {
  const [domain, setDomain] = useState(currentDomain ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const hasDomain = !!currentDomain;
  const isActive = domainStatus === "ACTIVE";
  const isPendingStatus = domainStatus === "PENDING";

  function handleAdd() {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await addCustomDomainAction(shopSlug, domain);
      if (result.success) {
        setSuccess("Domain added! Configure your DNS records below, then verify.");
      } else {
        setError(result.error ?? "Failed to add domain");
      }
    });
  }

  function handleVerify() {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await verifyCustomDomainAction(shopSlug);
      if (result.success && result.configured) {
        setSuccess("Domain verified and active! Your shop is live on your custom domain.");
      } else if (result.success) {
        setError("DNS not yet configured. It can take up to 48 hours for DNS changes to propagate.");
      } else {
        setError(result.error ?? "Verification failed");
      }
    });
  }

  function handleRemove() {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await removeCustomDomainAction(shopSlug);
      if (result.success) {
        setDomain("");
        setShowRemoveConfirm(false);
        setSuccess("Domain removed successfully.");
      } else {
        setError(result.error ?? "Failed to remove domain");
      }
    });
  }

  // Non-Pro: show upgrade prompt
  if (!isPro) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-500">
          Connect your own domain (e.g. shop.yourbrand.co.za) to your TradeFeed storefront.
        </p>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <p className="text-sm font-medium text-amber-800">
            🔒 Custom domains are available on the Pro plan.
          </p>
          <Link
            href={`/dashboard/${shopSlug}/billing`}
            className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors"
          >
            Upgrade to Pro →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Connect your own domain to your TradeFeed storefront. Buyers will see your brand, not ours.
      </p>

      {/* Status badge */}
      {hasDomain && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">{currentDomain}</span>
          {isActive && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">
              🟢 Active
            </span>
          )}
          {isPendingStatus && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full">
              🟡 Pending DNS
            </span>
          )}
          {domainStatus === "ERROR" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full">
              🔴 Error
            </span>
          )}
        </div>
      )}

      {/* Domain input (show when no domain set or editing) */}
      {!hasDomain && (
        <div className="flex gap-2">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="shop.yourbrand.co.za"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
            disabled={isPending}
          />
          <button
            onClick={handleAdd}
            disabled={isPending || !domain.trim()}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Adding…" : "Add Domain"}
          </button>
        </div>
      )}

      {/* DNS Instructions (show after domain added but not yet active) */}
      {hasDomain && !isActive && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <p className="text-sm font-medium text-blue-800">
            Configure DNS at your domain registrar:
          </p>
          <div className="space-y-2">
            <div className="rounded-lg bg-white border border-blue-100 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-1">
                For subdomains (e.g. shop.yourbrand.co.za)
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-mono text-slate-600">CNAME</span>
                <span className="text-slate-400">→</span>
                <code className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  cname.vercel-dns.com
                </code>
              </div>
            </div>
            <div className="rounded-lg bg-white border border-blue-100 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-1">
                For apex domains (e.g. yourbrand.co.za)
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-mono text-slate-600">A</span>
                <span className="text-slate-400">→</span>
                <code className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  76.76.21.21
                </code>
              </div>
            </div>
          </div>
          <button
            onClick={handleVerify}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Checking…" : "Verify DNS"}
          </button>
        </div>
      )}

      {/* Remove domain */}
      {hasDomain && (
        <div className="pt-2 border-t border-slate-100">
          {!showRemoveConfirm ? (
            <button
              onClick={() => setShowRemoveConfirm(true)}
              className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Remove domain
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">Remove {currentDomain}?</span>
              <button
                onClick={handleRemove}
                disabled={isPending}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Removing…" : "Yes, remove"}
              </button>
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Feedback messages */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          {success}
        </p>
      )}
    </div>
  );
}
