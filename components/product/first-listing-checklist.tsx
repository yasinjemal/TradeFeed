// ============================================================
// Component — First Listing Checklist (Tutorial)
// ============================================================
// Shows progress for a new seller's first product listing.
// Tracks: photo, price, stock, published status.
// Renders a card with checkmarks and a mini progress bar.
// ============================================================

interface FirstListingChecklistProps {
  hasPhoto: boolean;
  hasPrice: boolean;
  hasStock: boolean;
  isPublished: boolean;
}

const STEPS = [
  { key: "hasPhoto", label: "Add a photo", icon: "📸" },
  { key: "hasPrice", label: "Set your price", icon: "💰" },
  { key: "hasStock", label: "Add stock quantity", icon: "📦" },
  { key: "isPublished", label: "Publish your listing", icon: "🚀" },
] as const;

export function FirstListingChecklist(props: FirstListingChecklistProps) {
  const completed = STEPS.filter((s) => props[s.key]).length;
  const total = STEPS.length;
  const allDone = completed === total;

  if (allDone) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center gap-3">
        <span className="text-2xl">🎉</span>
        <div>
          <p className="text-sm font-semibold text-emerald-800">
            Your first listing is complete!
          </p>
          <p className="text-xs text-emerald-600">
            Great job — share it on WhatsApp to get your first sale.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-800">
          Create your first listing
        </h3>
        <span className="text-xs font-medium text-stone-500">
          {completed}/{total}
        </span>
      </div>

      {/* Mini progress bar */}
      <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <ul className="space-y-2">
        {STEPS.map((step) => {
          const done = props[step.key];
          return (
            <li key={step.key} className="flex items-center gap-2.5">
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                  done
                    ? "bg-emerald-500 text-white"
                    : "bg-stone-200 text-stone-400"
                }`}
              >
                {done ? "✓" : step.icon}
              </span>
              <span
                className={`text-sm ${
                  done
                    ? "text-stone-500 line-through"
                    : "text-stone-800 font-medium"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
