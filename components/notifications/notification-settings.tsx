"use client";

// ============================================================
// Notification Settings — Client Component
// ============================================================
// Toggle notifications, set thresholds, view low-stock items.
// ============================================================

import { useState, useTransition } from "react";
import { updateNotificationPrefsAction } from "@/app/actions/notifications";
import type { NotificationPrefs } from "@/lib/db/notifications";
import Link from "next/link";

interface LowStockVariant {
  id: string;
  productName: string;
  productId: string;
  option1Label: string;
  option1Value: string;
  option2Label: string;
  option2Value: string | null;
  stock: number;
  sku: string | null;
}

interface NotificationSettingsProps {
  prefs: NotificationPrefs;
  lowStockVariants: LowStockVariant[];
  shopSlug: string;
}

export function NotificationSettings({
  prefs,
  lowStockVariants,
  shopSlug,
}: NotificationSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orderNotifications, setOrderNotifications] = useState(prefs.orderNotifications);
  const [lowStockAlerts, setLowStockAlerts] = useState(prefs.lowStockAlerts);
  const [reviewNotifications, setReviewNotifications] = useState(prefs.reviewNotifications);
  const [lowStockThreshold, setLowStockThreshold] = useState(prefs.lowStockThreshold);
  const [notificationEmail, setNotificationEmail] = useState(prefs.notificationEmail ?? "");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaved(false);
    setError(null);

    const formData = new FormData();
    if (orderNotifications) formData.set("orderNotifications", "on");
    if (lowStockAlerts) formData.set("lowStockAlerts", "on");
    if (reviewNotifications) formData.set("reviewNotifications", "on");
    formData.set("lowStockThreshold", String(lowStockThreshold));
    formData.set("notificationEmail", notificationEmail);

    startTransition(async () => {
      const result = await updateNotificationPrefsAction(shopSlug, formData);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error ?? "Failed to save.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-200 bg-white p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-1">Email Notifications</h2>
          <p className="text-sm text-stone-500">Choose which events trigger email notifications.</p>
        </div>

        {/* Notification Email Override */}
        <div>
          <label htmlFor="notificationEmail" className="text-sm font-medium text-stone-700 block mb-1">
            Notification Email
          </label>
          <input
            id="notificationEmail"
            type="email"
            value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
            placeholder="Leave empty to use your account email"
            className="w-full max-w-md rounded-lg border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <p className="text-xs text-stone-400 mt-1">Override the default (shop owner&apos;s email).</p>
        </div>

        {/* Toggle switches */}
        <div className="space-y-4">
          <ToggleSwitch
            id="orderNotifications"
            label="New Order Notifications"
            description="Get emailed when a buyer places an order"
            checked={orderNotifications}
            onChange={setOrderNotifications}
            icon="🛒"
          />
          <ToggleSwitch
            id="lowStockAlerts"
            label="Low Stock Alerts"
            description="Get emailed when variants drop below your threshold"
            checked={lowStockAlerts}
            onChange={setLowStockAlerts}
            icon="⚠️"
          />
          <ToggleSwitch
            id="reviewNotifications"
            label="Review Notifications"
            description="Get emailed when a buyer submits a review"
            checked={reviewNotifications}
            onChange={setReviewNotifications}
            icon="⭐"
          />
        </div>

        {/* Low Stock Threshold */}
        <div>
          <label htmlFor="lowStockThreshold" className="text-sm font-medium text-stone-700 block mb-1">
            Low Stock Threshold
          </label>
          <div className="flex items-center gap-3">
            <input
              id="lowStockThreshold"
              type="number"
              min={0}
              max={9999}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(parseInt(e.target.value, 10) || 0)}
              className="w-24 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <span className="text-sm text-stone-500">units or fewer triggers an alert</span>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-stone-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-stone-800 transition disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Preferences"}
          </button>
          {saved && <span className="text-sm text-emerald-600">✓ Saved!</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>

      {/* Low Stock Items */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Low Stock Items</h2>
            <p className="text-sm text-stone-500">
              Variants with {lowStockThreshold} or fewer units in stock
            </p>
          </div>
          <span
            className={`text-sm font-medium px-3 py-1 rounded-full ${
              lowStockVariants.length > 0
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {lowStockVariants.length} item{lowStockVariants.length !== 1 ? "s" : ""}
          </span>
        </div>

        {lowStockVariants.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-6">
            ✅ All variants are above your threshold. Nice!
          </p>
        ) : (
          <div className="space-y-2">
            {lowStockVariants.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 px-4 py-3"
              >
                <div>
                  <Link
                    href={`/dashboard/${shopSlug}/products/${v.productId}`}
                    className="text-sm font-medium text-stone-900 hover:text-emerald-700 transition"
                  >
                    {v.productName}
                  </Link>
                  <p className="text-xs text-stone-500">
                    {v.option1Label}: {v.option1Value}
                    {v.option2Value ? ` · ${v.option2Label}: ${v.option2Value}` : ""}
                    {v.sku ? ` · SKU: ${v.sku}` : ""}
                  </p>
                </div>
                <span
                  className={`text-sm font-bold px-3 py-1 rounded-full ${
                    v.stock === 0
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {v.stock === 0 ? "Out of stock" : `${v.stock} left`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Toggle Switch ───────────────────────────────────────────

function ToggleSwitch({
  id,
  label,
  description,
  checked,
  onChange,
  icon,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <label htmlFor={id} className="text-sm font-medium text-stone-800 cursor-pointer">
            {label}
          </label>
          <p className="text-xs text-stone-400">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-emerald-500" : "bg-stone-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
