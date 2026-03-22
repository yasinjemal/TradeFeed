// ============================================================
// Component — Custom Domain Settings (Pro)
// ============================================================
// Full-featured domain management inspired by Shopify/Vercel:
// - 3-step wizard: Add → Configure DNS → Verify
// - Smart DNS instructions (apex vs subdomain detection)
// - SSL certificate status badge
// - Domain swap (change without remove-first)
// - SA registrar quick-links (1-grid, Afrihost, Domains.co.za)
// - Health check with detailed diagnostics
// - Remove with confirmation
// ============================================================

"use client";

import { useState, useTransition, useCallback } from "react";
import {
  addCustomDomainAction,
  verifyCustomDomainAction,
  removeCustomDomainAction,
  checkDomainHealthAction,
} from "@/app/actions/domains";
import type { DomainHealthResult } from "@/lib/vercel/domains";
import Link from "next/link";

// ── SA Registrar guides ───────────────────────────────────
const REGISTRAR_GUIDES = [
  { name: "1-grid", url: "https://1-grid.com/knowledgebase/how-to-change-dns-records/" },
  { name: "Afrihost", url: "https://help.afrihost.com/entries/dns-management" },
  { name: "Domains.co.za", url: "https://www.domains.co.za/support/dns-management" },
  { name: "GoDaddy", url: "https://www.godaddy.com/help/manage-dns-records-680" },
  { name: "Namecheap", url: "https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/" },
] as const;

interface CustomDomainSettingsProps {
  shopSlug: string;
  isPro: boolean;
  currentDomain?: string | null;
  domainStatus?: string | null;
}

