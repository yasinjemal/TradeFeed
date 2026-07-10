"use client";

import Link from "next/link";
import { Bell, CheckCheck, Package, RefreshCw, Store } from "lucide-react";
import { useState, useTransition } from "react";

import {
  markAllBuyerNotificationsReadAction,
  markBuyerNotificationReadAction,
  updateBuyerNotificationPreferencesAction,
} from "@/app/actions/buyer-notifications";

type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

type Preferences = {
  orderUpdates: boolean;
  restockAlerts: boolean;
  shopUpdates: boolean;
};

export function BuyerNotificationCentre({
  notifications: initialNotifications,
  preferences: initialPreferences,
}: {
  notifications: Notification[];
  preferences: Preferences;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isPending, startTransition] = useTransition();
  const unread = notifications.filter((item) => !item.readAt).length;

  function markRead(notificationId: string) {
    setNotifications((current) => current.map((item) => (
      item.id === notificationId && !item.readAt ? { ...item, readAt: new Date() } : item
    )));
    startTransition(() => { void markBuyerNotificationReadAction(notificationId); });
  }

  function markAllRead() {
    setNotifications((current) => current.map((item) => (
      item.readAt ? item : { ...item, readAt: new Date() }
    )));
    startTransition(() => { void markAllBuyerNotificationsReadAction(); });
  }

  function savePreferences(next: Preferences) {
    setPreferences(next);
    startTransition(() => { void updateBuyerNotificationPreferencesAction(next); });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-100">Notifications</h1>
          <p className="mt-1 text-sm text-stone-400">Orders, saved products, and shops you follow.</p>
        </div>
        {unread > 0 && (
          <button type="button" disabled={isPending} onClick={markAllRead} className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 disabled:opacity-50">
            <CheckCheck className="size-4" />
            Mark all read
          </button>
        )}
      </div>

      <section className="rounded-2xl border border-stone-800/50 bg-stone-900/40 p-4">
        <h2 className="text-sm font-semibold text-stone-200">What you want to hear about</h2>
        <div className="mt-3 space-y-3">
          <Preference checked={preferences.orderUpdates} disabled={isPending} title="Order updates" detail="Confirmation, delivery and collection status." onChange={(checked) => savePreferences({ ...preferences, orderUpdates: checked })} />
          <Preference checked={preferences.restockAlerts} disabled={isPending} title="Back in stock" detail="Saved products available again." onChange={(checked) => savePreferences({ ...preferences, restockAlerts: checked })} />
          <Preference checked={preferences.shopUpdates} disabled={isPending} title="Shop updates" detail="New products from shops you follow." onChange={(checked) => savePreferences({ ...preferences, shopUpdates: checked })} />
        </div>
      </section>

      <section className="space-y-2">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-stone-800/40 bg-stone-900/30 px-5 py-10 text-center">
            <Bell className="mx-auto size-7 text-stone-600" />
            <p className="mt-3 text-sm font-medium text-stone-300">You&apos;re all caught up</p>
            <p className="mt-1 text-xs text-stone-500">Order updates and alerts from saved products will appear here.</p>
          </div>
        ) : notifications.map((item) => {
          const Icon = item.kind === "ORDER" ? Package : item.kind === "SHOP_DROP" ? Store : RefreshCw;
          const content = <NotificationContent Icon={Icon} item={item} />;
          const classes = `flex gap-3 rounded-xl border p-4 transition-colors ${item.readAt ? "border-stone-800/40 bg-stone-900/25" : "border-emerald-500/20 bg-emerald-500/5"}`;

          return item.href ? (
            <Link key={item.id} href={item.href} onClick={() => markRead(item.id)} className={classes}>
              {content}
            </Link>
          ) : (
            <button key={item.id} type="button" onClick={() => markRead(item.id)} className={`${classes} w-full text-left`}>
              {content}
            </button>
          );
        })}
      </section>
    </div>
  );
}

function NotificationContent({ Icon, item }: { Icon: typeof Package; item: Notification }) {
  return <>
    <Icon className="mt-0.5 size-4 shrink-0 text-emerald-400" />
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-stone-200">{item.title}</p>
      <p className="mt-0.5 text-xs text-stone-400">{item.body}</p>
      <p className="mt-1 text-[11px] text-stone-600">{item.createdAt.toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</p>
    </div>
    {!item.readAt && <span className="mt-1.5 size-2 rounded-full bg-emerald-400" />}
  </>;
}

function Preference({ checked, disabled, title, detail, onChange }: { checked: boolean; disabled: boolean; title: string; detail: string; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-stone-200">{title}</p>
        <p className="text-xs text-stone-500">{detail}</p>
      </div>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-emerald-600" : "bg-stone-700"}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
