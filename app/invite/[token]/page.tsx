// ============================================================
// Page — Accept Staff Invitation (/invite/[token])
// ============================================================

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { AcceptInviteClient } from "./accept-client";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  const invite = await db.staffInvite.findUnique({
    where: { token },
    include: { shop: { select: { name: true, slug: true, logoUrl: true } } },
  });

  if (!invite || invite.status !== "pending") return notFound();

  const expired = invite.expiresAt < new Date();
  if (expired) {
    await db.staffInvite.update({
      where: { id: invite.id },
      data: { status: "expired" },
    });
    return notFound();
  }

  const user = await getCurrentUser();

  // Not signed in → redirect to sign-up with return URL
  if (!user) {
    redirect(`/sign-up?redirect_url=/invite/${token}`);
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-stone-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 text-center">
            {invite.shop.logoUrl ? (
              <img
                src={invite.shop.logoUrl}
                alt=""
                className="w-16 h-16 rounded-2xl mx-auto mb-4 object-cover border-2 border-white/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-white/10 flex items-center justify-center text-2xl">
                🏪
              </div>
            )}
            <h1 className="text-2xl font-bold text-white">
              Join {invite.shop.name}
            </h1>
            <p className="text-emerald-100 mt-2 text-sm">
              You&apos;ve been invited as a{" "}
              <span className="font-semibold text-white">
                {invite.role === "MANAGER" ? "Manager" : "Staff member"}
              </span>
            </p>
          </div>

          {/* Body */}
          <div className="p-8">
            {user.email.toLowerCase() !== invite.email ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
                <p className="text-sm text-amber-800">
                  This invitation was sent to{" "}
                  <strong>{invite.email}</strong>. You&apos;re signed in as{" "}
                  <strong>{user.email}</strong>.
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  Please sign in with the invited email to accept.
                </p>
              </div>
            ) : (
              <AcceptInviteClient
                token={token}
                shopName={invite.shop.name}
                shopSlug={invite.shop.slug}
                role={invite.role}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