type WizardStep = "add" | "dns" | "verify";

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
  const [showSwap, setShowSwap] = useState(false);
  const [health, setHealth] = useState<DomainHealthResult | null>(null);

  const hasDomain = !!currentDomain;
  const isActive = domainStatus === "ACTIVE";
  const isPendingStatus = domainStatus === "PENDING";
  const isError = domainStatus === "ERROR";

  // Determine wizard step
  const step: WizardStep = !hasDomain ? "add" : isActive ? "verify" : "dns";

  // ── Actions ─────────────────────────────────────────

  const handleAdd = useCallback(() => {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await addCustomDomainAction(shopSlug, domain);
      if (result.success) {
        setSuccess("Domain added! Now configure your DNS records below.");
        setShowSwap(false);
      } else {
        setError(result.error ?? "Failed to add domain");
      }
    });
  }, [shopSlug, domain]);

  const handleVerify = useCallback(() => {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await verifyCustomDomainAction(shopSlug);
      if (result.success && result.configured) {
        setSuccess("Domain verified and active! Your shop is live on your custom domain. 🎉");
      } else if (result.success) {
        setError("DNS not yet configured. It can take up to 48 hours to propagate. Try again shortly.");
      } else {
        setError(result.error ?? "Verification failed");
      }
    });
  }, [shopSlug]);

  const handleHealthCheck = useCallback(() => {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await checkDomainHealthAction(shopSlug);
      if (result.success && result.health) {
        setHealth(result.health);
        if (result.health.configured && result.health.sslReady) {
          setSuccess("Everything looks healthy! DNS ✓ SSL ✓");
        } else if (result.health.configured) {
          setSuccess("DNS is configured. SSL certificate is being provisioned…");
        } else {
          setError("DNS is not yet pointing to TradeFeed. Check your records below.");
        }
      } else {
        setError(result.error ?? "Health check failed");
      }
    });
  }, [shopSlug]);

  const handleRemove = useCallback(() => {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await removeCustomDomainAction(shopSlug);
      if (result.success) {
        setDomain("");
        setShowRemoveConfirm(false);
        setHealth(null);
        setSuccess("Domain removed.");
      } else {
        setError(result.error ?? "Failed to remove domain");
      }
    });
  }, [shopSlug]);

  // Detect apex for DNS instructions
  const displayDomain = currentDomain ?? domain;
  const isApex = displayDomain ? isApexDomainClient(displayDomain) : false;

  // ── Non-Pro: upgrade prompt ─────────────────────────
  if (!isPro) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-500">
          Connect your own domain (e.g. shop.yourbrand.co.za) to your TradeFeed storefront for a professional brand experience.
        </p>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <p className="text-sm font-medium text-amber-800">
            🔒 Custom domains are available on the Pro plan.
          </p>
          <ul className="mt-2 space-y-1">
            {["Your own branded URL", "Free SSL certificate (HTTPS)", "Better SEO rankings", "Increased buyer trust"].map((b) => (
              <li key={b} className="text-xs text-amber-700/80 flex items-center gap-1.5">
                <span className="text-emerald-500">✓</span> {b}
              </li>
            ))}
          </ul>
          <Link
            href={`/dashboard/${shopSlug}/billing`}
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors"
          >
            Upgrade to Pro →
          </Link>
        </div>
      </div>
    );
  }

  // ── Pro: full domain management ─────────────────────
  return (
    <div className="space-y-5">
      {/* ── Step Indicator ────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs">
        <StepDot active={step === "add"} done={hasDomain} label="1. Add Domain" />
        <div className="flex-1 h-px bg-slate-200" />
        <StepDot active={step === "dns"} done={isActive} label="2. Configure DNS" />
        <div className="flex-1 h-px bg-slate-200" />
        <StepDot active={step === "verify" && isActive} done={isActive} label="3. Live" />
      </div>

      {/* ── Status Banner ─────────────────────────────── */}
      {hasDomain && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${
          isActive ? "border-emerald-200 bg-emerald-50/50" :
          isError ? "border-red-200 bg-red-50/50" :
          "border-amber-200 bg-amber-50/50"
        }`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-medium text-slate-800">{currentDomain}</span>
              <StatusBadge status={domainStatus} />
              {health?.sslReady && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  🔒 SSL
                </span>
              )}
              {health && !health.sslReady && health.configured && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                  ⏳ SSL Provisioning
                </span>
              )}
              {health?.configuredBy && (
                <span className="text-[10px] text-slate-400 font-mono">
                  via {health.configuredBy}
                </span>
              )}
            </div>
            {isActive && (
              <p className="text-xs text-emerald-700 mt-1">
                Your shop is live at{" "}
                <a href={`https://${currentDomain}`} target="_blank" rel="noopener noreferrer" className="underline font-medium">
                  https://{currentDomain}
                </a>
              </p>
            )}
            {isPendingStatus && (
              <p className="text-xs text-amber-700 mt-1">
                Configure your DNS records below, then click Verify.
              </p>
            )}
            {isError && (
              <p className="text-xs text-red-700 mt-1">
                DNS configuration issue detected. Check your records below or run a health check.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleHealthCheck}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              title="Run health check"
            >
              {isPending ? "…" : "🩺 Health"}
            </button>
            {!showSwap && (
              <button
                onClick={() => setShowSwap(true)}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Change
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Domain Input (add or swap) ────────────────── */}
      {(!hasDomain || showSwap) && (
        <div className="space-y-2">
          {showSwap && (
            <p className="text-xs text-slate-500">
              Enter a new domain to replace <span className="font-mono">{currentDomain}</span>:
            </p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={showSwap ? (domain === currentDomain ? "" : domain) : domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="shop.yourbrand.co.za"
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              disabled={isPending}
              onKeyDown={(e) => { if (e.key === "Enter" && domain.trim()) handleAdd(); }}
            />
            <button
              onClick={handleAdd}
              disabled={isPending || !domain.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Adding…" : showSwap ? "Switch" : "Add Domain"}
            </button>
            {showSwap && (
              <button
                onClick={() => { setShowSwap(false); setDomain(currentDomain ?? ""); }}
                className="px-3 py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── DNS Instructions ──────────────────────────── */}
      {hasDomain && !isActive && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-bold text-sm">Step 2:</span>
            <span className="text-sm font-medium text-blue-800">Configure DNS at your domain registrar</span>
          </div>

          {/* Smart DNS: show only the relevant record type */}
          <div className="space-y-2">
            {isApex ? (
              <>
                <DnsRecord type="A" name="@" value="76.76.21.21" hint="Points your apex domain to TradeFeed" />
                <DnsRecord type="CNAME" name="www" value="cname.vercel-dns.com" hint="Redirects www to your apex domain" />
              </>
            ) : (
              <DnsRecord
                type="CNAME"
                name={displayDomain.split(".")[0] ?? displayDomain}
                value="cname.vercel-dns.com"
                hint="Points your subdomain to TradeFeed"
              />
            )}
          </div>

          {/* Registrar quick links */}
          <div>
            <p className="text-[11px] text-blue-500 mb-1.5">Quick guide for popular registrars:</p>
            <div className="flex flex-wrap gap-1.5">
              {REGISTRAR_GUIDES.map((r) => (
                <a
                  key={r.name}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] px-2 py-1 rounded-md bg-white border border-blue-100 text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  {r.name} ↗
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleVerify}
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Checking…" : "✓ Verify DNS"}
            </button>
            <span className="text-[11px] text-blue-400">DNS changes can take 1–48 hours to propagate</span>
          </div>
        </div>
      )}

      {/* ── Active Domain: SEO Benefits + Health ──────── */}
      {isActive && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 space-y-3">
          <p className="text-sm font-medium text-emerald-800">✅ Your custom domain is active</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "🔒", label: "SSL auto-renewed by Vercel" },
              { icon: "📈", label: "SEO juice builds on your domain" },
              { icon: "🏷️", label: "Branded URL in buyer messages" },
              { icon: "🌍", label: "Global CDN with edge caching" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-xs text-emerald-700/80">
                <span>{b.icon}</span> {b.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Remove Domain ─────────────────────────────── */}
      {hasDomain && (
        <div className="pt-2 border-t border-slate-100">
          {!showRemoveConfirm ? (
            <button
              onClick={() => setShowRemoveConfirm(true)}
              className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
            >
              Remove domain
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                This will disconnect {currentDomain} and revert to tradefeed.co.za/catalog/{shopSlug}
              </span>
              <button
                onClick={handleRemove}
                disabled={isPending}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Removing…" : "Yes, remove"}
              </button>
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Feedback Messages ─────────────────────────── */}
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

// ── Sub-components ────────────────────────────────────────

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${active ? "text-emerald-700 font-semibold" : done ? "text-emerald-500" : "text-slate-400"}`}>
      <div className={`w-2 h-2 rounded-full ${done ? "bg-emerald-500" : active ? "bg-emerald-400 animate-pulse" : "bg-slate-300"}`} />
      <span className="whitespace-nowrap">{label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  if (status === "ACTIVE") {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">🟢 Active</span>;
  }
  if (status === "PENDING") {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">🟡 Pending</span>;
  }
  if (status === "ERROR") {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🔴 Error</span>;
  }
  return null;
}

function DnsRecord({ type, name, value, hint }: { type: string; name: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg bg-white border border-blue-100 p-3">
      <div className="flex items-center gap-3 text-sm">
        <span className="font-mono font-bold text-blue-600 w-16">{type}</span>
        <span className="font-mono text-slate-500">Name:</span>
        <code className="font-mono text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded text-xs">{name}</code>
        <span className="text-slate-400">→</span>
        <code className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-xs">{value}</code>
      </div>
      <p className="text-[11px] text-blue-400 mt-1">{hint}</p>
    </div>
  );
}

/** Client-side apex domain detection (mirrors server isApexDomain). */
function isApexDomainClient(domain: string): boolean {
  const parts = domain.split(".");
  const ccSlds = ["co", "com", "net", "org", "ac", "gov"];
  if (parts.length === 3 && ccSlds.includes(parts[1]!)) return true;
  return parts.length <= 2;
}
