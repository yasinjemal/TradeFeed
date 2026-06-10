// ============================================================
// Component — Import Review Grid (Phase 4)
// ============================================================
// Inline-editable draft cards with confidence flags, bulk
// select, publish, and skip. Flagged cards sort to the top.
// Mobile-first: single column on phones, lazy-loaded images.
// ============================================================

"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  updateDraftAction,
  publishDraftsAction,
  skipDraftsAction,
  type ReviewDraft,
} from "@/app/actions/catalogue-import";
import { draftSortWeight } from "@/lib/imports/import-logic";

const FLAG_LABELS: Record<string, { label: string; tone: "amber" | "red" | "slate" }> = {
  low_confidence: { label: "Check details", tone: "amber" },
  no_price_detected: { label: "Needs price", tone: "red" },
  multi_item_photo: { label: "Multiple items?", tone: "amber" },
  possible_duplicate: { label: "Possible duplicate", tone: "amber" },
  watermark_suspected: { label: "Watermark? Use your own photo", tone: "amber" },
  ai_quota_exceeded: { label: "No AI credits — fill in manually", tone: "slate" },
};

interface ImportReviewGridProps {
  shopSlug: string;
  jobId: string;
  initialDrafts: ReviewDraft[];
  onFinish: (publishedCount: number) => void;
}

