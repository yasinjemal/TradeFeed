"use client";

import { useState, useTransition } from "react";
import { saveBulkDiscountTiersAction } from "@/app/actions/product";
import { Button } from "@/components/ui/button";

interface Tier {
  minQuantity: number;
  discountPercent: number;
}

interface Props {
  shopSlug: string;
  productId: string;
  initialTiers: Tier[];
}

export function BulkDiscountTierEditor({ shopSlug, productId, initialTiers }: Props) {
  const [tiers, setTiers] = useState<Tier[]>(
    initialTiers.length > 0 ? initialTiers : []
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const lastQty = lastTier ? lastTier.minQuantity : 5;
    setTiers([...tiers, { minQuantity: lastQty * 2, discountPercent: 5 }]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof Tier, value: number) => {
    setTiers(tiers.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveBulkDiscountTiersAction(shopSlug, productId, tiers);
      setMessage({
        type: result.success ? "success" : "error",
        text: result.success ? "Discount tiers saved!" : result.error || "Failed to save.",
      });
    });
  };

  return (
    <div className="rounded-xl border-2 border-stone-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
            Bulk Discount Tiers
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Offer volume discounts to encourage larger orders.
          </p>
        </div>
        <button
          onClick={addTier}
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
        >
          + Add Tier
        </button>
      </div>

      {tiers.length === 0 ? (
        <p className="text-xs text-stone-400 text-center py-3">
          No discount tiers set. Click &quot;Add Tier&quot; to create volume discounts.
        </p>
      ) : (
        <div className="space-y-2">
          {tiers
            .sort((a, b) => a.minQuantity - b.minQuantity)
            .map((tier, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="number"
                    min={2}
                    max={99999}
                    value={tier.minQuantity}
                    onChange={(e) =>
                      updateTier(index, "minQuantity", parseInt(e.target.value) || 2)
                    }
                    className="w-20 h-8 rounded-lg border border-stone-200 px-2 text-xs text-stone-900 focus:border-emerald-400 focus:outline-none"
                  />
                  <span className="text-xs text-stone-400">+ units →</span>
                  <input
                    type="number"
                    min={0.1}
                    max={50}
                    step={0.5}
                    value={tier.discountPercent}
                    onChange={(e) =>
                      updateTier(index, "discountPercent", parseFloat(e.target.value) || 0)
                    }
                    className="w-16 h-8 rounded-lg border border-stone-200 px-2 text-xs text-stone-900 focus:border-emerald-400 focus:outline-none"
                  />
                  <span className="text-xs text-stone-400">% off</span>
                </div>
                <button
                  onClick={() => removeTier(index)}
                  className="w-6 h-6 rounded-full text-stone-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
        </div>
      )}

      {message && (
        <p
          className={`text-xs ${
            message.type === "success" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <Button
        onClick={handleSave}
        disabled={isPending}
        size="sm"
        className="w-full bg-emerald-500 hover:bg-emerald-600 h-8 text-xs"
      >
        {isPending ? "Saving..." : "Save Tiers"}
      </Button>
    </div>
  );
}
