// ============================================================
// Component — Team Section (Settings Page)
// ============================================================

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  inviteStaffAction,
  revokeInviteAction,
  removeStaffAction,
  updateStaffRoleAction,
} from "@/app/actions/staff";
import { TEAM_LIMIT_WARNING_THRESHOLD } from "@/lib/config/plan-limits";

interface Member {
  role: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
}

interface Invite {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
}

interface TeamSectionProps {
  shopSlug: string;
  members: Member[];
  invites: Invite[];
  isPro: boolean;
  staffLimit: number;
  currentUserId: string;
}

const ROLE_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  OWNER: { bg: "bg-amber-100", text: "text-amber-700", label: "Owner" },
  MANAGER: { bg: "bg-blue-100", text: "text-blue-700", label: "Manager" },
  STAFF: { bg: "bg-stone-100", text: "text-stone-600", label: "Staff" },
};

export function TeamSection({
  shopSlug,
  members,
  invites,
  isPro,
  staffLimit,
  currentUserId,
}: TeamSectionProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MANAGER" | "STAFF">("STAFF");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isOwner = members.some(
    (m) => m.user.id === currentUserId && m.role === "OWNER"
  );

  const atLimit = members.length >= staffLimit;
  const nearLimit =
    !atLimit && members.length >= Math.floor(staffLimit * TEAM_LIMIT_WARNING_THRESHOLD);
  const usagePercent = Math.round((members.length / staffLimit) * 100);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await inviteStaffAction(shopSlug, email, role);
      if (result.success) {
        setSuccess("Invitation sent!");
        setEmail("");
      } else if (result.errorCode === "TEAM_LIMIT_REACHED") {
        setShowUpgradeModal(true);
      } else {
        setError(result.error ?? "Failed to send invitation.");
      }
    });
  }

  function handleRevoke(inviteId: string) {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await revokeInviteAction(shopSlug, inviteId);
      if (!result.success) setError(result.error ?? "Failed to revoke.");
    });
  }

  function handleRemove(userId: string) {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await removeStaffAction(shopSlug, userId);
      if (!result.success) setError(result.error ?? "Failed to remove.");
    });
  }

  function handleRoleChange(userId: string, newRole: "MANAGER" | "STAFF") {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await updateStaffRoleAction(shopSlug, userId, newRole);
      if (!result.success) setError(result.error ?? "Failed to update role.");
    });
  }

  const badge = (r: string) => {
    const b = ROLE_BADGES[r] ?? ROLE_BADGES.STAFF!;
    return (
      <span
        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${b!.bg} ${b!.text}`}
      >
        {b!.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Staff count with usage bar ──────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">
            {members.length} / {staffLimit} team member{staffLimit !== 1 ? "s" : ""}
          </span>
          {atLimit && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              Limit reached
            </span>
          )}
          {nearLimit && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              Near limit
            </span>
          )}
        </div>
        {/* Usage progress bar */}
        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              atLimit
                ? "bg-red-500"
                : nearLimit
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* ── Members list ────────────────────────────── */}
      <div className="space-y-2">
        {members.map((m) => {
          const name =
            [m.user.firstName, m.user.lastName].filter(Boolean).join(" ") ||
            m.user.email;
          const isMe = m.user.id === currentUserId;
          const canManage = isOwner && !isMe && m.role !== "OWNER";

          return (
            <div
              key={m.user.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-stone-50/50 border border-stone-100"
            >
              {/* Avatar */}
              {m.user.imageUrl ? (
                <img
                  src={m.user.imageUrl}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {(m.user.firstName?.[0] ?? m.user.email[0] ?? "?").toUpperCase()}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-900 truncate">
                  {name} {isMe && <span className="text-stone-400 font-normal">(you)</span>}
                </p>
                <p className="text-xs text-stone-400 truncate">{m.user.email}</p>
              </div>

              {/* Role badge + actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {canManage ? (
                  <select
                    value={m.role}
                    onChange={(e) =>
                      handleRoleChange(
                        m.user.id,
                        e.target.value as "MANAGER" | "STAFF"
                      )
                    }
                    disabled={isPending}
                    className="text-[11px] font-semibold border border-stone-200 rounded-lg px-2 py-1 bg-white text-stone-700"
                  >
                    <option value="MANAGER">Manager</option>
                    <option value="STAFF">Staff</option>
                  </select>
                ) : (
                  badge(m.role)
                )}

                {canManage && (
                  <button
                    onClick={() => handleRemove(m.user.id)}
                    disabled={isPending}
                    className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pending invites ─────────────────────────── */}
      {invites.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Pending Invitations
          </p>
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100"
            >
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-lg flex-shrink-0">
                ✉️
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-700 truncate">
                  {inv.email}
                </p>
                <p className="text-xs text-stone-400">
                  Invited as {ROLE_BADGES[inv.role]?.label ?? inv.role}
                </p>
              </div>
              {isOwner && (
                <button
                  onClick={() => handleRevoke(inv.id)}
                  disabled={isPending}
                  className="text-xs text-stone-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Invite form (OWNER only) ────────────────── */}
      {isOwner && isPro && !atLimit && (
        <form onSubmit={handleInvite} className="space-y-3">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Invite Team Member
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="team@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 text-sm border border-stone-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "MANAGER" | "STAFF")}
              className="text-sm border border-stone-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            >
              <option value="STAFF">Staff</option>
              <option value="MANAGER">Manager</option>
            </select>
            <button
              type="submit"
              disabled={isPending || !email}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Sending…" : "Invite"}
            </button>
          </div>
        </form>
      )}

      {/* ── At-limit upgrade prompt (OWNER, Pro, at limit) ── */}
      {isOwner && isPro && atLimit && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center space-y-2">
          <p className="text-sm text-amber-800 font-medium">
            You&apos;ve reached your limit of {staffLimit} team member{staffLimit !== 1 ? "s" : ""}.
          </p>
          <Link
            href={`/dashboard/${shopSlug}/billing`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            Upgrade Plan
          </Link>
        </div>
      )}

      {/* Not Pro upsell */}
      {isOwner && !isPro && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center space-y-2">
          <p className="text-sm text-amber-800 font-medium">
            Upgrade to Pro to invite team members and manage staff.
          </p>
          <Link
            href={`/dashboard/${shopSlug}/billing`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            Upgrade Plan
          </Link>
        </div>
      )}

      {/* ── Status messages ─────────────────────────── */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2.5">
          {success}
        </p>
      )}

      {/* ── Upgrade Modal ───────────────────────────── */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowUpgradeModal(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Close */}
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon */}
            <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>

            {/* Content */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-stone-900">Team limit reached</h3>
              <p className="text-sm text-stone-500 mt-2 leading-relaxed">
                You&apos;ve reached your limit of {staffLimit} team member{staffLimit !== 1 ? "s" : ""}.
                Upgrade to add more and scale your shop.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Link
                href={`/dashboard/${shopSlug}/billing`}
                className="w-full text-center px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
              >
                Upgrade Plan
              </Link>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full text-center px-5 py-2.5 rounded-xl text-stone-500 hover:bg-stone-100 text-sm font-medium transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