export function ImportReviewGrid({
  shopSlug,
  jobId,
  initialDrafts,
  onFinish,
}: ImportReviewGridProps) {
  const [drafts, setDrafts] = useState(initialDrafts);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [publishedTotal, setPublishedTotal] = useState(
    initialDrafts.filter((d) => d.status === "PUBLISHED").length
  );

  const sorted = useMemo(
    () => [...drafts].sort((a, b) => draftSortWeight(a.status, a.flags.length) - draftSortWeight(b.status, b.flags.length)),
    [drafts]
  );

  const actionable = drafts.filter((d) => d.status === "READY" || d.status === "NEEDS_REVIEW");

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(actionable.map((d) => d.id)));
  };

  const saveDraft = (id: string, fields: { title?: string; priceInRands?: string; description?: string }) => {
    startTransition(async () => {
      const res = await updateDraftAction(shopSlug, id, fields);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                status: "READY",
                flags: fields.priceInRands ? d.flags.filter((f) => f !== "no_price_detected") : d.flags,
                aiTitle: fields.title ?? d.aiTitle,
                aiDescription: fields.description ?? d.aiDescription,
                aiPriceMinCents: fields.priceInRands
                  ? Math.round(parseFloat(fields.priceInRands) * 100)
                  : d.aiPriceMinCents,
              }
            : d
        )
      );
    });
  };

  const publishSelected = () => {
    const ids = [...selected];
    if (ids.length === 0) {
      toast.error("Select listings to publish first.");
      return;
    }
    startTransition(async () => {
      const res = await publishDraftsAction(shopSlug, jobId, ids);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      if (res.published > 0) toast.success(`${res.published} published! 🎉`);
      for (const failure of res.failed.slice(0, 3)) {
        toast.error(failure.reason);
      }
      const failedIds = new Set(res.failed.map((f) => f.draftId));
      setDrafts((prev) =>
        prev.map((d) =>
          selected.has(d.id) && !failedIds.has(d.id) && (d.status === "READY" || d.status === "NEEDS_REVIEW")
            ? { ...d, status: "PUBLISHED" }
            : d
        )
      );
      setPublishedTotal((n) => n + res.published);
      setSelected(new Set());
    });
  };

  const skipSelected = () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    startTransition(async () => {
      const res = await skipDraftsAction(shopSlug, jobId, ids);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setDrafts((prev) =>
        prev.map((d) => (selected.has(d.id) ? { ...d, status: "SKIPPED" } : d))
      );
      setSelected(new Set());
    });
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Review your listings</h2>
          <p className="text-xs text-slate-500">
            {actionable.length} to review · {publishedTotal} published
          </p>
        </div>
        <button
          type="button"
          onClick={selectAll}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-600"
        >
          Select all
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map((draft) => (
          <DraftCard
            key={draft.id}
            draft={draft}
            selected={selected.has(draft.id)}
            onToggle={() => toggle(draft.id)}
            onSave={(fields) => saveDraft(draft.id, fields)}
          />
        ))}
      </div>

      {/* Sticky bulk action bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <span className="text-xs text-slate-500 flex-shrink-0">{selected.size} selected</span>
          <button
            type="button"
            onClick={skipSelected}
            disabled={isPending || selected.size === 0}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={publishSelected}
            disabled={isPending || selected.size === 0}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {isPending ? "Working…" : `Publish ${selected.size > 0 ? selected.size : ""} selected`}
          </button>
          <button
            type="button"
            onClick={() => onFinish(publishedTotal)}
            disabled={isPending}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
          >
            Finish
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Single draft card ────────────────────────────────────────

function DraftCard({
  draft,
  selected,
  onToggle,
  onSave,
}: {
  draft: ReviewDraft;
  selected: boolean;
  onToggle: () => void;
  onSave: (fields: { title?: string; priceInRands?: string; description?: string }) => void;
}) {
  const [title, setTitle] = useState(draft.aiTitle ?? "");
  const [price, setPrice] = useState(
    draft.aiPriceMinCents ? (draft.aiPriceMinCents / 100).toFixed(2) : ""
  );
  const [dirty, setDirty] = useState(false);

  const inactive = draft.status === "PUBLISHED" || draft.status === "SKIPPED";

  return (
    <div
      className={`rounded-2xl border bg-white overflow-hidden transition-all ${
        inactive
          ? "opacity-50 border-slate-100"
          : selected
            ? "border-emerald-400 ring-1 ring-emerald-400"
            : "border-slate-200"
      }`}
    >
      <div className="flex gap-3 p-3">
        {/* Photo + checkbox */}
        <button
          type="button"
          onClick={inactive ? undefined : onToggle}
          className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-slate-100"
          aria-label={selected ? "Deselect" : "Select"}
        >
          {draft.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.photoUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-2xl">📦</span>
          )}
          {!inactive && (
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-md border-2 flex items-center justify-center text-[10px] font-bold ${
                selected ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white/90 border-slate-300"
              }`}
            >
              {selected ? "✓" : ""}
            </span>
          )}
        </button>

        {/* Fields */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {inactive ? (
            <>
              <p className="text-sm font-semibold text-slate-700 truncate">{draft.aiTitle ?? "Untitled"}</p>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                {draft.status === "PUBLISHED" ? "✅ Published" : "Skipped"}
              </p>
            </>
          ) : (
            <>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
                placeholder="Product name"
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-medium focus:border-emerald-400 outline-none"
              />
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">R</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => { setPrice(e.target.value); setDirty(true); }}
                  placeholder="0.00"
                  className={`w-full rounded-lg border px-2 py-1.5 pl-6 text-sm focus:border-emerald-400 outline-none ${
                    draft.flags.includes("no_price_detected") && !price
                      ? "border-red-300 bg-red-50/50"
                      : "border-slate-200"
                  }`}
                />
              </div>
              {draft.sizes.length > 0 && (
                <p className="text-[11px] text-slate-500 truncate">Sizes: {draft.sizes.join(", ")}</p>
              )}
            </>
          )}

          {/* Flags */}
          {!inactive && draft.flags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {draft.flags.map((flag) => {
                const def = FLAG_LABELS[flag];
                if (!def) return null;
                const tones = {
                  red: "bg-red-50 text-red-700 border-red-200/60",
                  amber: "bg-amber-50 text-amber-700 border-amber-200/60",
                  slate: "bg-slate-50 text-slate-600 border-slate-200/60",
                };
                return (
                  <span
                    key={flag}
                    className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${tones[def.tone]}`}
                  >
                    {def.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {!inactive && dirty && (
        <div className="border-t border-slate-100 px-3 py-2">
          <button
            type="button"
            onClick={() => { onSave({ title, priceInRands: price || undefined }); setDirty(false); }}
            className="w-full rounded-lg bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
          >
            Save changes
          </button>
        </div>
      )}
    </div>
  );
}
