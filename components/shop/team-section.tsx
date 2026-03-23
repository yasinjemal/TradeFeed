// ============================================================
// Component — Team Section (Settings Page)
// ============================================================

"use client";

import { useState, useTransition } from "react";
import {
  inviteStaffAction,
  revokeInviteAction,
  removeStaffAction,
  updateStaffRoleAction,
} from "@/app/actions/staff";

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

  const isOwner = members.some(
    (m) => m.user.id === currentUserId && m.role === "OWNER"
  );

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await inviteStaffAction(shopSlug, email, role);
      if (result.success) {
        setSuccess("Invitation sent!");
        setEmail("");
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
      {/* ── Staff count ─────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-stone-500">
        <span>
          {members.length} / {staffLimit} team member{staffLimit !== 1 ? "s" : ""}
        </span>
        {members.length >= staffLimit && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            Limit reached
          </span>
        )}
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
      {isOwner && isPro && members.length < staffLimit && (
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

      {/* Not Pro upsell */}
      {isOwner && !isPro && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm text-amber-800 font-medium">
            Upgrade to Pro to invite team members and manage staff.
          </p>
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
    </div>
  );
}
