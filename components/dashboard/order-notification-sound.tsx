// ============================================================
// Component — Order Notification Sound
// ============================================================
// Polls for new orders and plays a WhatsApp-style notification
// sound when a new order arrives. Toggle on/off.
// Uses Web Audio API — no audio files needed.
// ============================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface OrderNotificationSoundProps {
  shopId: string;
  /** Initial order count to compare against */
  initialOrderCount: number;
}

/** Generate a WhatsApp-style double-ding using Web Audio API */
function playNotificationSound() {
  try {
    const ctx = new AudioContext();

    // First ding
    const playDing = (startTime: number, freq: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, startTime);

      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    };

    const now = ctx.currentTime;
    playDing(now, 830);        // First ding — B5
    playDing(now + 0.15, 1050); // Second ding — C6 (higher)

    // Clean up context after sounds finish
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Web Audio API not available — fail silently
  }
}

export function OrderNotificationSound({
  shopId,
  initialOrderCount,
}: OrderNotificationSoundProps) {
  const [enabled, setEnabled] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const lastCountRef = useRef(initialOrderCount);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkForNewOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/shops/${shopId}/order-count`);
      if (!res.ok) return;
      const data = (await res.json()) as { count: number };
      if (data.count > lastCountRef.current) {
        lastCountRef.current = data.count;
        setHasNew(true);
        playNotificationSound();
        // Auto-clear the badge after 10 seconds
        setTimeout(() => setHasNew(false), 10000);
      }
    } catch {
      // Network error — silently skip
    }
  }, [shopId]);

  useEffect(() => {
    if (enabled) {
      // Poll every 30 seconds
      intervalRef.current = setInterval(checkForNewOrders, 30000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [enabled, checkForNewOrders]);

  return (
    <button
      type="button"
      onClick={() => {
        const next = !enabled;
        setEnabled(next);
        // Play a test sound when enabling so user knows it works
        if (next) playNotificationSound();
      }}
      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
        enabled
          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
          : "bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200"
      }`}
      title={enabled ? "Order alerts ON — you'll hear a ding for new orders" : "Enable order sound alerts"}
    >
      {hasNew && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        {enabled ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        )}
      </svg>
      {enabled ? "🔔 Alerts ON" : "🔕 Alerts"}
    </button>
  );
}
