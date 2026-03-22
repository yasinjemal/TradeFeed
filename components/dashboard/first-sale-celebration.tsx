"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const CONFETTI = ["🎉", "🎊", "✨", "⭐", "🌟", "💚", "🥳", "🎊"];

function ConfettiPiece({ emoji, delay, x }: { emoji: string; delay: number; x: number }) {
  return (
    <motion.span
      className="absolute text-2xl sm:text-3xl pointer-events-none select-none"
      initial={{ y: -40, x, opacity: 1, rotate: 0 }}
      animate={{ y: 500, opacity: 0, rotate: 360 }}
      transition={{ duration: 2.5, delay, ease: "easeIn" }}
      aria-hidden
    >
      {emoji}
    </motion.span>
  );
}

export function FirstSaleCelebration({
  shopName,
  shopSlug,
}: {
  shopName: string;
  shopSlug: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const key = `tradefeed_first_sale_${shopSlug}`;
    if (!localStorage.getItem(key)) {
      setShow(true);
    }
  }, [shopSlug]);

  function dismiss() {
    localStorage.setItem(`tradefeed_first_sale_${shopSlug}`, "1");
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          {/* Confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {CONFETTI.flatMap((emoji, i) =>
              [0, 1, 2].map((j) => (
                <ConfettiPiece
                  key={`${i}-${j}`}
                  emoji={emoji}
                  delay={i * 0.15 + j * 0.3}
                  x={Math.random() * (typeof window !== "undefined" ? window.innerWidth : 400)}
                />
              )),
            )}
          </div>

          {/* Modal */}
          <motion.div
            className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-8 sm:p-10 max-w-md w-full border border-emerald-500/30 shadow-2xl shadow-emerald-900/30 text-center"
            initial={{ scale: 0.8, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-6xl sm:text-7xl mb-4">🎉</div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Congratulations!
            </h2>
            <p className="text-emerald-300 font-medium mt-2 text-lg">
              {shopName} just got its first order!
            </p>

            <p className="text-slate-400 mt-4 text-sm leading-relaxed">
              You&apos;re officially selling on TradeFeed. Want to grow even
              faster? Get <span className="text-emerald-300 font-semibold">50% off Starter</span> for
              3 months.
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href={`/dashboard/${shopSlug}/billing?coupon=FIRSTSALE50`}
                className="block w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-3 text-center hover:from-emerald-400 hover:to-emerald-500 transition-all"
                onClick={dismiss}
              >
                Claim 50% Off Starter →
              </Link>
              <button
                onClick={dismiss}
                className="block w-full rounded-xl bg-slate-800 text-slate-300 font-medium py-3 hover:bg-slate-700 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
