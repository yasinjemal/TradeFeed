"use client";

import * as React from "react";
import { Minus, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { isPlaceholderOption } from "@/lib/products/buyer-options";

// ============================================================
// TfSizeChips — optional sizes, each with its own stock.
// Tap a chip to add it, tap again to remove it. Every chosen
// size becomes a real option buyers can pick; with none chosen
// the product has a single option and one stock number.
// ============================================================

export interface SizeEntry {
  size: string;
  /** Kept as the raw field text so a seller can clear and retype it. */
  stock: string;
}

interface TfSizeChipsProps {
  /** What the option means for this product: "Size", "Storage", "Weight"… */
  optionLabel: string;
  /** Ready-made values for the chosen category, in groups (e.g. S–5XL, 28–44). */
  presetGroups: string[][];
  presetLabels: string[];
  value: SizeEntry[];
  /** A state setter: every change is applied to the latest list, so quick taps never drop a size. */
  onChange: React.Dispatch<React.SetStateAction<SizeEntry[]>>;
  max: number;
  disabled?: boolean;
  error?: string;
}

const CHIP =
  "min-h-11 min-w-11 cursor-pointer rounded-full border px-3.5 text-sm font-medium outline-none transition-colors duration-150 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-tf-primary focus-visible:ring-offset-2 focus-visible:ring-offset-tf-raised disabled:cursor-not-allowed disabled:opacity-50";

const STEP =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-tf-stone-300 bg-tf-raised text-tf-ink outline-none hover:border-tf-stone-400 hover:bg-tf-stone-50 focus-visible:ring-2 focus-visible:ring-tf-primary disabled:cursor-not-allowed disabled:opacity-40";

function sameSize(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function TfSizeChips({
  optionLabel,
  presetGroups,
  presetLabels,
  value,
  onChange,
  max,
  disabled = false,
  error,
}: TfSizeChipsProps) {
  const [group, setGroup] = React.useState(0);
  const [custom, setCustom] = React.useState("");
  const [customError, setCustomError] = React.useState<string | null>(null);
  // One size picker per screen, so fixed ids are enough.
  const customId = "add-product-size-custom";
  const label = optionLabel.trim() || "Size";
  const lower = label.toLowerCase();

  const presets = presetGroups[Math.min(group, presetGroups.length - 1)] ?? [];
  const isSelected = (size: string) => value.some((entry) => sameSize(entry.size, size));
  const full = value.length >= max;

  const add = (size: string) =>
    onChange((current) =>
      current.length >= max || current.some((entry) => sameSize(entry.size, size))
        ? current
        : [...current, { size, stock: "1" }],
    );
  const remove = (size: string) =>
    onChange((current) => current.filter((entry) => !sameSize(entry.size, size)));
  const toggle = (size: string) => (isSelected(size) ? remove(size) : add(size));

  const addCustom = () => {
    const size = custom.trim();
    if (!size) return;
    if (isPlaceholderOption(size)) {
      setCustomError(`Use the real ${lower} name buyers will pick.`);
      return;
    }
    if (isSelected(size)) {
      setCustomError(`${size} is already added.`);
      return;
    }
    if (full) {
      setCustomError(`You can add up to ${max} here, and more after publishing.`);
      return;
    }
    add(size);
    setCustom("");
    setCustomError(null);
  };

  const setStock = (size: string, stock: string | ((previous: string) => string)) => {
    onChange((current) =>
      current.map((entry) =>
        sameSize(entry.size, size)
          ? { ...entry, stock: typeof stock === "function" ? stock(entry.stock) : stock }
          : entry,
      ),
    );
  };

  const step = (entry: SizeEntry, delta: number) => {
    setStock(entry.size, (previous) => {
      const current = Number.parseInt(previous, 10);
      return String(Math.max(0, (Number.isFinite(current) ? current : 0) + delta));
    });
  };

  return (
    <fieldset disabled={disabled} className="space-y-3">
      <legend className="text-sm font-medium text-tf-ink">
        {label} options <span className="font-normal text-tf-stone-600">(optional)</span>
      </legend>
      <p className="text-sm text-tf-stone-600">
        {presets.length > 0
          ? `Comes in more than one ${lower}? Tap each one you have.`
          : `Comes in more than one ${lower}? Add each one you have.`}
      </p>

      {presetGroups.length > 1 && (
        <div className="flex gap-1 overflow-x-auto" role="group" aria-label={`${label} type`}>
          {presetGroups.map((_, index) => (
            <button
              key={presetLabels[index] ?? index}
              type="button"
              onClick={() => setGroup(index)}
              aria-pressed={index === group}
              className={cn(
                "min-h-11 shrink-0 cursor-pointer rounded-[10px] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-tf-primary",
                index === group
                  ? "bg-tf-stone-100 font-medium text-tf-ink"
                  : "text-tf-stone-600 hover:bg-tf-stone-50",
              )}
            >
              {presetLabels[index] ?? `Set ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((size) => {
            const selected = isSelected(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggle(size)}
                aria-pressed={selected}
                disabled={!selected && full}
                className={cn(
                  CHIP,
                  selected
                    ? "border-tf-ink bg-tf-ink text-tf-surface"
                    : "border-tf-stone-300 bg-tf-raised text-tf-ink hover:border-tf-stone-400 hover:bg-tf-stone-50",
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      )}

      {/* Your own value */}
      <div>
        <label htmlFor={customId} className="sr-only">
          Add your own {lower}
        </label>
        <div className="flex gap-2">
          <input
            id={customId}
            value={custom}
            onChange={(event) => {
              setCustom(event.target.value);
              setCustomError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault(); // never submit the product form from here
                addCustom();
              }
            }}
            maxLength={20}
            placeholder={presets.length > 0 ? `Other ${lower}` : `e.g. 500ml, 128GB, Queen`}
            enterKeyHint="done"
            autoComplete="off"
            className="min-h-11 w-full min-w-0 flex-1 rounded-[10px] border border-tf-stone-300 bg-tf-raised px-3.5 text-base text-tf-ink placeholder:text-tf-stone-400 outline-none focus-visible:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary/25 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={custom.trim() === ""}
            className="min-h-11 shrink-0 cursor-pointer rounded-[10px] border border-tf-stone-300 bg-tf-raised px-4 text-sm font-medium text-tf-ink outline-none hover:border-tf-stone-400 hover:bg-tf-stone-50 focus-visible:ring-2 focus-visible:ring-tf-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {customError && (
          <p role="alert" className="mt-1.5 text-sm text-tf-error">
            {customError}
          </p>
        )}
      </div>

      {/* Stock per chosen size */}
      {value.length > 0 && (
        <ul className="divide-y divide-tf-stone-100 rounded-xl border border-tf-stone-200">
          {value.map((entry, index) => {
            const stockId = `add-product-size-stock-${index}`;
            return (
              <li key={entry.size} className="flex items-center gap-2 p-2 pl-3">
                <label htmlFor={stockId} className="min-w-0 flex-1 truncate text-sm font-medium text-tf-ink">
                  {entry.size}
                  <span className="sr-only"> in stock</span>
                </label>
                <button
                  type="button"
                  onClick={() => step(entry, -1)}
                  disabled={(Number.parseInt(entry.stock, 10) || 0) <= 0}
                  aria-label={`One less ${entry.size}`}
                  className={STEP}
                >
                  <Minus aria-hidden="true" className="size-4" />
                </button>
                <input
                  id={stockId}
                  value={entry.stock}
                  onChange={(event) => setStock(entry.size, event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  placeholder="1"
                  autoComplete="off"
                  className="min-h-11 w-14 rounded-[10px] border border-tf-stone-300 bg-tf-raised px-1 text-center text-base tabular-nums text-tf-ink outline-none focus-visible:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary/25"
                />
                <button
                  type="button"
                  onClick={() => step(entry, 1)}
                  aria-label={`One more ${entry.size}`}
                  className={STEP}
                >
                  <Plus aria-hidden="true" className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(entry.size)}
                  aria-label={`Remove ${entry.size}`}
                  className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] text-tf-stone-600 outline-none hover:bg-tf-stone-100 hover:text-tf-ink focus-visible:ring-2 focus-visible:ring-tf-primary"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-sm text-tf-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
