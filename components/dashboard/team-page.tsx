// ============================================================
// Component — Team Page (Client)
// ============================================================
// Full team management UI: header with CTA, plan usage bar,
// operational table with inline role change, ⋯ actions menus,
// invite modal, remove confirmation, and activity strip.
// ============================================================

"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import {
  inviteStaffAction,
  revokeInviteAction,
  removeStaffAction,
  updateStaffRoleAction,
} from "@/app/actions/staff";
import { TEAM_LIMIT_WARNING_THRESHOLD } from "@/lib/config/plan-limits";
import { formatActivityMessage } from "@/lib/config/activity-actions";

// ── Types ──────────────────────────────────────────────────

interface TeamMember {
  role: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
}

interface TeamInvite {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
}

interface ActivityEntry {
  id: string;
  userName: string;
  action: string;
  entityName: string | null;
  metadata: string | null;
  createdAt: Date;
}

interface TeamPageProps {
  shopSlug: string;
  members: TeamMember[];
  invites: TeamInvite[];
  currentUserId: string;
  currentRole: string;
  planName: string;
  staffLimit: number;
  isPro: boolean;
  recentActivity: ActivityEntry[];
}

// ── Constants ──────────────────────────────────────────────

const ROLE_INFO: Record<string, { label: string; description: string }> = {
  OWNER: { label: "Owner", description: "Full access to all shop settings and billing" },
  MANAGER: { label: "Manager", description: "Can edit products, manage orders, and invite members" },
  STAFF: { label: "Staff", description: "Can view orders and update assigned tasks" },
};

// ── Helpers ────────────────────────────────────────────────

