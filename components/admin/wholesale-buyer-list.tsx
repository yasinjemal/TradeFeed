"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  approveWholesaleBuyerAction,
  rejectWholesaleBuyerAction,
} from "@/app/actions/wholesale";
import { Button } from "@/components/ui/button";

interface WholesaleBuyer {
  id: string;
  phone: string;
  businessName: string;
  contactName: string;
  email: string | null;
  vatNumber: string | null;
  registrationNumber: string | null;
  city: string | null;
  province: string | null;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  verifiedAt: Date | null;
  rejectedReason: string | null;
  createdAt: Date;
}

interface Props {
  data: {
    buyers: WholesaleBuyer[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  currentStatus?: string;
  currentPage: number;
}

const STATUS_COLORS = {
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  VERIFIED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function WholesaleBuyerList({ data, currentStatus, currentPage }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = (buyerId: string) => {
    startTransition(async () => {
      await approveWholesaleBuyerAction(buyerId);
      router.refresh();
    });
  };

  const handleReject = (buyerId: string) => {
    if (!rejectReason.trim()) return;
    startTransition(async () => {
      await rejectWholesaleBuyerAction(buyerId, rejectReason.trim());
      setRejectingId(null);
      setRejectReason("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex gap-2">
        {[
          { label: "All", value: undefined },
          { label: "Pending", value: "PENDING" },
          { label: "Verified", value: "VERIFIED" },
          { label: "Rejected", value: "REJECTED" },
        ].map((tab) => (
          <Link
            key={tab.label}
            href={`/admin/wholesale${tab.value ? `?status=${tab.value}` : ""}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentStatus === tab.value
                ? "bg-amber-500 text-white"
                : "bg-stone-800 text-stone-400 hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        ))}
        <span className="ml-auto text-xs text-stone-500 self-center">
          {data.total} total
        </span>
      </div>

      {/* Buyer cards */}
      {data.buyers.length === 0 ? (
        <div className="text-center py-12 text-stone-500 text-sm">
          No wholesale buyer applications found.
        </div>
      ) : (
        <div className="space-y-3">
          {data.buyers.map((buyer) => (
            <div
              key={buyer.id}
              className="rounded-xl border border-stone-800 bg-stone-900/80 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {buyer.businessName}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        STATUS_COLORS[buyer.status]
                      }`}
                    >
                      {buyer.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {buyer.contactName} · {buyer.phone}
                    {buyer.email && ` · ${buyer.email}`}
                  </p>
                </div>
                <p className="text-[10px] text-stone-500 flex-shrink-0">
                  {new Date(buyer.createdAt).toLocaleDateString("en-ZA")}
                </p>
              </div>

              {/* Details row */}
              <div className="flex flex-wrap gap-3 text-xs text-stone-400">
                {buyer.vatNumber && (
                  <span>VAT: {buyer.vatNumber}</span>
                )}
                {buyer.registrationNumber && (
                  <span>CIPC: {buyer.registrationNumber}</span>
                )}
                {buyer.city && (
                  <span>📍 {buyer.city}{buyer.province ? `, ${buyer.province}` : ""}</span>
                )}
              </div>

              {/* Rejection reason */}
              {buyer.status === "REJECTED" && buyer.rejectedReason && (
                <p className="text-xs text-red-400/80 bg-red-950/30 rounded-lg px-3 py-2">
                  Rejected: {buyer.rejectedReason}
                </p>
              )}

              {/* Actions */}
              {buyer.status === "PENDING" && (
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(buyer.id)}
                    disabled={isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                  >
                    ✅ Approve
                  </Button>
                  {rejectingId === buyer.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection..."
                        className="flex-1 h-8 rounded-lg bg-stone-800 border border-stone-700 px-3 text-xs text-white placeholder:text-stone-500 focus:border-red-500 focus:outline-none"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleReject(buyer.id)}
                        disabled={isPending || !rejectReason.trim()}
                        className="bg-red-600 hover:bg-red-700 h-8 text-xs"
                      >
                        Reject
                      </Button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}
                        className="text-stone-500 hover:text-white text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectingId(buyer.id)}
                      disabled={isPending}
                      className="h-8 text-xs border-stone-700 text-stone-400 hover:text-red-400 hover:border-red-500"
                    >
                      ❌ Reject
                    </Button>
                  )}
                </div>
              )}

              {/* Re-verify rejected */}
              {buyer.status === "REJECTED" && (
                <Button
                  size="sm"
                  onClick={() => handleApprove(buyer.id)}
                  disabled={isPending}
                  className="bg-amber-600 hover:bg-amber-700 h-8 text-xs"
                >
                  🔄 Re-approve
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <Link
                key={pageNum}
                href={`/admin/wholesale?${currentStatus ? `status=${currentStatus}&` : ""}page=${pageNum}`}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                  pageNum === currentPage
                    ? "bg-amber-500 text-white"
                    : "bg-stone-800 text-stone-400 hover:text-white"
                }`}
              >
                {pageNum}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