function relativeTime(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function parseMetadata(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ── Component ──────────────────────────────────────────────

export function TeamPage({
  shopSlug,
  members,
  invites,
  currentUserId,
  currentRole,
  planName,
  staffLimit,
  isPro,
  recentActivity,
}: TeamPageProps) {
  // State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{
    id: string;
    name: string;
    type: "member" | "invite";
  } | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MANAGER" | "STAFF">("STAFF");
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  // Derived
  const isOwner = members.some(
    (m) => m.user.id === currentUserId && m.role === "OWNER",
  );
  const memberCount = members.length;
  const atLimit = memberCount >= staffLimit;
  const nearLimit =
    !atLimit &&
    memberCount >= Math.floor(staffLimit * TEAM_LIMIT_WARNING_THRESHOLD);
  const seatsLeft = staffLimit - memberCount;

  // ── Effects ────────────────────────────────────

  // Close ⋯ menus on outside click
  useEffect(() => {
    if (!openMenu) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-actions-menu]")) setOpenMenu(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openMenu]);

  // Auto-focus email input when invite modal opens
  useEffect(() => {
    if (showInviteModal) {
      setTimeout(() => emailInputRef.current?.focus(), 50);
    }
  }, [showInviteModal]);

  // Auto-dismiss notices after 4s
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  // Close all overlays on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (showInviteModal) return setShowInviteModal(false);
      if (confirmRemove) return setConfirmRemove(null);
      if (showUpgradeModal) return setShowUpgradeModal(false);
      if (openMenu) return setOpenMenu(null);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showInviteModal, confirmRemove, showUpgradeModal, openMenu]);

  // ── Handlers ───────────────────────────────────

  function openInviteFlow() {
    if (!isPro || atLimit) {
      setShowUpgradeModal(true);
    } else {
      setInviteEmail("");
      setInviteRole("STAFF");
      setShowInviteModal(true);
    }
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await inviteStaffAction(shopSlug, inviteEmail, inviteRole);
      if (result.success) {
        setNotice({ type: "success", message: `Invitation sent to ${inviteEmail}` });
        setInviteEmail("");
        setInviteRole("STAFF");
        setShowInviteModal(false);
      } else if (result.errorCode === "TEAM_LIMIT_REACHED") {
        setShowInviteModal(false);
        setShowUpgradeModal(true);
      } else {
        setNotice({ type: "error", message: result.error ?? "Failed to send invitation" });
      }
    });
  }

  function handleRemoveMember(userId: string) {
    startTransition(async () => {
      const result = await removeStaffAction(shopSlug, userId);
      if (result.success) {
        setNotice({ type: "success", message: "Team member removed" });
      } else {
        setNotice({ type: "error", message: result.error ?? "Failed to remove member" });
      }
      setConfirmRemove(null);
    });
  }

  function handleRevokeInvite(inviteId: string) {
    startTransition(async () => {
      const result = await revokeInviteAction(shopSlug, inviteId);
      if (result.success) {
        setNotice({ type: "success", message: "Invitation revoked" });
      } else {
        setNotice({ type: "error", message: result.error ?? "Failed to revoke invitation" });
      }
      setConfirmRemove(null);
    });
  }

  function handleRoleChange(userId: string, newRole: "MANAGER" | "STAFF") {
    startTransition(async () => {
      const result = await updateStaffRoleAction(shopSlug, userId, newRole);
      if (!result.success) {
        setNotice({ type: "error", message: result.error ?? "Failed to update role" });
      }
    });
  }

  // ── Render ─────────────────────────────────────

  return (
    <div className="max-w-4xl">
      {/* ════════════════════════════════════════════
          1. HEADER — Command Center
          ════════════════════════════════════════════ */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Team
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage access and permissions for your shop
          </p>
        </div>
        {isOwner && (
          <button
            onClick={openInviteFlow}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Invite Member
          </button>
        )}
      </div>

      {/* ════════════════════════════════════════════
          2. PLAN & USAGE BAR — Revenue Driver
          ════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 bg-slate-50/80 rounded-lg mb-6">
        <span className="text-sm text-slate-500">Team Members</span>
        <span className="text-sm font-semibold text-slate-900 tabular-nums">
          {memberCount} / {staffLimit}
        </span>

        {/* Seat dots */}
        <div className="flex items-center gap-0.5">
          {Array.from({ length: staffLimit }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i < memberCount
                  ? atLimit
                    ? "bg-red-400"
                    : nearLimit
                      ? "bg-amber-400"
                      : "bg-emerald-500"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Seat warning */}
        {nearLimit && (
          <span className="text-xs font-medium text-amber-600">
            {seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} left
          </span>
        )}
        {atLimit && (
          <span className="text-xs font-medium text-red-600">No seats left</span>
        )}

        {/* Plan badge + upgrade */}
        <div className="flex items-center gap-3 sm:ml-auto">
          <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
            {planName}
          </span>
          {isOwner && (
            <Link
              href={`/dashboard/${shopSlug}/billing`}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Upgrade
            </Link>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          3. NOTICE BAR
          ════════════════════════════════════════════ */}
      {notice && (
        <div
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg mb-6 text-sm ${
            notice.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            {notice.type === "success" ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            )}
          </svg>
          <span className="flex-1">{notice.message}</span>
          <button
            onClick={() => setNotice(null)}
            className="text-current opacity-40 hover:opacity-70 transition-opacity"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════
          4. TEAM TABLE — Core Operational UI
          ════════════════════════════════════════════ */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {/* Table header — desktop only */}
        <div className="hidden sm:grid grid-cols-[1fr_120px_80px_40px] gap-4 items-center px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Member
          </span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Role
          </span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Status
          </span>
          <span />
        </div>

        {/* ── Active Members ─────────────────── */}
        {members.map((m) => {
          const name =
            [m.user.firstName, m.user.lastName].filter(Boolean).join(" ") ||
            m.user.email;
          const initial = (
            m.user.firstName?.[0] ??
            m.user.email[0] ??
            "?"
          ).toUpperCase();
          const isMe = m.user.id === currentUserId;
          const canManage = isOwner && !isMe && m.role !== "OWNER";

          return (
            <div
              key={m.user.id}
              className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_80px_40px] gap-x-4 items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/40 transition-colors"
            >
              {/* Member info */}
              <div className="flex items-center gap-3 min-w-0">
                {m.user.imageUrl ? (
                  <img
                    src={m.user.imageUrl}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {initial}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {name}
                    {isMe && (
                      <span className="text-slate-400 font-normal ml-1">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{m.user.email}</p>
                  {/* Mobile: role + status inline */}
                  <div className="flex items-center gap-2 mt-0.5 sm:hidden">
                    <span className="text-xs text-slate-400">
                      {ROLE_INFO[m.role]?.label ?? m.role}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Role — desktop */}
              <div className="hidden sm:block">
                {canManage ? (
                  <select
                    value={m.role}
                    onChange={(e) =>
                      handleRoleChange(
                        m.user.id,
                        e.target.value as "MANAGER" | "STAFF",
                      )
                    }
                    disabled={isPending}
                    className="text-xs font-medium border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <option value="MANAGER">Manager</option>
                    <option value="STAFF">Staff</option>
                  </select>
                ) : (
                  <span className="text-xs font-medium text-slate-500">
                    {ROLE_INFO[m.role]?.label ?? m.role}
                  </span>
                )}
              </div>

              {/* Status — desktop */}
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-600">Active</span>
              </div>

              {/* Actions ⋯ */}
              <div className="relative flex justify-end" data-actions-menu>
                {canManage && (
                  <>
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === m.user.id ? null : m.user.id)
                      }
                      className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      aria-label="Member actions"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="3" cy="8" r="1.5" />
                        <circle cx="8" cy="8" r="1.5" />
                        <circle cx="13" cy="8" r="1.5" />
                      </svg>
                    </button>
                    {openMenu === m.user.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-slate-200 shadow-lg shadow-slate-200/50 py-1 z-20">
                        <button
                          onClick={() => {
                            setConfirmRemove({
                              id: m.user.id,
                              name,
                              type: "member",
                            });
                            setOpenMenu(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Remove from team
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* ── Pending Invites ────────────────── */}
        {invites.map((inv) => {
          const initial = (inv.email[0] ?? "?").toUpperCase();

          return (
            <div
              key={inv.id}
              className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_80px_40px] gap-x-4 items-center px-4 py-3 border-b border-slate-100 last:border-0 bg-slate-50/30"
            >
              {/* Invite info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-xs font-semibold flex-shrink-0 border border-dashed border-amber-300">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-600 truncate">{inv.email}</p>
                  {/* Mobile: role + status inline */}
                  <div className="flex items-center gap-2 mt-0.5 sm:hidden">
                    <span className="text-xs text-slate-400">
                      {ROLE_INFO[inv.role]?.label ?? inv.role}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Pending
                    </span>
                  </div>
                </div>
              </div>

              {/* Role — desktop */}
              <div className="hidden sm:block">
                <span className="text-xs text-slate-400">
                  {ROLE_INFO[inv.role]?.label ?? inv.role}
                </span>
              </div>

              {/* Status — desktop */}
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-xs text-amber-600">Pending</span>
              </div>

              {/* Actions ⋯ */}
              <div className="relative flex justify-end" data-actions-menu>
                {isOwner && (
                  <>
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === inv.id ? null : inv.id)
                      }
                      className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      aria-label="Invite actions"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="3" cy="8" r="1.5" />
                        <circle cx="8" cy="8" r="1.5" />
                        <circle cx="13" cy="8" r="1.5" />
                      </svg>
                    </button>
                    {openMenu === inv.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-slate-200 shadow-lg shadow-slate-200/50 py-1 z-20">
                        <button
                          onClick={() => {
                            setConfirmRemove({
                              id: inv.id,
                              name: inv.email,
                              type: "invite",
                            });
                            setOpenMenu(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Revoke invitation
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {members.length === 0 && invites.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">No team members yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Invite people to help manage your shop
            </p>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════
          5. ACTIVITY STRIP — Trust Layer
          ════════════════════════════════════════════ */}
      {currentRole !== "STAFF" && recentActivity.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Recent Activity
            </h2>
            <Link
              href={`/dashboard/${shopSlug}/activity`}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              View all activity &rarr;
            </Link>
          </div>
          <div className="space-y-0">
            {recentActivity.slice(0, 5).map((entry) => {
              const meta = parseMetadata(entry.metadata);
              const message = formatActivityMessage(
                entry.action,
                entry.userName,
                entry.entityName,
                meta,
              );
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 py-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-slate-400 flex-shrink-0 transition-colors" />
                  <p className="text-sm text-slate-600 flex-1 truncate">
                    {message}
                  </p>
                  <span className="text-xs text-slate-400 flex-shrink-0 tabular-nums">
                    {relativeTime(entry.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          MODALS
          ════════════════════════════════════════════ */}

      {/* ── Invite Modal ──────────────────── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowInviteModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Invite team member
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              They&apos;ll receive an email invitation to join your shop.
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  ref={emailInputRef}
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Role
                </label>
                <div className="space-y-2">
                  {(["MANAGER", "STAFF"] as const).map((r) => (
                    <label
                      key={r}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        inviteRole === r
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="invite-role"
                        value={r}
                        checked={inviteRole === r}
                        onChange={() => setInviteRole(r)}
                        className="mt-0.5 accent-slate-900"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {ROLE_INFO[r]?.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {ROLE_INFO[r]?.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending || !inviteEmail}
                className="w-full py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              >
                {isPending ? "Sending invitation\u2026" : "Send invitation"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Remove / Revoke Confirm Modal ── */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmRemove(null)}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {confirmRemove.type === "member"
                ? "Remove team member"
                : "Revoke invitation"}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {confirmRemove.type === "member"
                ? `${confirmRemove.name} will lose access to this shop immediately.`
                : `The invitation to ${confirmRemove.name} will be cancelled.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRemove(null)}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmRemove.type === "member") {
                    handleRemoveMember(confirmRemove.id);
                  } else {
                    handleRevokeInvite(confirmRemove.id);
                  }
                }}
                disabled={isPending}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isPending
                  ? "Removing\u2026"
                  : confirmRemove.type === "member"
                    ? "Remove"
                    : "Revoke"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upgrade Modal ─────────────────── */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowUpgradeModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {!isPro ? "Upgrade to add team members" : "Team limit reached"}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {!isPro
                ? "Team management is available on paid plans. Upgrade to invite and manage team members."
                : `Your ${planName} plan supports ${staffLimit} team member${staffLimit !== 1 ? "s" : ""}. Upgrade to add more.`}
            </p>

            <div className="space-y-2">
              <Link
                href={`/dashboard/${shopSlug}/billing`}
                className="block w-full py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors text-center"
              >
                View plans
              </Link>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
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
